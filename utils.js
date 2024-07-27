const vscode = require('vscode');
const path = require('path');

function getBaseName(filePath) {
        const baseName = vscode.workspace.asRelativePath(filePath);
        return baseName;
    };

function isSolidityFile(filePath) {
    return path.extname(filePath).toLowerCase() === '.sol';
}

function launchCommand(baseName, fileDir, execTimeout, execMode){
//[IMPLEMENT] apertura automatica dell'output.md

  const terminal = vscode.window.createTerminal({ name:'Myth: Analyze File', message: `*** Mythril: starting analysis for ${baseName}... ***` });
  let command;

  if (execMode === 'docker') {
    command = `docker run --rm -v ${fileDir}:/tmp mythril/myth analyze /tmp/${baseName} -o markdown --execution-timeout ${execTimeout} > ./${baseName}-output.md`;
  } else {
    command = `myth analyze ./${baseName} -o markdown --execution-timeout ${execTimeout} > ./${baseName}-output.md`;
  }
  
  terminal.show();
    terminal.sendText(command);
}

//[IMPLEMENT] keybinding
function getActiveEditorFilePath() {
  const editor = vscode.window.activeTextEditor;
  return editor ? editor.document.fileName : undefined;
}

module.exports = {
    getBaseName,
    isSolidityFile,
    launchCommand,
    getActiveEditorFilePath,
};