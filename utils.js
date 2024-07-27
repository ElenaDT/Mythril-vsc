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

//FIXME il messaggio di errore non riconosce il nome del file...
//TODO semplifica sintassi e vedere se il codice asincrono è necessario!!!
//TODO chiudere i messaggi di errore/info dopo tot secondi...
//[DEBUG] testare con linux nativo
//[IMPLEMENT] processing info
//IMPLEMENT keybinding per analyze

async function launchCommand(baseName, fileDir, command) {
  console.log('*** analysis started ***')
  const outputPath = `./${baseName}-output.md`;
  const fullPath =  `${fileDir}/${baseName}-output.md`;
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true });

    child.stdout.on('data', (data) => {
      fs.appendFile(fullPath, data.toString(), (err) => {
        if (err) {
          reject(err);
        }
      });
    });

    child.stderr.on('data', (data) => {
      vscode.window.showErrorMessage(`Myth: Errore: ${data.toString()}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        vscode.window.showInformationMessage(`Myth: Output saved in ${outputPath}`);
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fullPath));
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = {
  getFileContext,
  isSolidityFile,
  launchCommand,
  getActiveEditorFilePath,
  getCommand
};