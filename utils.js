const vscode = require('vscode');
const path = require('path');

function getBaseName(filePath) {
        const baseName = vscode.workspace.asRelativePath(filePath);
        return baseName;
    };

function isSolidityFile(filePath) {
    return path.extname(filePath).toLowerCase() === '.sol';
}

module.exports = {
    getBaseName,
    isSolidityFile
};