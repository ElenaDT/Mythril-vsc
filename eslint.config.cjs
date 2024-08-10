'use strict';

const globals = require('globals');
const pluginJs = require('@eslint/js');

module.exports = [
  {
    languageOptions: {
      globals: {
        ...globals.node, // Include le definizioni delle variabili globali di Node.js
      },
      ecmaVersion: 2021, // Imposta la versione ECMAScript da utilizzare
      sourceType: 'script', // Imposta su 'script' per utilizzare CommonJS
    },
  },
  {
    ...pluginJs.configs.recommended,
    rules: {
      'no-console': 'warn', // Avvisa sull'uso di console.log
      'no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }], // Avvisa su variabili non utilizzate
      'prefer-const': 'warn', // Usa const dove possibile
      'eqeqeq': ['warn', 'always'], // Usa === ed !== anziché == ed !=
      'curly': 'warn', // Richiede le parentesi per le dichiarazioni e i blocchi
      'semi': ['warn', 'always'], // Richiede il punto e virgola
      'indent': ['warn', 2], // Usa 2 spazi per l'indentazione
      'quotes': ['warn', 'single'], // Preferisci le virgolette singole
      'no-undef': 'error', // Ogni variabile deve essere definita prima dell'uso
      'block-scoped-var': 'warn', // Usa variabili bloccate in scope
      'consistent-return': 'warn', // Consistenza nei valori restituiti dalle funzioni
      'no-redeclare': 'error', // Evitare dichiarazioni di variabili ridondanti
      'strict': ['error', 'global'], // Usa la modalità rigorosa
      'no-var': 'error', // Impedisce l'uso di var, per incoraggiare let e const
    }
  },
];
