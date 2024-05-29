const vscode = require('vscode');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Congratulations, your extension "mythril-vsc" is now active!');

  let disposable = vscode.commands.registerCommand('mythril-vsc.analyze', function (fileUri) {
    // Handle scenario with provided fileUri (optional)
    if (fileUri && fileUri.fsPath) {
      const fileName = fileUri.fsPath;
      const extension = path.extname(fileName); // Get file extension

      // Check for .sol extension
      if (extension.toLowerCase() === '.sol') {
        const baseName = vscode.workspace.asRelativePath(fileName);
        analyzeFile(fileName, baseName);
      } else {
        // Show alert for non-Solidity file
        vscode.window.showErrorMessage('This command is only available for Solidity files (.sol).');
      }
      return;
    }

    // Handle scenario with activeTextEditor (editor open)
    if (vscode.window.activeTextEditor) {
      const fileName = vscode.window.activeTextEditor.document.fileName;
      const baseName = vscode.workspace.asRelativePath(fileName);
      analyzeFile(fileName, baseName);
      return;
    }

    // Handle scenario without fileUri and no active editor (prompt for selection or workspace analysis)
    // ... rest of the code remains the same ...
  });

  function analyzeFile(filePath, baseName) {
    const terminal = vscode.window.createTerminal('Myth: Analyze');
    terminal.sendText(`myth analyze ./${baseName} -o markdown --execution-timeout 30 > ${baseName}.md`);
    terminal.show();
  }

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
