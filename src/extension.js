'use strict';

const path = require('path');
const fs = require('fs');
const Docker = require('dockerode');
const vscode = require('vscode');
const docker = new Docker();
const config = vscode.workspace.getConfiguration('mythril-vsc');

function normalizePath(filePath) {
  if (process.platform === 'win32') {
    return filePath
      .replace(/\\/g, '/')
      .replace(/^([A-Za-z]):/, '/host_mnt/$1')
      .toLowerCase();
  }
  return filePath;
}

function getCompilerVersion(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const pragmaLine = fileContent
    .split('\n')
    .find((line) => line.startsWith('pragma solidity'));
  if (pragmaLine) {
    const versionRange = pragmaLine.split(' ')[2];
    const cleanVersion = versionRange.replace(/[^0-9.]/g, '').trim();
    return cleanVersion;
  } else {
    return false;
  }
}

async function ensureDockerImage(imageName) {
  try {
    await docker.ping();
  } catch (err) {
    vscode.window.showErrorMessage(
      'Error: Docker Desktop is not running. Please start Docker Desktop.'
    );
    console.error('Error:', err);
    return;
  }

  const images = await docker.listImages();
  const imageExists = images.some(
    (image) => image.RepoTags && image.RepoTags.includes(imageName)
  );
  if (!imageExists) {
    vscode.window.showInformationMessage(`Pulling Docker image: ${imageName}`);
    await new Promise((resolve, reject) => {
      docker.pull(imageName, {}, (err, stream) => {
        if (err) {
          vscode.window.showErrorMessage(
            `Failed to pull Docker image: ${err.message}`
          );
          return reject(err);
        }
        docker.modem.followProgress(stream, (err, res) =>
          err ? reject(err) : resolve(res)
        );
      });
    });
  }
}

function hasOzImport(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return fileContent.includes('@openzeppelin');
}

function createMappingsFile(fileDir) {
  const mappingsPath = path.join(fileDir, 'mappings.json');
  const mappingsContent = JSON.stringify(
    {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      remappings: ['@openzeppelin/=/tmp/node_modules/@openzeppelin/'],
    },
    null,
    2
  );
  fs.writeFileSync(mappingsPath, mappingsContent);
}

