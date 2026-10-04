# Logic Flow

Logic Flow è un prototipo didattico per esercitarsi con l’analisi logica. La persona divide una frase in gruppi, assegna a ogni gruppo una funzione e riceve un riscontro immediato.

[Apri il gioco](https://collivignarellioffice-byte.github.io/logic-flow-analisi-logica/) · [Leggi la presentazione](https://collivignarellioffice-byte.github.io/logic-flow-analisi-logica/presentation/)

## Cosa contiene

- modalità classica da due minuti, con tre vite e frasi senza ripetizioni;
- 34 esercizi curati, dai casi di base alle frasi con più complementi;
- sfida singola con un solo tentativo e correzione consultabile;
- quiz rapido sulle funzioni logiche;
- minigioco con dodici errori grammaticali verificabili;
- guida sintetica al metodo di analisi;
- interfaccia responsive per telefono e browser desktop.

## Interventi sul prototipo originale

Il progetto nasce come app Expo Snack. La versione pubblicata:

- sostituisce gli esercizi generati e duplicati con un insieme finito e controllabile;
- rimuove classifica, amici, premium, recensioni e notifiche che non avevano un servizio reale;
- presenta punteggi e profilo come dati della sola sessione;
- permette di cambiare un’assegnazione prima della verifica;
- chiude le partite con una schermata di risultato stabile anche sul web;
- usa una cornice centrata su desktop e l’intera larghezza disponibile su mobile.

## Avvio locale

Richiede Node.js 22 o successivo.

```bash
npm install
npm run web
```

Per produrre la versione statica usata da GitHub Pages:

```bash
npm run build:web
```

La build viene salvata in `dist` e include anche la presentazione in `dist/presentation`.

## Test

```bash
npm test
```

I test verificano assegnazioni, calcolo delle risposte, selezione delle frasi, vite, punteggi e mescolamento delle domande.

## Limiti

Il prototipo non usa un backend. Nome, avatar, risultati e punti non vengono salvati dopo la chiusura o il ricaricamento della pagina. Non sono presenti account, classifica online o contenuti generati automaticamente.

## Stack

React Native, Expo, React Native Web, JavaScript, HTML e CSS.

## Licenza

MIT.
