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

function getCommand(baseName, fileDir, projectDir, execTimeout, useOpenZeppelin){
  let vol = `-v ${projectDir}/contracts:/tmp/contracts`;
  const oZlib = ` -v ${projectDir}/node_modules/@openzeppelin/contracts:/tmp/node_modules/@openzeppelin/contracts`;
  
  if (useOpenZeppelin) {
    // definire qui ozlib?
    vol += oZlib;
  }
  
  const mythArgs = `--solc-json=/tmp/contracts/solc-args.json --solv 0.8.20 -o markdown --execution-timeout ${execTimeout}`;
  const command = `docker run --name "Mythril_Analysis" --rm ${vol} mythril/myth analyze /tmp/contracts/${baseName} ${mythArgs}`;

  return command;
}

function stopDockerContainer() {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec('docker stop Mythril_Analysis', (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve(stdout);
    });
  });
}

module.exports = {
  getFileContext,
  isSolidityFile,
  getActiveEditorFilePath,
  getCommand,
  stopDockerContainer
};

