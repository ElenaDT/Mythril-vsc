const vscode = require('vscode');
const utils = require('./utils.js');

function activate(context) {
  const disposable = vscode.commands.registerCommand('mythril-vsc.analyze', analyzeCommand);
  context.subscriptions.push(disposable);
}

function analyzeCommand(fileUri) {
  const filePath = fileUri ? fileUri.fsPath : utils.getActiveEditorFilePath();
  const {baseName, fileDir, execTimeout, execMode} = utils.getFileContext(filePath);
  const command = utils.getCommand(baseName, fileDir, execTimeout, execMode);
  
  if (utils.isSolidityFile(filePath)) {
    utils.launchCommand(baseName, fileDir, command, execTimeout);
  } else {
    throw new Error('This command is only available for Solidity files (.sol).'); 
  };
}

module.exports = {
  activate,
  deactivate: () => {}
};
