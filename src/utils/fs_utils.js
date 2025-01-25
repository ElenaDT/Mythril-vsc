'use strict';

const vscode = require('vscode');

async function getCompilerVersion(uri) {
  try {
    const fileContent = await vscode.workspace.fs.readFile(uri);
    const fileContentStr = Buffer.from(fileContent).toString('utf8');
    const pragmaLine = fileContentStr
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

async function checkDependencies(fileUri) {
  try {
    const fileContent = await vscode.workspace.fs.readFile(fileUri);
    const contentStr = Buffer.from(fileContent).toString('utf8');

    if (contentStr.includes('@openzeppelin')) {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
      if (!workspaceFolder) {
        throw new Error(
          'Nessuna cartella di lavoro trovata per il controllo delle dipendenze'
        );
      }

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
    }
    return true;
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
