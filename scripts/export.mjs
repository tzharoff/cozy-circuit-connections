import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';

// Bundle each standalone entry independently so shared production chunks do not
// leave imports that would fail when the file is opened directly from disk.
await mkdir('exports', { recursive: true });
// Replace the bundled font import with @font-face rules whose files are embedded as data URIs.
const fontDir = 'node_modules/@fontsource-variable/fredoka';
const fontCss = (await readFile(path.join(fontDir, 'index.css'), 'utf8')).replace(
  /url\(\.\/(files\/[^)]+\.woff2)\)/g,
  (_, file) => 'url(data:font/woff2;base64,' + '\0' + file + ')',
);
async function embedFonts(css) {
  let faces = fontCss;
  for (const [, file] of fontCss.matchAll(/\0([^)]+)/g)) {
    const data = (await readFile(path.join(fontDir, file))).toString('base64');
    faces = faces.replace('\0' + file, data);
  }
  return css.replace("@import '@fontsource-variable/fredoka';", () => faces);
}
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
  if (html.includes('/branding/tony-splash.png')) {
    const splash = (await readFile('public/branding/tony-splash.png')).toString('base64');
    html = html.replaceAll('/branding/tony-splash.png', `data:image/png;base64,${splash}`);
  }
  // Keep standalone exports independent of the public asset directory.
  for (const size of [32, 180]) {
    const icon = (await readFile(`public/icons/icon-${size}.png`)).toString('base64');
    html = html.replaceAll(`/icons/icon-${size}.png`, `data:image/png;base64,${icon}`);
  }
  const css = await embedFonts(
    (await Promise.all(styles.map((f) => readFile(f, 'utf8')))).join('\n'),
  );
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
