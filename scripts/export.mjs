import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';

// Bundle each standalone entry independently so shared production chunks do not
// leave imports that would fail when the file is opened directly from disk.
await mkdir('exports', { recursive: true });
async function exportPage({ shell, entry, styles, filename, name }) {
  const result = await build({
    configFile: false,
    build: {
      write: false,
      lib: { entry: path.resolve(entry), formats: ['iife'], name, fileName: name },
      minify: true,
    },
  });
  const bundles = Array.isArray(result) ? result : [result];
  const code = bundles
    .flatMap((r) => r.output)
    .filter((o) => o.type === 'chunk')
    .map((o) => o.code)
    .join('\n')
    .replace(/<\/script/gi, '<\\/script');
  let html = await readFile(shell, 'utf8');
  const css = (await Promise.all(styles.map((f) => readFile(f, 'utf8')))).join('\n');
  html = html.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, '');
  html = html.replace('</head>', () => '<style>' + css + '</style></head>');
  html = html.replace(
    /<script\b[^>]*\bsrc="[^"]+"[^>]*><\/script>/,
    () => '<script type="module">' + code + '</script>',
  );
  html = html.replace(
    'href="./index.html"',
    shell === 'index.html' ? 'href="#"' : 'href="Cozy%20Circuit%20Connections.html"',
  );
  await writeFile(path.join('exports', filename), html);
  console.log('Created exports/' + filename);
}
await exportPage({
  shell: 'index.html',
  entry: 'src/main.js',
  styles: ['src/styles/game.css'],
  filename: 'Cozy Circuit Connections.html',
  name: 'CozyCircuitGame',
});
await exportPage({
  shell: 'editor.html',
  entry: 'src/editor/main.js',
  styles: ['src/styles/game.css', 'src/editor/editor.css'],
  filename: 'Cozy Circuit Connections - Level Editor.html',
  name: 'CozyCircuitEditor',
});
