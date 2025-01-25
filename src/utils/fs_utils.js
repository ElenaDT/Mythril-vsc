'use strict';

const vscode = require('vscode');

async function getCompilerVersion(uri, fileContent) {
  try {
    const pragmaLine = fileContent
      .split('\n')
      .find((line) => line.startsWith('pragma solidity'));

    if (pragmaLine) {
      const versionRange = pragmaLine.split(' ')[2];
      return versionRange.replace(/[^0-9.]/g, '').trim();
    }
    return false;
  } catch (err) {
    throw vscode.FileSystemError.FileNotFound(uri);
  }
}

async function checkDependencies(fileUri, fileContent, workspaceFolder) {
  try {
    const nodeModulesUri = vscode.Uri.joinPath(
      workspaceFolder.uri,
      'node_modules/@openzeppelin'
    );
    try {
      await vscode.workspace.fs.stat(nodeModulesUri);
    } catch {
      throw new Error(
        'Dipendenze OpenZeppelin non trovate. Esegui "npm install".'
      );
    }
  } catch (err) {
    throw new Error(`Controllo delle dipendenze fallito: ${err.message}`);
  }
}

async function createMappingsFile(workspaceUri) {
  const mappingsContent = JSON.stringify(
    {
      optimizer: { enabled: true, runs: 200 },
      remappings: [
        '@openzeppelin/contracts/=/tmp/node_modules/@openzeppelin/contracts/',
        '@openzeppelin/=/tmp/node_modules/@openzeppelin/',
      ],
    },
    null,
    2
  );

  const mappingsUri = vscode.Uri.joinPath(workspaceUri, 'mappings.json');
  await vscode.workspace.fs.writeFile(
    mappingsUri,
    Buffer.from(mappingsContent, 'utf8')
  );
  return mappingsUri;
}

module.exports = {
  getCompilerVersion,
  checkDependencies,
  createMappingsFile,
};
