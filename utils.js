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
async function launchCommand(baseName, fileDir, command, execTimeout) {
  const outputPath = `./${baseName}-output.md`;
  showProgress(execTimeout, outputPath);
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

    child.on('close', () => {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fullPath));
        resolve();
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

function showProgress(execTimeout, outputPath) {
  const msExecTimeout = execTimeout * 1000;

  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "Operazione in corso...",
    cancellable: false
  }, (progress) => {
    progress.report({ increment: 0, message: "Inizio..." });

    setTimeout(() => {
      progress.report({ increment: 10, message: "Operazione in corso - ancora un po'..." });
    }, msExecTimeout * 0.1); 

    setTimeout(() => {
      progress.report({ increment: 30, message: "Operazione in corso - quasi a metà..." });
    }, msExecTimeout * 0.4);
    setTimeout(() => {
      progress.report({ increment: 30, message: "Operazione in corso - ci siamo quasi..." });
    }, msExecTimeout * 0.7); 

  
      setTimeout(() => {
        progress.report({ increment: 30, message: `Myth: Output saved in ${outputPath}`});
      
      }, msExecTimeout + 2000); 

    
  });
}  

module.exports = {
  getFileContext,
  isSolidityFile,
  launchCommand,
  getActiveEditorFilePath,
  getCommand
};