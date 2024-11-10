/* eslint-disable strict */
const path = require('path');
const fs = require('fs');
const Docker = require('dockerode');
const vscode = require('vscode');

const docker = new Docker();

function normalizePath(windowsPath) {
  let posixPath = windowsPath.replace(/\\/g, '/');
  if (/^[A-Za-z]:/.test(posixPath)) {
    posixPath = posixPath.replace(/^([A-Za-z]):/, '/host_mnt/$1').toLowerCase();
  }
  return posixPath;
}

async function launchCommand(baseName, fileDir) {
  const fullPath = path.join(fileDir, `${baseName}-output.md`);
  const progressLocation = vscode.ProgressLocation.Notification;

  const sourceFilePath = path.join(fileDir, baseName);
  if (!fs.existsSync(sourceFilePath)) {
    throw new Error(`Source file not found: ${sourceFilePath}`);
  }

  const dockerSourceFilePath = normalizePath(sourceFilePath);

  console.log('Mounting file:', {
    originalSourceFile: sourceFilePath,
    dockerSourceFile: dockerSourceFilePath
  });

  const containerOptions = {
    Image: 'mythril/myth',
    Cmd: [
      'sh',
      '-c',
      `myth analyze /tmp/${baseName} --solv 0.5.0 -o markdown --execution-timeout 60`
    ],
    Tty: false,
    HostConfig: {
      AutoRemove: true,
      Binds: [`${dockerSourceFilePath}:/tmp/${baseName}`]
    },
    WorkingDir: '/tmp'
  };

  await vscode.window.withProgress(
    {
      location: progressLocation,
      title: 'Analyzing contract...',
      cancellable: true,
    },
    async (progress, token) => {
      return new Promise((resolve, reject) => {
        docker.createContainer(containerOptions)
          .then(container => {
            let output = '';

            container.attach({stream: true, stdout: true, stderr: true}, (err, stream) => {
              if (err) {
                console.error('Attach error:', err);
                reject(err);
                return;
              }

              stream.on('data', (data) => {
                const chunk = data.toString();
                console.log('Container output:', chunk);
                output += chunk;
              });

              stream.on('end', () => {
                try {
                  // Clean the output to remove any non-printable characters
                  const cleanOutput = output.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

                  // Ensure proper markdown formatting
                  const formattedOutput = cleanOutput
                    .replace(/## /g, '\n## ') // Ensure new lines before subheadings
                    .replace(/### /g, '\n### ') // Ensure new lines before sub-subheadings
                    .replace(/```/g, '\n```\n') // Ensure new lines around code blocks
                    .replace(/- /g, '\n- '); // Ensure new lines before list items

                  fs.writeFileSync(fullPath, formattedOutput);
                  vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fullPath));
                  resolve();
                } catch (err) {
                  console.error('Error writing file:', err);
                  vscode.window.showErrorMessage(`Error writing output file: ${err.message}`);
                  reject(err);
                }
              });

              stream.on('error', (err) => {
                console.error('Stream error:', err);
                reject(err);
              });
            });

            container.start()
              .catch(err => {
                console.error('Container start error:', err);
                reject(err);
              });

            token.onCancellationRequested(() => {
              container.stop()
                .then(() => {
                  vscode.window.showInformationMessage('Myth-VSC: analysis cancelled.');
                  reject(new Error('Myth-VSC: analysis cancelled.'));
                })
                .catch(err => {
                  console.error('Stop error:', err);
                  vscode.window.showErrorMessage(`Myth-VSC: Error stopping Docker container: ${err.message}`);
                  reject(err);
                });
            });
          })
          .catch(err => {
            console.error('Container creation error:', err);
            vscode.window.showErrorMessage(`Myth-VSC: ERROR: ${err.message}`);
            reject(err);
          });
      });
    }
  );
}

function analyzeCommand(fileUri) {
  try {
    const filePath = fileUri ? fileUri.fsPath : vscode.window.activeTextEditor.document.fileName;
    if (!filePath) {
      throw new Error('No file selected');
    }

    const baseName = path.basename(filePath);
    const fileDir = path.dirname(filePath);

    if (filePath.endsWith('.sol')) {
      launchCommand(baseName, fileDir)
        .catch(err => {
          console.error('Launch command error:', err);
          vscode.window.showErrorMessage(`Myth-VSC: ${err.message}`);
        });
    } else {
      throw new Error('This command is only available for Solidity files (.sol).');
    }
  } catch (err) {
    console.error('Analyze command error:', err);
    vscode.window.showErrorMessage(`Myth-VSC: ${err.message}`);
  }
}

module.exports = {
  activate: (context) => {
    const disposable = vscode.commands.registerCommand('mythril-vsc.analyze', analyzeCommand);
    context.subscriptions.push(disposable);
  }
};
