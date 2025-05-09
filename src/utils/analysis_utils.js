'use strict';

const vscode = require('vscode');
const Docker = require('dockerode');
const { PassThrough } = require('stream');

const docker = new Docker();

const handleCancellation = async (container) => {
  if (!container) {return;}
  
  vscode.window.showInformationMessage('Annullamento dell\'analisi in corso. Attendere la conferma.');
  try {
    await container.stop();
    vscode.window.showInformationMessage('Analisi annullata correttamente.');
  } catch (err) {
    vscode.window.showErrorMessage(`Errore durante l'annullamento dell'analisi: ${err.message}`);
  }
};

const demultiplexStream = (stream) => {
  const stdOut = new PassThrough();
  const stdErr = new PassThrough();
  docker.modem.demuxStream(stream, stdOut, stdErr);
  stdOut.setEncoding('utf8');
  stdErr.setEncoding('utf8');
  return { stdOut, stdErr };
};

const processToFollow = async (progress, token, containerOptions, outputUri) => {
  let container;

  try {
    progress.report({ message: 'Creazione del container' });
    container = await docker.createContainer(containerOptions);
    token.onCancellationRequested(() => handleCancellation(container));

    progress.report({ message: 'Avvio dell\'analisi...' });
    const stream = await container.attach({ stream: true, stdout: true, stderr: true });
    const { stdOut, stdErr } = demultiplexStream(stream);

    let output = '';
    let errorOutput = '';

    stdOut.on('data', chunk => {
      output += chunk;
      progress.report({ message: 'Elaborazione dell\'analisi...' });
    });
    stdErr.on('data', chunk => errorOutput += chunk);

    await container.start();
    await container.wait();

    if (token.isCancellationRequested) {return;}

    if (errorOutput.trim()) {
      vscode.window.showErrorMessage(`Analisi fallita: ${errorOutput.trim()}`);
      return;
    }

    progress.report({ message: 'Salvataggio dei risultati.' });
    await vscode.workspace.fs.writeFile(outputUri, Buffer.from(output, 'utf8'));

    const document = await vscode.workspace.openTextDocument(outputUri);
    await vscode.window.showTextDocument(document, { preview: false });
    vscode.window.showInformationMessage('Analisi completata con successo.');

  } catch (err) {
    if (!token.isCancellationRequested) {
      vscode.window.showErrorMessage(`Errore durante l'analisi: ${err.message}`);
    }
  }
};

const runDockerAnalysis = async (fileUri, fileName, outputUri, mappingsUri, solcFlag, config, nodeModulesUri) => {
  const executionTimeout = config.get('executionTimeout', 60);
  const containerOptions = {
    Image: 'mythril/myth:latest',
    Cmd: [
      'sh', 
      '-c',
      `myth analyze /tmp/${fileName} ${solcFlag} --solc-json /tmp/mappings.json -o markdown --execution-timeout ${executionTimeout}`
    ],
    Tty: false,
    HostConfig: {
      AutoRemove: true,
      Binds: [
        `${fileUri.fsPath}:/tmp/${fileName}`,
        `${nodeModulesUri.fsPath}:/tmp/node_modules`, 
        `${mappingsUri.fsPath}:/tmp/mappings.json`
      ]
    },
    WorkingDir: '/tmp'
  };

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Analisi del contratto in corso',
    cancellable: true
  }, (progress, token) => processToFollow(progress, token, containerOptions, outputUri));
};

module.exports = { runDockerAnalysis };
