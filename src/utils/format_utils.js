'use strict';

function isErrorOutput(chunk) {
  return (
    chunk.includes('Solc experienced a fatal error') ||
    chunk.includes('SyntaxError') ||
    chunk.includes('mythril.interfaces.cli [ERROR]: Traceback') ||
    chunk.includes('ValueError: Invalid version string') ||
    chunk.includes('File not found')
  );
}

function formatOutput(output) {
  return output
    .replace(/^[^#]*/, '')
    .replace(/## /g, '\n## ')
    .replace(/### /g, '\n### ')
    .replace(/```/g, '\n```\n')
    .replace(/- /g, '\n- ');
}

module.exports = {
  isErrorOutput,
  formatOutput,
};
