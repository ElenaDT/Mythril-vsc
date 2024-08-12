'use strict';

const vscode = require('vscode');
const utils = require('./utils.js');
const { spawn } = require('child_process');
const fs = require('fs');

function activate(context) {
  const disposable = vscode.commands.registerCommand('mythril-vsc.analyze', analyzeCommand);
  context.subscriptions.push(disposable);
}

function analyzeCommand(fileUri) {
  const filePath = fileUri ? fileUri.fsPath : utils.getActiveEditorFilePath();
  const compilerVersion = utils.getCompilerVersion(filePath);
  const {baseName, fileDir, projectDir, execTimeout, useOpenZeppelin} = utils.getFileContext(filePath);
  const command = utils.getCommand(baseName, fileDir, projectDir, execTimeout, compilerVersion, useOpenZeppelin);
  
  if (utils.isSolidityFile(filePath)) {
    launchCommand(baseName, fileDir, command);
  } else {
    throw new Error('This command is only available for Solidity files (.sol).'); 
  };
}

// [IMPLEMENT] aggiornamento settings quando vengono cambiate

// FIXME il menù a tendina del fs mostra il comando 'Analyze' anche per file non '*.sol'
// FIXME il file .md non esiste (cioè in caso di errore) non bisogna tentare di aprirlo

// TODO refactoring  codice
// TODO spiegare nel readme che i contratti devono essere in 'project_root/contracts'
// TODO spiegare che occorre creare file denominato'solc-args.json' per fare il remapping di OpenZeppelin
// TODO specificare che deve essere mappato così:'@openzeppelin/contracts/=/tmp/node_modules/@openzeppelin/contracts/'
// TODO aggiornare README e specificare che serve solo Docker come dipendenza con l'immagine mythril/myth :)
// TODO migliorare icona ...

async function launchCommand(baseName, fileDir, command) {
  const fullPath = `${fileDir}/${baseName}-output.md`;
  const progressLocation = vscode.ProgressLocation.Notification;

  await vscode.window.withProgress(
    {
      location: progressLocation,
      title: 'Analyzing contract...',
      cancellable: true,
    },
    async (progress, token) => {
      return new Promise((resolve, reject) => {
        const child = spawn(command, { shell: true });
        let isCancelled = false;

        token.onCancellationRequested(() => {
          isCancelled = true;
          vscode.window.showInformationMessage('Myth-VSC: analysis cancelled.'); 
          try {
            utils.stopDockerContainer();
            child.kill();
            reject(new Error('Myth-VSC: analysis cancelled.'));
          } catch (error) {
            vscode.window.showErrorMessage(`Myth-VSC: Error stopping Docker container: ${error.message}`);
          }
        });

        child.stdout.on('data', (data) => {
          fs.appendFile(fullPath, data.toString(), (err) => {
            if (err) {
              reject(err);
            }
          });
        });

        child.stderr.on('data', (data) => {
          vscode.window.showErrorMessage(`Myth-VSC: ERROR: ${data.toString()}`);
        });

        child.on('close', () => {
          if (!isCancelled) {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fullPath));
            resolve();
          }
        });

        child.on('error', (err) => {
          reject(err);
        });
      });
    }
  );
}

module.exports = {
  activate,
  deactivate: () => {}
};


