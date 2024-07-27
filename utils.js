const vscode = require('vscode');
const path = require('path');

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
  const outputFile = `./${baseName}-output.md`;
  let command = `-o markdown --execution-timeout ${execTimeout} > ${outputFile}`;

  if (execMode === 'docker') {
    command = `docker run --rm -v ${fileDir}:/tmp mythril/myth analyze /tmp/${baseName} ${command}`;
  } else {
    command = `myth analyze ./${baseName} ${command}`;
  }
  return command;
}

//[IMPLEMENT] apertura automatica dell'output.md
function launchCommand(baseName, fileDir, execTimeout, execMode){

  const command = getCommand(baseName, fileDir, execTimeout, execMode);
  
  const terminal = vscode.window.createTerminal({
    name:'Myth: Analyze File',
    message: `*** Mythril: starting analysis for ${baseName}... ***`
  });

  terminal.show();
  terminal.sendText(command);
}

module.exports = {
  getFileContext,
  isSolidityFile,
  launchCommand,
  getActiveEditorFilePath,
};