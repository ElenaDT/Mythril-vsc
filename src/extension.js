'use strict';

const vscode = require('vscode');
const {
  getCompilerVersion,
  checkDependencies,
  createMappingsFile,
} = require('./utils/fs_utils');
const { checkDockerImage } = require('./utils/docker_utils');
const { runDockerAnalysis } = require('./utils/analysis_utils');

class Analyzer {
  constructor(context) {
    this.config = vscode.workspace.getConfiguration('mythril-vsc');
    this.context = context;
    this.isRunning = false;
  }

  async analyze(fileUri) {
    if (this.isRunning) {
      vscode.window.showWarningMessage(
        "Un'analisi è già in corso: attendere il completamento o annullarla."
      );
      return;
    }

    this.isRunning = true;

    try {
      const rawFileContent = await vscode.workspace.fs.readFile(fileUri);
      const fileContent = Buffer.from(rawFileContent).toString('utf8');
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
      if (!workspaceFolder) {
        throw new Error('Nessuna cartella di lavoro trovata.');
      }

      const fileName = fileUri.path.split('/').pop();
      const outputUri = vscode.Uri.joinPath(
        workspaceFolder.uri,
        `${fileName}-output.md`
      );
      const nodeModulesUri = vscode.Uri.joinPath(
        workspaceFolder.uri,
        'node_modules'
      );
      await checkDependencies(
        fileUri,
        fileContent,
        workspaceFolder,
        nodeModulesUri
      );

      const solcVersion = await getCompilerVersion(fileUri, fileContent);
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
        this.config,
        workspaceFolder,
        nodeModulesUri
      );
    } catch (err) {
      vscode.window.showErrorMessage(
        `Configurazione dell'analisi fallita: ${err.message}`
      );
      console.error("Errore nella configurazione dell'analisi:", err);
    } finally {
      this.isRunning = false;
    }
  }
}

function activate(context) {
  const analyzer = new Analyzer(context);
  const analyzeCommand = vscode.commands.registerCommand(
    'mythril-vsc.analyze',
    async (fileUri) => {
      try {
        const uri = fileUri || vscode.window.activeTextEditor?.document.uri;
        if (!uri) {
          throw new Error('Nessun file selezionato');
        }
        if (!uri.path.endsWith('.sol')) {
          throw new Error(
            'Questo comando è disponibile solo per file Solidity (.sol)'
          );
        }
        await analyzer.analyze(uri);
      } catch (err) {
        vscode.window.showErrorMessage(`Mythril-VSC: ${err.message}`);
        console.error("Errore durante l'analisi:", err);
      }
    }
  );
  context.subscriptions.push(analyzeCommand);
}

module.exports = {
  activate,
};
