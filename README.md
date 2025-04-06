# Mythril VSC - Analizzatore di Sicurezza per Smart Contract Solidity

## **📄Panoramica**

<table border="0">
<tr>
<td width="80%">
Mythril VSC è un'estensione di Visual Studio Code che integra il framework di analisi statica <b>Mythril</b>, progettato per rilevare vulnerabilità di sicurezza nei contratti Solidity.
Con questa estensione, è possibile eseguire analisi di sicurezza direttamente all'interno dell'editor, fornendo un'interfaccia intuitiva e rapida per analizzare i contratti.
</td>
<td>
<img src="./src/images/mythril-audit-light.jpg" alt="Mythril VSC">
</td>
</tr>
</table>

## ✨ **Caratteristiche Principali**

- **🐳 Funziona in Ambiente Isolato**: utilizzo di Mythril in un container Docker per garantire un ambiente sicuro e indipendente per l'analisi.
- **🚀 Integrazione con OpenZeppelin**: supporto nativo per le librerie più utilizzate nella sicurezza degli smart contract.
- **🔍 **Auto**-detection Solidity**: rilevamento automatico della versione di Solidity del contratto
- **⚙️ Configurazione Personalizzabile**: è possibile configurare l'estensione direttamente tramite le impostazioni di Visual Studio Code.
- **📊 Report In Markdown**: genera report in formato Markdown per una facile lettura e condivisione dei risultati.

## 🔧 **Requisiti di Sistema**

- **Visual Studio Code** (versione ^1.89.0")
- **Docker Desktop** (in esecuzione)

## 🚀 **Guida Rapida**

1. **Installazione dell'estensione**:

   - Aprire VSCode
   - Premere `Ctrl+Shift+X`
   - Cercare "Mythril VSC" e installare

2. **Preparazione dell'ambiente**:

   - Verificare che Docker Desktop sia in esecuzione
   - Aprire il file del contratto Solidity da analizzare

3. **Avvio dell'analisi**:

   - Click destro sul file del contratto
   - Selezionare `Mythril-VSC: Analyze File`
   - In alternativa, utilizzare l'icona 👁️ in alto a destra o la combinazine di tasti "ctrl\cmd + m".

4. **Visualizzazione dei risultati**:
   - Il report dell'analisi si aprirà automaticamente in una nuova tab.

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

2. **Errori di solc**:

   - Assicurarsi che il pacchetto `@openzeppelin/contracts` sia installato correttamente.
   - Controllare che i file importati abbiano una versione di solc compatibile con quella del contratto da analizzare.

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

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](./LICENSE.txt) per i dettagli.
