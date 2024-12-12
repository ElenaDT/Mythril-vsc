'use strict';

const vscode = require('vscode');
const Docker = require('dockerode');
const docker = new Docker();
const { isErrorOutput, formatOutput } = require('./format_utils');
const { PassThrough } = require('stream');

async function runDockerAnalysis(
  sourceUri,
  outputUri,
  mappingsUri,
  solcFlag,
  config
) {
  const executionTimeout = config.get('executionTimeout', 60);
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

        // Demultiplexing del flusso per separare stdout e stderr
        const stdoutStream = new PassThrough();
        const stderrStream = new PassThrough();

        docker.modem.demuxStream(stream, stdoutStream, stderrStream);

        stdoutStream.setEncoding('utf8');
        stderrStream.setEncoding('utf8');

        let output = '';
        let errorOutput = '';

        stdoutStream.on('data', (chunk) => {
          output += chunk;
          progress.report({ message: "Elaborazione dell'analisi..." });
        });

        stderrStream.on('data', (chunk) => {
          errorOutput += chunk;
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
            } catch (err) {
              console.error(
                "Errore durante l'annullamento del container:",
                err
              );
            }
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

        if (errorOutput.trim()) {
          vscode.window.showErrorMessage(`Analisi fallita: ${errorOutput}`);
          return;
        }

        if (!output.trim()) {
          vscode.window.showInformationMessage(
            'Nessun problema trovato nel contratto.'
          );
          return;
        }

        progress.report({ message: 'Salvataggio dei risultati.' });

        const formattedOutput = formatOutput(output);
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
      }
    }
  );
}

module.exports = {
  runDockerAnalysis,
};
