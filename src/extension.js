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
  const {baseName, fileDir, projectDir, execTimeoutON, execTimeout, useOpenZeppelin} = utils.getFileContext(filePath);
  const command = utils.getCommand(baseName, fileDir, projectDir, execTimeoutON, execTimeout, compilerVersion, useOpenZeppelin);
  
  if (utils.isSolidityFile(filePath)) {
    launchCommand(baseName, fileDir, command);
  } else {
    throw new Error('This command is only available for Solidity files (.sol).'); 
  };
}

// TEST su altri contratti con import OZ
// TEST testare su linux e su altro windows

// TODO refactoring  codice
// TEST di nuovo su linux e su altro windows

// TODO migliorare icona ...
// TODO README -> aggiornarlo e specificare che serve solo Docker come dipendenza con l'immagine mythril/myth :)
// TODO README -> spiegare che i contratti devono essere in 'project_root/contracts'
// TODO README -> spiegare che è obbligatorio definire la versione del compialtore solc
// TODO README -> spiegare che occorre creare file denominato'solc-args.json' per fare il remapping di OpenZeppelin
// TODO README -> specificare che deve essere mappato così:'@openzeppelin/contracts/=/tmp/node_modules/@openzeppelin/contracts/'

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
        let hasError = false;

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
          hasError = true;
        });

        child.on('close', () => {
          if (!isCancelled && !hasError) {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fullPath));
          }
          resolve();
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


