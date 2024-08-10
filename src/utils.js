'use strict';

const vscode = require('vscode');
const path = require('path');

function getFileContext(filePath) {
  const mythVscConfig = vscode.workspace.getConfiguration('mythril-vsc'); 
  const baseName = path.basename(filePath);
  const fileDir = path.dirname(filePath);
  const projectDir = path.dirname(fileDir);
  const execTimeout = mythVscConfig.get('executionTimeout', 60);
  const useOpenZeppelin = mythVscConfig.get('useOpenZeppelin', 'false');

  return { baseName, fileDir, projectDir, execTimeout, useOpenZeppelin };
};

function getActiveEditorFilePath() {
  const editor = vscode.window.activeTextEditor;
  return editor ? editor.document.fileName : undefined;
}

function isSolidityFile(filePath) {
  return path.extname(filePath).toLowerCase() === '.sol';
}

/* 
docker run -v c:\\Users\\elena\\OneDrive\\Desktop\\Test_project:/tmp mythril/myth analyze /tmp/solidity_examples/vunlnerableToken.sol
 --solc-json=/tmp/solidity_examples/solc-args.json --solv 0.8.20 -o markdown
*/
function getCommand(baseName, fileDir, projectDir, execTimeout, useOpenZeppelin){
  let vol = `-v ${projectDir}/contracts:/tmp/contracts`;
  const oZlib = ` -v ${projectDir}/node_modules/@openzeppelin/contracts:/tmp/node_modules/@openzeppelin/contracts`;
  
  if (useOpenZeppelin) {
    // definire qui ozlib?
    vol += oZlib;
  }
  
  const args = `--solc-json=/tmp/contracts/solc-args.json --solv 0.8.20 -o markdown --execution-timeout ${execTimeout}`;
  const command = `docker run ${vol} mythril/myth analyze /tmp/contracts/${baseName} ${args}`;

  return command;
}

module.exports = {
  getFileContext,
  isSolidityFile,
  getActiveEditorFilePath,
  getCommand
};

