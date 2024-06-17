# mythril-vsc README

Un'estensione per integrare l'uso di Mythril in Visual Studio Code.

## Sviluppo

Il branch di sviluppo è `develop`.

### Debug

Si può testare l'applicazione clonando la [relativa repository](https://github.com/ElenaDT/Tesi_code.git) e avviandone l'esecuzione con il debugger di VSC premendo il tasto F5.

## Installazione dal codice binario

Se si vuole solo una demo, è possibile installare l'estensione dal file `.vsix`.

### Istruzioni per installare VSIX

- Visualizza > Estensioni;
- click sui tre puntini in alto nel tab delle estensioni > "Installa da VSIX";
- Riavviare VSC, se necessario.

## Funzionalità

Per lanciare l'analisi di un contratto, cliccare sul nome del file `<contratto>.sol` con il tasto destro > 'Mythril-VSC: Analyze File'.

![Analisi dei contratti](images/analyze.png)

In alternativa, se il contratto è aperto nell'editor, si può lanciare il comando 'Mythril-VSC: Analyze File' direttamente cliccando sull'icona in alto a destra come mostrato.

![Analisi dei contratti da editor](images/analyze-from-editor.png)

## Impostazioni

Dalle impostazioni è possibile scegliere il tempo di esecuzione del processo di analisi del contratto.

![Impostare tempo di esecuzione del processo](images/exec-timeout.png)

## Dipendenze

- node.js
- npm
- Mythril
