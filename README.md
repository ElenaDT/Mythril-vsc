# Mythril for VSC - Security Analyzer for Solidity Smart Contracts

## 📄 Overview

Mythril VSC is a Visual Studio Code extension that integrates the [**Mythril**](https://github.com/ConsenSysDiligence/mythril) static analysis framework, designed to detect security vulnerabilities in Solidity contracts. With this extension, you can run security analyses directly within your editor, providing an intuitive and quick interface for analyzing contracts.

## ✨ Key Features

- **🐳 Isolated Environment**: Uses Mythril in a Docker container to ensure a secure and independent environment for analysis
- **🚀 OpenZeppelin Integration**: Native support for the most widely used smart contract security libraries
- **🔍 Solidity Auto-detection**: Automatic detection of the contract's Solidity version
- **⚙️ Customizable Configuration**: Configure the extension directly through Visual Studio Code settings
- **📊 Markdown Reports**: Generates reports in Markdown format for easy reading and sharing of results

## 🔧 System Requirements

- **Visual Studio Code** (version ^1.89.0)
- **Docker Desktop** (running)

## 🚀 Quick Start Guide

### Installation

1. Open VSCode
2. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on macOS)
3. Search for "Mythril VSC" and install

### Environment Setup

- Ensure Docker Desktop is running
- Open the Solidity contract file you want to analyze

### Running an Analysis

- Right-click on the contract file
- Select `Mythril-VSC: Analyze File`
- Alternatively, use the 👁️ icon in the top right or the keyboard shortcut `Ctrl+M` (or `Cmd+M` on macOS)

### Viewing Results

- The analysis report will automatically open in a new tab

## 🛠️ Configuration

You can customize the extension settings by modifying the VSCode settings.json file:

```json
{
  "mythril-vsc.executionTimeout": 60 // Analysis timeout in seconds
}
```

## 🐛 Common Issues

1. **Docker not responding**:
   - Verify that Docker Desktop is running
   - Check Docker permissions and ensure there are no network conflicts

2. **Solc errors**:
   - Make sure the `@openzeppelin/contracts` package is correctly installed
   - Check that imported files have a solc version compatible with the contract being analyzed

3. **VSCode permissions**:
   - Verify that VSCode has the necessary permissions to access Docker and system resources
   - If necessary, run VSCode as administrator

## 📈 Roadmap

- 🔤 **Choose a Better Name**: Select a more descriptive and appealing name for the extension
- 🖼️ **Pre-Analysis UI**: Implement a user interface to configure specific parameters before starting an analysis
- ⌨️ **Customizable Keybindings**: Allow users to configure keybindings for initiating analyses
- ✅ **Configurable Outputs**: Support various output formats, such as JSON
- 🛠️ **Advanced Mythril Features**: Integrate all [Mythril's advanced features](https://mythril-classic.readthedocs.io/en/master/security-analysis.html)
- 🔗 **Bytecode Analysis**: Enable analysis of compiled bytecode
- 🐳 **Custom Docker Images**: Provide an option to use custom Docker images for running Mythril
- 📝 **TypeScript and JSDoc Integration**: Enhance code maintainability and documentation
- 🖥️ **ARM-64 Architecture Support**: Ensure compatibility with ARM-64 architecture for Docker images
- 📚 **Library Auto-detection**: Automatically detect libraries used in contracts, beyond just OpenZeppelin
- ⚡ **Concurrent Analyses**: Enable running multiple analyses in parallel processes
- 🌍 **Internationalization (i18n)**: Add support for multiple languages
- 🧪 **Integration Tests**: Add [integration tests](https://code.visualstudio.com/api/working-with-extensions/testing-extension) to ensure reliability
- 🎨 **UX Testing**: Conduct user experience testing to improve usability

## 🔗 Resources

- [Mythril Documentation](https://mythril.docs)
- [Solidity Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OpenZeppelin Docs](https://docs.openzeppelin.com)

## 📄 License

This project is released under the MIT License. See the [LICENSE](./LICENSE.txt) file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
