const vscode = require('vscode');
const utils = require('./utils.js');
const path = require('path');

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

    if (!utils.isSolidityFile(filePath)) {
      throw new Error('This command is only available for Solidity files (.sol).');
    }

    getAnalisysContext(filePath);
  } catch (error) {
    vscode.window.showErrorMessage(error.message);
  }
}

async function getAnalisysContext(filePath) {
    const fileDirectory = path.dirname(filePath);
    const baseName = utils.getBaseName(filePath);

    await analyzeFile(fileDirectory, baseName);
}

async function analyzeFile(fileDirectory, baseName) {
  const mythrilVscConfig = vscode.workspace.getConfiguration('mythril-vsc');
  
  const executionTimeout = mythrilVscConfig.get('executionTimeout', 60);
  const executionMode = mythrilVscConfig.get('executionMode', 'docker');

  const terminal = vscode.window.createTerminal('Myth: Analyze');
  let command = '';

  if (executionMode === 'docker') {
    command = `docker run -v ${fileDirectory}:/tmp mythril/myth analyze /tmp/${baseName} -o markdown --execution-timeout ${executionTimeout} > ./${baseName}.md`;
  } else {
    command = `myth analyze ./${baseName} -o markdown --execution-timeout ${executionTimeout} > ./${baseName}.md`;
  }
  
  terminal.show();
  terminal.sendText(command);
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

    getAnalisysContext(filePath);
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
