import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Vite bundles modules first; this export only embeds its built JS/CSS assets.
let html = await readFile('dist/index.html', 'utf8');
const script = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
const style = html.match(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/);
if (!script || !style) throw new Error('Expected a Vite JavaScript bundle and stylesheet.');
function asset(url) {
  const filename = path.resolve('dist', url);
  if (!filename.startsWith(path.resolve('dist') + path.sep)) throw new Error('Invalid asset path');
  return readFile(filename, 'utf8');
}
const javascript = (await asset(script[1])).replace(/<\/script/gi, '<\\/script');
const css = await asset(style[1]);
html = html.replace(script[0], () => `<script type="module">${javascript}</script>`);
html = html.replace(style[0], () => `<style>${css}</style>`);
// The standalone file has no sibling index page to navigate back to.
html = html.replace('href="./index.html"', 'href="#"');
await mkdir('exports', { recursive: true });
await writeFile('exports/Cozy Circuit Connections.html', html);
console.log('Created exports/Cozy Circuit Connections.html');
