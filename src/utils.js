'use strict';

const vscode = require('vscode');
const path = require('path');
//const fs = require('fs');

function getFileContext (filePath) {
  return {
    mythVscConfig : vscode.workspace.getConfiguration('mythril-vsc');
    baseName : path.basename(filePath);
    fileDir : path.dirname(filePath);
    projectDir : path.dirname(fileDir);
    execTimeoutON : mythVscConfig.get('executionTimeoutEnabled', false);
    execTimeout : mythVscConfig.get('executionTimeout', 90);
  }
}

// function getActiveEditorFilePath() {
//   const editor = vscode.window.activeTextEditor;
//   return editor ? editor.document.fileName : undefined;
// }

// function isSolidityFile(filePath) {
//   return path.extname(filePath).toLowerCase() === '.sol';
// }

// function getCommand(
//   baseName,
//   fileDir,
//   projectDir,
//   execTimeoutON,
//   execTimeout,
//   solcVer
// ) {
//   const timeoutArg = execTimeoutON ? ` --execution-timeout ${execTimeout}` : '';
//   const mythArgs = `--solv ${solcVer} -o markdown${timeoutArg}`;
//   const command = `analyze /tmp/contracts/${baseName} ${mythArgs}`;

//   return `${command}`;
// }

// function getCompilerVersion(filePath) {
//   const fileContent = fs.readFileSync(filePath, 'utf8');
//   const pragmaLine = fileContent
//     .split('\n')
//     .find((line) => line.startsWith('pragma solidity'));

//   if (pragmaLine) {
//     const versionRange = pragmaLine.split(' ')[2];
//     const cleanVersion = versionRange
//       .replace(/;/g, '')
//       .replace(/\r/g, '')
//       .trim();
//     return cleanVersion;
//   } else {
//     vscode.window.showErrorMessage('Myth-VSC: Solc version not found');
//     return null;
//   }
// }

module.exports = {
  getFileContext,
  // isSolidityFile,
  // getActiveEditorFilePath,
  // getCommand,
  // getCompilerVersion,
};
