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

//TODO semplifica sintassi e vedere se il codice asincrono è necessario!!!
//[DEBUG] testare con linux nativo
//[IMPLEMENT] keybinding per analyze
//TODO valutare se spostare la launchCommand nel file principale...
async function launchCommand(baseName, fileDir, command) {
  const fullPath = `${fileDir}/${baseName}-output.md`;

  // Crea un nuovo ProgressLocation
  const progressLocation = vscode.ProgressLocation.Notification;

  await vscode.window.withProgress(
    {
      location: progressLocation,
      title: 'Esecuzione comando in corso...',
      cancellable: true,
    },
    async (progress, token) => {
      return new Promise((resolve, reject) => {
        const child = spawn(command, { shell: true });
        let isCancelled = false;

        // Gestione della cancellazione
        token.onCancellationRequested(() => {
          isCancelled = true;
          child.kill(); // Termina il processo figlio
          vscode.window.showInformationMessage('Esecuzione comando annullata.');
          reject(new Error('Esecuzione comando annullata.'));
        });

        child.stdout.on('data', (data) => {
          fs.appendFile(fullPath, data.toString(), (err) => {
            if (err) {
              reject(err);
            }
          });

          // Aggiorna il progress reporting senza incrementare percentuale
          progress.report({ message: 'Elaborazione in corso...', increment: 0 });
        });

        child.stderr.on('data', (data) => {
          vscode.window.showErrorMessage(`Myth: Errore: ${data.toString()}`);
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

// BUG in caso di errore del processo di lanchcommand deve chiudersi da sola
// [IMPLEMENT] deve essere cancellabile
module.exports = {
  getFileContext,
  isSolidityFile,
  launchCommand,
  getActiveEditorFilePath,
  getCommand
};