'use strict';

const vscode = require('vscode');
const {
  getCompilerVersion,
  checkDependencies,
  createMappingsFile,
} = require('./utils/fs_utils');
const { ensureDockerImage } = require('./utils/docker_utils');
const { runDockerAnalysis } = require('./utils/analysis_utils');

class MythrilAnalyzer {
  constructor(context) {
    this.config = vscode.workspace.getConfiguration('mythril-vsc');
    this.context = context;
    this.activeAnalysis = false;
  }

  async analyze(sourceUri) {
    if (this.activeAnalysis) {
      vscode.window.showWarningMessage(
        "Un'analisi è già in corso. Attendere il completamento o annullarla."
      );
      return;
    }

    this.activeAnalysis = true;

    try {
      await checkDependencies(sourceUri);

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(sourceUri);
      if (!workspaceFolder) {
        throw new Error('Nessuna cartella di lavoro trovata');
      }

      const fileName = sourceUri.path.split('/').pop();
      const outputUri = vscode.Uri.joinPath(
        workspaceFolder.uri,
        `${fileName}-output.md`
      );

      const solcVersion = await getCompilerVersion(sourceUri);
      const solcFlag = solcVersion ? `--solv ${solcVersion}` : '';

      const imageName = 'mythril/myth:latest';
      await ensureDockerImage(imageName);

      const mappingsUri = await createMappingsFile(workspaceFolder.uri);
      await runDockerAnalysis(
        sourceUri,
        outputUri,
        mappingsUri,
        solcFlag,
        this.config
      );
    } catch (err) {
      vscode.window.showErrorMessage(
        `Configurazione dell'analisi fallita: ${err.message}`
      );
      console.error("Errore nella configurazione dell'analisi:", err);
    } finally {
      this.activeAnalysis = false;
    }
  }
}

function activate(context) {
  const analyzer = new MythrilAnalyzer(context);
  const disposable = vscode.commands.registerCommand(
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
  context.subscriptions.push(disposable);
}

module.exports = {
  activate,
};