async function launchCommand(baseName, fileDir) {
  const fullPath = path.join(fileDir, `${baseName}-output.md`);
  const sourceFilePath = path.join(fileDir, baseName);

  if (!fs.existsSync(sourceFilePath)) {
    throw new Error(`Source file not found: ${sourceFilePath}`);
  }

  const solcVersion = getCompilerVersion(sourceFilePath);
  const solcFlag = solcVersion ? `--solv ${solcVersion}` : '';

  const dockerSourceFilePath = normalizePath(sourceFilePath);
  console.log('Mounting file:', {
    originalSourceFile: sourceFilePath,
    dockerSourceFile: dockerSourceFilePath,
  });

  const imageName = 'mythril/myth:latest';
  await ensureDockerImage(imageName);
  const generateMappingsFile = config.get('generateconfigFile', true);

  if (generateMappingsFile) {
    createMappingsFile(fileDir);
  }

  const mappingsFilePath = path.join(fileDir, 'mappings.json');
  const mappingsPath = normalizePath(mappingsFilePath);

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    throw new Error('No workspace folder found');
  }
  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const nodeModulesPath = path.join(workspaceRoot, 'node_modules');
  const normalizedNodeModulesPath = normalizePath(nodeModulesPath);

  const binds = [`${fileDir}:/tmp/`, `${mappingsPath}:/tmp/mappings.json`];

  if (fs.existsSync(nodeModulesPath)) {
    binds.push(`${normalizedNodeModulesPath}:/tmp/node_modules`);
  } else {
    console.warn(
      `Warning: node_modules directory does not exist at ${nodeModulesPath}`
    );
  }

  const executionTimeout = config.get('executionTimeout', 60);

  const containerOptions = {
    Image: imageName,
    Cmd: [
      'sh',
      '-c',
      `myth analyze /tmp/${baseName} ${solcFlag} --solc-json /tmp/mappings.json -o markdown --execution-timeout ${executionTimeout}`,
    ],
    Tty: false,
    HostConfig: {
      AutoRemove: true,
      Binds: binds,
    },
    WorkingDir: '/tmp',
  };

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Analyzing contract...',
      cancellable: true,
    },
    (progress, token) =>
      new Promise((resolve, reject) => {
        docker
          .createContainer(containerOptions)
          .then((container) => {
            let output = '';
            let hasError = false;

            container.attach(
              { stream: true, stdout: true, stderr: true },
              (err, stream) => {
                if (err) {
                  return rejectWithError('Attach error:', err, reject);
                }

                stream.on('data', (data) => {
                  const chunk = data.toString();
                  console.log('Container output:', chunk);
                  output += chunk;

                  if (
                    chunk.includes('Solc experienced a fatal error') ||
                    chunk.includes('SyntaxError') ||
                    chunk.includes(
                      'mythril.interfaces.cli [ERROR]: Traceback'
                    ) ||
                    chunk.includes('ValueError: Invalid version string')
                  ) {
                    hasError = true;
                  }
                });

                stream.on('end', () => {
                  if (!hasError) {
                    try {
                      const formattedOutput = formatOutput(output);
                      if (formattedOutput.trim()) {
                        fs.writeFileSync(fullPath, formattedOutput);
                        vscode.commands.executeCommand(
                          'vscode.open',
                          vscode.Uri.file(fullPath)
                        );
                      }
                      resolve();
                    } catch (err) {
                      rejectWithError('Error writing file:', err, reject);
                    }
                  } else {
                    resolve();
                  }
                });

                stream.on('error', (err) => {
                  hasError = true;
                  rejectWithError('Stream error:', err, reject);
                });
              }
            );

            container
              .start()
              .catch((err) =>
                rejectWithError('Container start error:', err, reject)
              );

            token.onCancellationRequested(() => {
              container
                .stop()
                .then(() => {
                  vscode.window.showInformationMessage(
                    'Myth-VSC: analysis cancelled.'
                  );
                  reject(new Error('Myth-VSC: analysis cancelled.'));
                })
                .catch((err) => rejectWithError('Stop error:', err, reject));
            });
          })
          .catch((err) =>
            rejectWithError('Container creation error:', err, reject)
          );
      })
  );
}
function formatOutput(output) {
  return output
    .replace(/^[^#]*/, '')
    .replace(/## /g, '\n## ')
    .replace(/### /g, '\n### ')
    .replace(/```/g, '\n```\n')
    .replace(/- /g, '\n- ');
}

function rejectWithError(message, err, reject) {
  console.error(message, err);
  vscode.window.showErrorMessage(`Myth-VSC: ${err.message}`);
  reject(err);
}

function analyzeCommand(fileUri) {
  try {
    const filePath = fileUri
      ? fileUri.fsPath
      : vscode.window.activeTextEditor.document.fileName;
    if (!filePath) {
      throw new Error('No file selected');
    }

    const baseName = path.basename(filePath);
    const fileDir = path.dirname(filePath);

    if (filePath.endsWith('.sol')) {
      launchCommand(baseName, fileDir).catch((err) => {
        console.error('Launch command error:', err);
        vscode.window.showErrorMessage(`Myth-VSC: ${err.message}`);
      });
    } else {
      throw new Error(
        'This command is only available for Solidity files (.sol).'
      );
    }
  } catch (err) {
    console.error('Analyze command error:', err);
    vscode.window.showErrorMessage(`Myth-VSC: ${err.message}`);
  }
}

module.exports = {
  activate: (context) => {
    const disposable = vscode.commands.registerCommand(
      'mythril-vsc.analyze',
      analyzeCommand
    );
    context.subscriptions.push(disposable);
  },
};
