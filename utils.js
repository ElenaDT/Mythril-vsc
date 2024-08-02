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

// FIXME riparte lo starting
// FIXME deve terminare un po' dopo
// FIXME la barra non procede graficamente
// FIXME finestra non si chiude o non si può chuidere in alcun modo
// BUG in caso di errore del processo di lanchcommand deve chiudersi da sola
// [IMPLEMENT] deve essere cancellabile

async function showProgress(execTimeout, outputPath) {
  const msExecTimeout = execTimeout * 1000;

  return new Promise((resolve) => {
    let analysisFinished = false;

    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Myth Analyze",
      cancellable: false
    }, (progress) => {
      let messageIndex = 0;
      const messages = [
        "Starting...",
        "almost there...",
        "almost halfway...",
        "almost there...",
        `output saved in ${outputPath}`
      ];

      const intervalId = setInterval(() => {
        if (!analysisFinished) {
          progress.report({ increment: 0, message: messages[messageIndex] });
          messageIndex = (messageIndex + 1) % messages.length;
        }
      }, msExecTimeout * 0.1);

      setTimeout(() => {
        analysisFinished = true;
        clearInterval(intervalId);
        progress.report({ increment: 30, message: `Myth: Analysis complete` });
        resolve();
      }, msExecTimeout + 2000);
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