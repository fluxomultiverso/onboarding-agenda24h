import {readFileSync, writeFileSync} from 'node:fs';
const root = new URL('../', import.meta.url);
for (const name of ['index.html', 'onboarding-agenda24h.html']) {
  let html = readFileSync(new URL(name, root), 'utf8');
  if (!html.includes('rel="icon"')) html = html.replace('</head>', '<link rel="icon" type="image/png" href="favicon.png">\n<link rel="apple-touch-icon" href="favicon.png">\n</head>');
  if (!html.includes('/* Identidade 2026 */')) html = html.replace('</head>', '<style>/* Identidade 2026 */\n.brand #brand-logo{width:220px;height:auto;object-fit:contain;border-radius:0}@media(max-width:650px){.brand #brand-logo{width:140px}}</style>\n</head>');
  writeFileSync(new URL(name, root), html);
}
let html = readFileSync(new URL('index.html', root), 'utf8');
html = html.replace('<title>Agenda 24h — Onboarding</title>', '<title>Agenda 24h — Cadastro comercial</title>')
  .replace(/<script src="(?:pdf-lib\.min\.js|contrato-pdf\.js[^"]*)"><\/script>\s*/g, '')
  .replace(/<\/body>\s*<\/html>\s*$/, '<script src="vendedora.js?v=20261021-compartilhar"></script>\n</body>\n</html>\n');
writeFileSync(new URL('vendedora.html', root), html);
console.log('Página comercial gerada a partir do onboarding principal.');
