const vscode = require('vscode');
const utils = require('./utils.js');

function activate(context) {
  const disposable = vscode.commands.registerCommand('mythril-vsc.analyze', analyzeCommand);
  context.subscriptions.push(disposable);
}


async function mythrilLaucher(filePath, baseName) {
    // Ottengo 'execution timeout' dalle settings
    const executionTimeout = vscode.workspace.getConfiguration('mythril-vsc').get('executionTimeout', 30);

    await analyzeFile(filePath, baseName, executionTimeout);
}
async function analyzeCommand(fileUri) {
  try {
    const filePath = fileUri ? fileUri.fsPath : getActiveTextEditorFilePath();

    if (!filePath) {
      await promptForAnalysis();
      return;
    }

    if (!utils.isSolidityFile(filePath)) {
      throw new Error('This command is only available for Solidity files (.sol).');
    }
    mythrilLaucher(filePath, utils.getBaseName(filePath));
  } catch (error) {
    vscode.window.showErrorMessage(error.message);
  }
}

async function analyzeFile(filePath, baseName, executionTimeout) {
  const terminal = vscode.window.createTerminal('Myth: Analyze');
  terminal.sendText(`myth analyze ./${baseName} -o markdown --execution-timeout ${executionTimeout} > ${baseName}.md`);
  terminal.show();
}

function getActiveTextEditorFilePath() {
  const editor = vscode.window.activeTextEditor;
  return editor ? editor.document.fileName : undefined;
}

async function promptForAnalysis() {
  const options = { filters: { 'Solidity Files': ['sol'] } };
  const selectedFileUri = await vscode.window.showOpenDialog(options);

  if (selectedFileUri && selectedFileUri[0].fsPath) {
    const filePath = selectedFileUri[0].fsPath;

    mythrilLaucher(filePath, utils.getBaseName(filePath));
  } else {
    await analyzeWorkspace();
  }
}

async function analyzeWorkspace() {
  const currentFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : null;

  if (currentFolder) {
    const terminal = vscode.window.createTerminal('Myth: Analyze Workspace');
    terminal.sendText(`myth analyze ${currentFolder.uri.fsPath} -o markdown --execution-timeout 30 > workspace.md`);
    terminal.show();
  } else {
    throw new Error('No workspace folder found.');
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
