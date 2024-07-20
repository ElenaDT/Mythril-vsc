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

    if (!utils.isSolidityFile(filePath)) {
      throw new Error('This command is only available for Solidity files (.sol).');
    }

    getAnalisysContext(filePath);
  } catch (error) {
    vscode.window.showErrorMessage(error.message);
  }
}

function deactivate() {}

async function getAnalisysContext(filePath) {
    const fileDirectory = path.dirname(filePath);
    const baseName = utils.getBaseName(filePath);

    await analyzeFile(fileDirectory, baseName);
}

async function analyzeFile(fileDirectory, baseName) {
  const mythrilVscConfig = vscode.workspace.getConfiguration('mythril-vsc');
  const executionTimeout = mythrilVscConfig.get('executionTimeout', 60);
  const executionMode = mythrilVscConfig.get('executionMode', 'docker');


//TODO creare funzione di utility per decidere che comando lanciare
//[IMPLEMENT] apertura automatica dell'output.md

  const terminal = vscode.window.createTerminal({ name:'Myth: Analyze File', message: `*** Mythril: starting analysis for ${baseName}... ***` });
  let command;

  if (executionMode === 'docker') {
    command = `docker run --rm -v ${fileDirectory}:/tmp mythril/myth analyze /tmp/${baseName} -o markdown --execution-timeout ${executionTimeout} > ./${baseName}-output.md`;
  } else {
    command = `myth analyze ./${baseName} -o markdown --execution-timeout ${executionTimeout} > ./${baseName}-output.md`;
  }
  
  terminal.show();
  terminal.sendText(command);
  }

//[IMPLEMENT] keybinding
//TODO deve diventare funzione di utility
function getActiveTextEditorFilePath() {
  const editor = vscode.window.activeTextEditor;
  return editor ? editor.document.fileName : undefined;
}

module.exports = {
  activate,
  deactivate
};
