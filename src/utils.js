'use strict';

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function getFileContext(filePath) {
  const mythVscConfig = vscode.workspace.getConfiguration('mythril-vsc'); 
  const baseName = path.basename(filePath);
  const fileDir = path.dirname(filePath);
  const projectDir = path.dirname(fileDir);
  const execTimeoutON = mythVscConfig.get('executionTimeoutEnabled', false);
  const execTimeout = mythVscConfig.get('executionTimeout', 90);

  return { baseName, fileDir, projectDir, execTimeoutON, execTimeout };
}

function getActiveEditorFilePath() {
  const editor = vscode.window.activeTextEditor;
  return editor ? editor.document.fileName : undefined;
}

function isSolidityFile(filePath) {
  return path.extname(filePath).toLowerCase() === '.sol';
}

function getCommand(baseName, fileDir, projectDir, execTimeoutON, execTimeout, solcVer) {
  const timeoutArg = execTimeoutON ? ` --execution-timeout ${execTimeout}` : '';
  const mythArgs = `--solv ${solcVer} -o markdown${timeoutArg}`;
  const command = `analyze /tmp/contracts/${baseName} ${mythArgs}`;

  return `${command}`;
}

function getCompilerVersion(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const pragmaLine = fileContent.split('\n').find(line => line.startsWith('pragma solidity'));

  if (pragmaLine) {
    const versionRange = pragmaLine.split(' ')[2];
    const cleanVersion = versionRange.replace(/;/g, '').replace(/\r/g, '').trim();
    return cleanVersion;
  } else {
    vscode.window.showErrorMessage('Myth-VSC: Solc version not found');
    return null;
  }
}

module.exports = {
  getFileContext,
  isSolidityFile,
  getActiveEditorFilePath,
  getCommand,
  getCompilerVersion
};
