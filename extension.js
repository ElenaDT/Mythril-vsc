const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Congratulations, your extension "mythril-vsc" is now active!');

    let disposable = vscode.commands.registerCommand('mythril-vsc.analyze', function (fileUri) {
        // Ottieni il nome del file attivo, se non è stato fornito un fileUri
        if (!fileUri || !fileUri.fsPath) {
            if (!vscode.window.activeTextEditor) {
                vscode.window.showErrorMessage('No active file to analyze.');
                return;
            }
            fileUri = vscode.window.activeTextEditor.document.uri;
        }

        const fileName = vscode.window.activeTextEditor.document.fileName;
        const baseName = vscode.workspace.asRelativePath(fileName);
        const terminal = vscode.window.createTerminal('Myth: Analyze');
        terminal.sendText(`myth analyze ./${baseName} -o markdown --execution-timeout 15 > ${baseName}.md`);
        terminal.show();
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
