'use strict';

const vscode = require('vscode');
const Docker = require('dockerode');
const docker = new Docker();

class MythrilAnalyzer {
  constructor(context) {
    this.config = vscode.workspace.getConfiguration('mythril-vsc');
    this.context = context;
    this.activeAnalysis = false;
  }

  async getCompilerVersion(uri) {
    try {
      const fileContent = await vscode.workspace.fs.readFile(uri);
      const fileContentStr = Buffer.from(fileContent).toString('utf8');
      const pragmaLine = fileContentStr
        .split('\n')
        .find((line) => line.startsWith('pragma solidity'));

      if (pragmaLine) {
        const versionRange = pragmaLine.split(' ')[2];
        return versionRange.replace(/[^0-9.]/g, '').trim();
      }
      return false;
    } catch (err) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
  }

  async ensureDockerImage(imageName) {
    try {
      await docker.ping();
    } catch (err) {
      throw new Error('Docker non è in esecuzione. Per favore, avvia Docker.');
    }

    const images = await docker.listImages();
    const imageExists = images.some((image) =>
      image.RepoTags?.includes(imageName)
    );

    if (!imageExists) {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Scaricamento dell'immagine Docker: ${imageName}`,
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: 'Download in corso.' });
          await new Promise((resolve, reject) => {
            docker.pull(imageName, {}, (err, stream) => {
              if (err) {
                return reject(
                  new Error(
                    `Impossibile scaricare l'immagine Docker: ${err.message}`
                  )
                );
              }
              docker.modem.followProgress(
                stream,
                (err, res) => (err ? reject(err) : resolve(res)),
                (event) => {
                  if (event.progress) {
                    progress.report({
                      message: `${event.status}: ${event.progress}`,
                    });
                  }
                }
              );
            });
          });
        }
      );
    }
  }

  async checkDependencies(sourceUri) {
    try {
      const fileContent = await vscode.workspace.fs.readFile(sourceUri);
      const contentStr = Buffer.from(fileContent).toString('utf8');

      if (contentStr.includes('@openzeppelin')) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(sourceUri);
        if (!workspaceFolder) {
          throw new Error(
            'Nessuna cartella di lavoro trovata per il controllo delle dipendenze'
          );
        }

        const nodeModulesUri = vscode.Uri.joinPath(
          workspaceFolder.uri,
          'node_modules/@openzeppelin'
        );
        try {
          await vscode.workspace.fs.stat(nodeModulesUri);
        } catch {
          throw new Error(
            'Dipendenze OpenZeppelin non trovate. Esegui "npm install".'
          );
        }
      }
      return true;
    } catch (err) {
      throw new Error(`Controllo delle dipendenze fallito: ${err.message}`);
    }
  }

  async createMappingsFile(workspaceUri) {
    const mappingsContent = JSON.stringify(
      {
        optimizer: { enabled: true, runs: 200 },
        viaIR: true,
        remappings: [
          '@openzeppelin/contracts/=/tmp/node_modules/@openzeppelin/contracts/',
          '@openzeppelin/=/tmp/node_modules/@openzeppelin/',
        ],
      },
      null,
      2
    );

    const mappingsUri = vscode.Uri.joinPath(workspaceUri, 'mappings.json');
    await vscode.workspace.fs.writeFile(
      mappingsUri,
      Buffer.from(mappingsContent, 'utf8')
    );
    return mappingsUri;
  }

  async analyze(sourceUri) {
    if (this.activeAnalysis) {
      vscode.window.showWarningMessage(
        "Un'analisi è già in corso. Attendere il completamento o annullarla."
      );
      return;
    }

    this.activeAnalysis = true;

    try {
      await this.checkDependencies(sourceUri);

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(sourceUri);
      if (!workspaceFolder) {
        throw new Error('Nessuna cartella di lavoro trovata');
      }

      const fileName = sourceUri.path.split('/').pop();
      const outputUri = vscode.Uri.joinPath(
        workspaceFolder.uri,
        `${fileName}-output.md`
      );

      const solcVersion = await this.getCompilerVersion(sourceUri);
      const solcFlag = solcVersion ? `--solv ${solcVersion}` : '';

      const imageName = 'mythril/myth:latest';
      await this.ensureDockerImage(imageName);

      const mappingsUri = await this.createMappingsFile(workspaceFolder.uri);
      await this.runDockerAnalysis(sourceUri, outputUri, mappingsUri, solcFlag);
    } catch (err) {
      vscode.window.showErrorMessage(
        `Configurazione dell'analisi fallita: ${err.message}`
      );
      console.error("Errore nella configurazione dell'analisi:", err);
    } finally {
      this.activeAnalysis = false;
    }
  }

  async runDockerAnalysis(sourceUri, outputUri, mappingsUri, solcFlag) {
    const executionTimeout = this.config.get('executionTimeout', 60);
    const fileName = sourceUri.path.split('/').pop();

    const containerOptions = {
      Image: 'mythril/myth:latest',
      Cmd: [
        'sh',
        '-c',
        `myth analyze /tmp/${fileName} ${solcFlag} --solc-json /tmp/mappings.json -o markdown --execution-timeout ${executionTimeout}`,
      ],
      Tty: false,
      HostConfig: {
        AutoRemove: true,
        Binds: [
          `${sourceUri.fsPath}:/tmp/${fileName}`,
          `${mappingsUri.fsPath}:/tmp/mappings.json`,
        ],
      },
      WorkingDir: '/tmp',
    };

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(sourceUri);
    if (workspaceFolder) {
      const nodeModulesUri = vscode.Uri.joinPath(
        workspaceFolder.uri,
        'node_modules'
      );
      try {
        await vscode.workspace.fs.stat(nodeModulesUri);
        containerOptions.HostConfig.Binds.push(
          `${nodeModulesUri.fsPath}:/tmp/node_modules`
        );
      } catch {
        const fileNodeModulesUri = vscode.Uri.joinPath(
          sourceUri.with({ path: sourceUri.path.replace(fileName, '') }),
          'node_modules'
        );
        try {
          await vscode.workspace.fs.stat(fileNodeModulesUri);
          containerOptions.HostConfig.Binds.push(
            `${fileNodeModulesUri.fsPath}:/tmp/node_modules`
          );
        } catch {
          vscode.window.showWarningMessage(
            'node_modules non trovata. Gli import OpenZeppelin potrebbero non funzionare.'
          );
        }
      }
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Analisi del contratto in corso',
        cancellable: true,
      },
      async (progress, token) => {
        let container;
        let isCancelled = false;

        try {
          progress.report({ message: 'Creazione del container' });
          container = await docker.createContainer(containerOptions);

          progress.report({ message: "Avvio dell'analisi..." });
          const stream = await container.attach({
            stream: true,
            stdout: true,
            stderr: true,
          });

          stream.setEncoding('utf8');

          let output = '';
          let hasError = false;
          let errorMessage = '';

          stream.on('data', (chunk) => {
            output += chunk;
            progress.report({ message: "Elaborazione dell'analisi..." });

            if (this.isErrorOutput(chunk)) {
              hasError = true;
              errorMessage += chunk;
            }
          });

          await container.start();

          token.onCancellationRequested(async () => {
            if (container && !isCancelled) {
              isCancelled = true;
              vscode.window.showInformationMessage(
                "Annullamento dell'analisi in corso. Attendere la conferma."
              );
              try {
                await container.stop();
                vscode.window.showInformationMessage(
                  'Analisi annullata con successo.'
                );
              } catch (err) {}
            }
          });

          await new Promise((resolve, reject) => {
            container.wait((err, data) => {
              if (err && !isCancelled) {
                reject(err);
              } else {
                resolve(data);
              }
            });
          });

          if (isCancelled) {
            return;
          }

          if (hasError) {
            vscode.window.showErrorMessage(`Analisi fallita: ${errorMessage}`);
            return;
          }

          if (!output.trim()) {
            vscode.window.showInformationMessage(
              'Nessun problema trovato nel contratto.'
            );
            return;
          }

          progress.report({ message: 'Salvataggio dei risultati.' });

          const formattedOutput = this.formatOutput(output);
          await vscode.workspace.fs.writeFile(
            outputUri,
            Buffer.from(formattedOutput, 'utf8')
          );

          const document = await vscode.workspace.openTextDocument(outputUri);
          await vscode.window.showTextDocument(document, { preview: false });
          vscode.window.showInformationMessage(
            'Analisi completata con successo.'
          );
        } catch (err) {
          if (err.message !== 'canceled' && !isCancelled) {
            vscode.window.showErrorMessage(
              `Errore durante l'analisi: ${err.message}`
            );
            console.error("Errore durante l'analisi:", err);
          }
        } finally {
          this.activeAnalysis = false;
        }
      }
    );
  }

  isErrorOutput(chunk) {
    return (
      chunk.includes('Solc experienced a fatal error') ||
      chunk.includes('SyntaxError') ||
      chunk.includes('mythril.interfaces.cli [ERROR]: Traceback') ||
      chunk.includes('ValueError: Invalid version string') ||
      chunk.includes('File not found')
    );
  }

  formatOutput(output) {
    return output
      .replace(/^[^#]*/, '')
      .replace(/## /g, '\n## ')
      .replace(/### /g, '\n### ')
      .replace(/```/g, '\n```\n')
      .replace(/- /g, '\n- ');
  }
}

module.exports = {
  activate(context) {
    const analyzer = new MythrilAnalyzer(context);
    const disposable = vscode.commands.registerCommand(
      'mythril-vsc.analyze',
      async (fileUri) => {
        try {
          const uri = fileUri || vscode.window.activeTextEditor?.document.uri;
          if (!uri) {
            throw new Error('Nessun file selezionato');
          }
          if (!uri.path.endsWith('.sol')) {
            throw new Error(
              'Questo comando è disponibile solo per file Solidity (.sol)'
            );
          }
          await analyzer.analyze(uri);
        } catch (err) {
          vscode.window.showErrorMessage(`Myth-VSC: ${err.message}`);
          console.error("Errore durante l'analisi:", err);
        }
      }
    );
    context.subscriptions.push(disposable);
  },
};
