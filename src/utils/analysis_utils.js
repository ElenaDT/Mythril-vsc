'use strict';

const vscode = require('vscode');
const Docker = require('dockerode');
const docker = new Docker();
const { PassThrough } = require('stream');

async function runDockerAnalysis(
  fileUri,
  outputUri,
  mappingsUri,
  solcFlag,
  config,
  workspaceFolder,
  nodeModulesUri
) {
  const executionTimeout = config.get('executionTimeout', 60);
  const fileName = fileUri.path.split('/').pop();

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
        `${fileUri.fsPath}:/tmp/${fileName}`,
        `${mappingsUri.fsPath}:/tmp/mappings.json`,
      ],
    },
    WorkingDir: '/tmp',
  };

  containerOptions.HostConfig.Binds.push(
    `${nodeModulesUri.fsPath}:/tmp/node_modules`
  );

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

        const stdout = new PassThrough();
        const stderr = new PassThrough();

        docker.modem.demuxStream(stream, stdout, stderr);

        stdout.setEncoding('utf8');
        stderr.setEncoding('utf8');

        let output = '';
        let errorOutput = '';

        stdout.on('data', (chunk) => {
          output += chunk;
          progress.report({ message: "Elaborazione dell'analisi..." });
        });

        stderr.on('data', (chunk) => {
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

        const result = await container.wait();

        if (isCancelled) {
          return;
        }

        if (errorOutput.trim()) {
          vscode.window.showErrorMessage(`Analisi fallita: ${errorOutput}`);
          return;
        }

        progress.report({ message: 'Salvataggio dei risultati.' });

        await vscode.workspace.fs.writeFile(
          outputUri,
          Buffer.from(output, 'utf8')
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
