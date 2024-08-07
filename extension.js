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
  const {baseName, fileDir, execTimeout, execMode} = utils.getFileContext(filePath);
  const command = utils.getCommand(baseName, fileDir, execTimeout, execMode);
  
  if (utils.isSolidityFile(filePath)) {
    launchCommand(baseName, fileDir, command, execTimeout);
  } else {
    throw new Error('This command is only available for Solidity files (.sol).'); 
  };
}

// [IMPLEMENT] comando per contratti con import per openZeppelin
// [IMPLEMENT] considera execTimeout

// [IMPLEMENT] keybinding per analyze
// [DEBUG] testare con linux nativo
// TODO migliora icona

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
          vscode.window.showInformationMessage('Myth: analysis cancelled.'); 
          child.kill();
          reject(new Error('Myth: analysis cancelled.'));
        });

        child.stdout.on('data', (data) => {
          fs.appendFile(fullPath, data.toString(), (err) => {
            if (err) {
              reject(err);
            }
          });
        });

        child.stderr.on('data', (data) => {
          vscode.window.showErrorMessage(`Myth: ERROR: ${data.toString()}`);
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
