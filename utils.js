const vscode = require('vscode');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

function getFileContext(filePath) {
  const mythVscConfig = vscode.workspace.getConfiguration('mythril-vsc'); 
  const baseName = vscode.workspace.asRelativePath(filePath); 
  // TODO vedere le API di VSC per la path
  const fileDir = path.dirname(filePath);
  const execTimeout = mythVscConfig.get('executionTimeout', 60);
  const execMode = mythVscConfig.get('executionMode', 'docker');

  return { baseName, fileDir, execTimeout, execMode };
  };

  function getActiveEditorFilePath() {
    const editor = vscode.window.activeTextEditor;
    return editor ? editor.document.fileName : undefined;
  }

function isSolidityFile(filePath) {
  return path.extname(filePath).toLowerCase() === '.sol';
}

function getCommand(baseName, fileDir, execTimeout, execMode){
  let command = `-o markdown --execution-timeout ${execTimeout}`;

  if (execMode === 'docker') {
    command = `docker run --rm -v ${fileDir}:/tmp mythril/myth analyze /tmp/${baseName} ${command}`;
  } else {
    command = `myth analyze ./${baseName} ${command}`;
  }
  return command;
}

//TODO semplifica sintassi
//[DEBUG] testare con linux nativo
//[IMPLEMENT] keybinding per analyze
//TODO valutare se spostare la launchCommand nel file principale...

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
  getFileContext,
  isSolidityFile,
  launchCommand,
  getActiveEditorFilePath,
  getCommand
};