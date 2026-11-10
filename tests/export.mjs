import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('exports/Cozy Circuit Connections.html', 'utf8');
assert(html.includes('<script type="module">'));
assert(html.includes('<style>'));
assert(!/<script\b[^>]*\bsrc=/.test(html), 'Standalone export must not require a JS file');
assert(!/<link\b[^>]*\brel="stylesheet"/.test(html), 'Standalone export must embed its CSS');
assert(!/\b(?:src|href)="\/?(?:\.\/)?(?:src|assets)\//.test(html));
assert(!html.includes('href="./index.html"'));
for (const id of ['board', 'stageWin', 'levelPicker', 'tutorialCoach', 'wires', 'pops']) {
  assert(html.includes(`id="${id}"`), `Missing exported game surface: ${id}`);
}
console.log('PASS: standalone export embeds bundles and preserves game surfaces');
