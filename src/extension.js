'use strict';

const vscode = require('vscode');
const path = require('path');
const {
  getCompilerVersion,
  checkDependencies,
  createMappingsFile,
} = require('./utils/fs_utils');
const { checkDockerImage } = require('./utils/docker_utils');
const { runDockerAnalysis } = require('./utils/analysis_utils');

let isRunning = false;

const analyze = async (fileUri) => {
  if (isRunning) {
    vscode.window.showWarningMessage(
      'Un\'analisi è già in corso: attendere il completamento o annullarla.'
    );
    return;
  }

  isRunning = true;

  try {
    const rawFileContent = await vscode.workspace.fs.readFile(fileUri);
    const fileContent = Buffer.from(rawFileContent).toString('utf8');
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
    if (!workspaceFolder) {
      throw new Error('Nessuna cartella di lavoro trovata.');
    }

    const fileName = path.basename(fileUri.path);
    const outputUri = vscode.Uri.joinPath(
      workspaceFolder.uri,
      `${fileName}-output.md`
    );
    const nodeModulesUri = vscode.Uri.joinPath(
      workspaceFolder.uri,
      'node_modules'
    );
    await checkDependencies(nodeModulesUri);

    const solcVersion = await getCompilerVersion(fileContent);
    const solcFlag = solcVersion ? `--solv ${solcVersion}` : '';
    const imageName = 'mythril/myth:latest';

    await checkDockerImage(imageName);

    const mappingsUri = await createMappingsFile(workspaceFolder.uri);
    await runDockerAnalysis(
      fileUri,
      fileName,
      outputUri,
      mappingsUri,
      solcFlag,
      vscode.workspace.getConfiguration('mythril-vsc'),
      nodeModulesUri
    );
  } catch (err) {
    vscode.window.showErrorMessage(
      `Configurazione dell'analisi fallita: ${err.message}`
    );
  } finally {
    isRunning = false;
  }
};

const activate = (context) => {
  const analyzeCommand = vscode.commands.registerCommand(
    'mythril-vsc.analyze',
    async (fileUri) => {
      try {
        const uri = fileUri || vscode.window.activeTextEditor?.document.uri;
    
        await analyze(uri);
      } catch (err) {
        vscode.window.showErrorMessage(`Mythril-VSC: ${err.message}`);
        console.error('Errore durante l\'analisi:', err);
      }
    }
  );
  context.subscriptions.push(analyzeCommand);
};

module.exports = {
  activate,
};
