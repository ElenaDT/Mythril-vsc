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
  const outputPath = `./${baseName}-output.md`;  
  let command = `-o markdown --execution-timeout ${execTimeout} > ${outputPath}`;

  if (execMode === 'docker') {
    command = `docker run --rm -v ${fileDir}:/tmp mythril/myth analyze /tmp/${baseName} ${command}`;
  } else {
    command = `myth analyze ./${baseName} ${command}`;
  }
  return { command, outputPath };
}

function launchCommand(baseName, command, outputPath) {
  const terminal = vscode.window.createTerminal({
    name:  `myth analyze: ${baseName}`, 
    message: `*** Mythril: starting analysis for ${baseName}... ***`
  });

  terminal.sendText(command);
  terminal.show();
  terminal.sendText(`code ${outputPath}\nexit`);
};

module.exports = {
  getFileContext,
  isSolidityFile,
  launchCommand,
  getActiveEditorFilePath,
  getCommand
};