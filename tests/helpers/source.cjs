const fs = require('node:fs');
const path = require('node:path');

/** Load the production module graph into a VM-friendly source string for DOM fakes.
 * Pure engine tests also import the real ES modules directly.
 */
function gameSource(entry = 'src/main.js') {
  const visited = new Set();
  const chunks = [];
  function visit(filename) {
    filename = path.resolve(filename);
    if (visited.has(filename)) return;
    visited.add(filename);
    let source = fs.readFileSync(filename, 'utf8');
    const imports = [...source.matchAll(/^import\s+[\s\S]*?\sfrom\s+['"]([^'"]+)['"];?/gm)];
    for (const match of imports) visit(path.resolve(path.dirname(filename), match[1]));
    source = source.replace(/^import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"];?\s*/gm, '');
    source = source.replace(/\bexport\s+(?=(?:const|function)\b)/g, '');
    chunks.push(source);
  }
  visit(entry);
  return chunks.join('\n');
}

module.exports = { gameSource };
