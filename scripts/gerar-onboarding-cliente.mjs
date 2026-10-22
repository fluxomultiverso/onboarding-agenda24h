import {readFileSync, writeFileSync} from 'node:fs';
const root = new URL('../', import.meta.url);
// Reutiliza o formulário e a linguagem comercial, sem controles ou recuperação da vendedora.
const commercial = readFileSync(new URL('vendedora.js', root), 'utf8');
writeFileSync(new URL('cliente-base.js', root), commercial.split("document.addEventListener('DOMContentLoaded'")[0]);
let html = readFileSync(new URL('index.html', root), 'utf8');
html = html.replace('<title>Agenda 24h — Onboarding</title>', '<title>Agenda 24h — Cadastro da sua empresa</title>')
  .replace(/<script src="(?:pdf-lib\.min\.js|contrato-pdf\.js[^"]*)"><\/script>\s*/g, '')
  .replace('</head>', '<style>.header-actions,#btn-next[hidden]{display:none}</style>\n</head>')
  .replace(/<\/body>\s*<\/html>\s*$/, '<script src="cliente-base.js?v=20261021"></script>\n<script src="cliente.js?v=20261021"></script>\n</body>\n</html>\n');
writeFileSync(new URL('cliente.html', root), html);
console.log('Página do cliente gerada.');
