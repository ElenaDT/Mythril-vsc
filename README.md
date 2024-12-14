# Mythril VSC - Analizzatore di Sicurezza per Smart Contract Solidity

## 🛡️ **Panoramica**

Mythril VSC è un'estensione di Visual Studio Code che integra il framework di analisi statica **Mythril**, progettato per rilevare vulnerabilità di sicurezza nei contratti Solidity.
Con questa estensione, è possibile eseguire analisi di sicurezza direttamente all'interno dell'editor, fornendo un'interfaccia intuitiva e rapida per analizzare i contratti.

## ✨ **Caratteristiche Principali**

- **🐳 Funziona in Ambiente Isolato**: utilizzo di Mythril in un container Docker per garantire un ambiente sicuro e indipendente per l'analisi.
- **🚀 Integrazione con OpenZeppelin**: supporto nativo per le librerie più utilizzate nella sicurezza degli smart contract.
- **🔍 Auto-detection Solidity**: rilevamento automatico della versione di Solidity del contratto
- **⚙️ Configurazione Personalizzabile**: è possibile configurare l'estensione direttamente tramite le impostazioni di Visual Studio Code.
- **📊 Report In Markdown**: genera report in formato Markdown per una facile lettura e condivisione dei risultati.

## 🔧 **Requisiti di Sistema**

- **Visual Studio Code**
- **Docker Desktop** (in esecuzione)
- **Node.js** (versione 14 o superiore)

## 🛠️ Configurazione

È possibile personalizzare le impostazioni dell'estensione modificando il file settings.json di VSCode:

```json
{
  "mythril-vsc.executionTimeout": 60 // Timeout in secondi per l'analisi
}
```

## 🐛 Problemi Comuni

1. **Docker non risponde**:

   - Verificare che Docker Desktop sia in esecuzione
   - Controllare i permessi di Docker e che non ci siano conflitti di rete

2. **Errori con OpenZeppelin**:

   - Assicurarsi che il pacchetto `@openzeppelin/contracts` sia installato correttamente
   - Controllare che la versione di OpenZeppelin sia compatibile con la versione di Solidity in uso

3. **Permessi VSCode**:
   - Verificare che VSCode abbia i permessi necessari per accedere a Docker e alle risorse di sistema
   - Se necessario, eseguire VSCode come amministratore

## 📈 Roadmap

- ✅ **Output configurabili**: supporto per diversi formati di output come JSON.
- 🛠️ **Configurazioni avanzate**: maggiore configurabilità nella gestione dei comandi Mythril.

## 🔗 Risorse

- [Documentazione Mythril](https://mythril.docs)
- [Best Practices Solidity](https://consensys.github.io/smart-contract-best-practices/)
- [OpenZeppelin Docs](https://docs.openzeppelin.com)

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.
