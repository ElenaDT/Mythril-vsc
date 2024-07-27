const vscode = require('vscode');
const path = require('path');
const utils = require('./utils.js');

function activate(context) {
  const disposable = vscode.commands.registerCommand('mythril-vsc.analyze', analyzeCommand);
  context.subscriptions.push(disposable);
}

async function analyzeCommand(fileUri) {
  try {
    const filePath = fileUri ? fileUri.fsPath : utils.getActiveEditorFilePath();

    if (!utils.isSolidityFile(filePath)) {
      throw new Error('This command is only available for Solidity files (.sol).');
    }

    analyzeFile(filePath);
  } catch (e) {
    vscode.window.showErrorMessage(e.message);
  }
}

function deactivate() {}


async function analyzeFile(filePath) {
  const mythVscConfig = vscode.workspace.getConfiguration('mythril-vsc');
  const execTimeout = mythVscConfig.get('executionTimeout', 60);
  const execMode = mythVscConfig.get('executionMode', 'docker');
  const fileDir = path.dirname(filePath);
  const baseName = utils.getBaseName(filePath);

utils.launchCommand(baseName, fileDir, execTimeout, execMode);
}

module.exports = {
  activate,
  deactivate
};
