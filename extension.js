const vscode = require('vscode');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const disposable = vscode.commands.registerCommand('mythril-vsc.analyze', analyzeCommand);
  context.subscriptions.push(disposable);
}

async function analyzeCommand(fileUri) {
  try {
    const filePath = fileUri ? fileUri.fsPath : getActiveTextEditorFilePath();

    if (!filePath) {
      await promptForAnalysis();
      return;
    }

    if (!isSolidityFile(filePath)) {
      throw new Error('This command is only available for Solidity files (.sol).');
    }

    const baseName = vscode.workspace.asRelativePath(filePath);
    await analyzeFile(filePath, baseName);
  } catch (error) {
    vscode.window.showErrorMessage(error.message);
  }
}

async function analyzeFile(filePath, baseName) {
  const terminal = vscode.window.createTerminal('Myth: Analyze');
  terminal.sendText(`myth analyze ./${baseName} -o markdown --execution-timeout 30 > ${baseName}.md`);
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
    const baseName = vscode.workspace.asRelativePath(filePath);
    await analyzeFile(filePath, baseName);
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

function isSolidityFile(filePath) {
  return path.extname(filePath).toLowerCase() === '.sol';
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
