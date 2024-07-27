const vscode = require('vscode');
const utils = require('./utils.js');

function activate(context) {
  const disposable = vscode.commands.registerCommand('mythril-vsc.analyze', analyzeCommand);
  context.subscriptions.push(disposable);
}

function analyzeCommand(fileUri) {
  const filePath = fileUri ? fileUri.fsPath : utils.getActiveEditorFilePath();
  const {baseName, fileDir, execTimeout, execMode} = utils.getFileContext(filePath);
  
  try {
    if (!utils.isSolidityFile(filePath)) {
      throw new Error('This command is only available for Solidity files (.sol).');
    }
    utils.launchCommand(baseName, fileDir, execTimeout, execMode);
  } catch (e) {
    vscode.window.showErrorMessage(e.message);
  }
}

module.exports = {
  activate,
  deactivate: () => {}
};
