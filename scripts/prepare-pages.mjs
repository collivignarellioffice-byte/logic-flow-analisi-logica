import { cp, readFile, writeFile } from 'node:fs/promises';

const outputDirectory = new URL('../dist/', import.meta.url);
const presentationDirectory = new URL('../presentation/', import.meta.url);
const indexPath = new URL('index.html', outputDirectory);

await cp(presentationDirectory, new URL('presentation/', outputDirectory), { recursive: true });
await writeFile(new URL('.nojekyll', outputDirectory), '');

let html = await readFile(indexPath, 'utf8');
html = html
  .replace('<html lang="en">', '<html lang="it">')
  .replaceAll('"/logic-flow-analisi-logica/', '"./')
  .replace(
    '</head>',
    `  <meta name="description" content="Gioco didattico per esercitarsi con l’analisi logica attraverso frasi, quiz e correzioni." />
    <meta property="og:title" content="Logic Flow · Analisi logica" />
    <meta property="og:description" content="Scomponi la frase e assegna a ogni parte la sua funzione logica." />
    <meta name="theme-color" content="#173D2C" />
  </head>`
  );

await writeFile(indexPath, html);
