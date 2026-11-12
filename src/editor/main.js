import { types, shapes, levels } from '../data/definitions.js';
import { authoredLevels } from '../data/authored-levels.js';
import { makeStage } from '../game/generate.js';
import { parseLevel, levelState } from '../game/level-format.js';
import { route, findPair, breakShields, boardStatus, insideBoard } from '../game/rules.js';
import { componentIcon } from '../ui/components.js';
import { boardMarkup } from '../ui/view.js';
import { createEffects } from '../ui/effects.js';
import { newLevel, fromStage, paint, analyze, solveLevel, createDraft } from './model.js';

const $ = (id) => document.getElementById(id);
const esc = (text) =>
  String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const DRAFT_KEY = 'cozyEditorDraftV1',
  LIBRARY_KEY = 'cozyEditorLibraryV1';
let initial = fromStage(makeStage(1), levels[0], 1),
  library = {};
try {
  const saved = JSON.parse(localStorage.getItem(DRAFT_KEY));
  if (saved) initial = parseLevel(saved);
} catch {}
try {
  const saved = JSON.parse(localStorage.getItem(LIBRARY_KEY));
  if (saved && typeof saved === 'object' && !Array.isArray(saved))
    for (const [id, value] of Object.entries(saved)) {
      try {
        const level = parseLevel(value);
        if (id === level.id)
          Object.defineProperty(library, id, {
            value: level,
            writable: true,
            enumerable: true,
            configurable: true,
          });
      } catch {}
    }
} catch {}
let draft = createDraft(initial),
  brush = { type: 'chip', value: 1 },
  playing = null,
  selected = null,
  hints = [],
  busy = false,
  stroke = false,
  lastPaint = -1,
  revision = 0,
  session = 0,
  checking = false;
const effects = createEffects({
  getElement: $,
  getState: () => playing || levelState(draft.value),
});
function message(text) {
  $('editorMessage').textContent = text;
}
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft.value));
    $('draftStatus').textContent = 'Draft saved locally';
  } catch {
    $('draftStatus').textContent = 'Local save unavailable — download JSON to keep your work';
  }
}
function change(next) {
  if (playing) return;
  if (draft.replace(next)) {
    revision++;
    $('solutionMessage').textContent = 'Layout changed. Check for a solution when ready.';
    saveDraft();
  }
  render();
}
function replaceDraft(next) {
  draft = createDraft(parseLevel(next));
  revision++;
  $('solutionMessage').textContent = 'Layout loaded. Check for a solution when ready.';
  $('jsonText').value = '';
  saveDraft();
  render();
  message('Layout loaded. Your campaign progress is untouched.');
}
function editAllowed() {
  if (playing) {
    message('Return to editing before changing a layout.');
    return false;
  }
  return true;
}
function metadata() {
  const l = draft.value;
  for (const [id, key] of [
    ['levelId', 'id'],
    ['levelName', 'name'],
    ['levelTip', 'tip'],
  ])
    l[key] = $(id).value;
  l.campaignStage = Number($('campaignStage').value);
  if (
    !Number.isInteger(l.campaignStage) ||
    l.campaignStage < 1 ||
    l.campaignStage > levels.length + 1
  )
    throw Error('Choose an existing stage or append stage ' + (levels.length + 1) + '.');
  return parseLevel(l);
}
function syncMetadata() {
  try {
    change(metadata());
  } catch (e) {
    message(e.message);
  }
}
function renderBrushes() {
  const buttons = types
    .map(
      (t, i) =>
        `<button data-brush="chip" data-value="${i + 1}" aria-pressed="${brush.type === 'chip' && brush.value === i + 1}" class="${brush.type === 'chip' && brush.value === i + 1 ? 'active' : ''}">${componentIcon(i)}${t.name}</button>`,
    )
    .join('');
  const tools = [
    ['shield', '⬡', 'Shield toggle'],
    ['wall', '▰', 'Wall'],
    ['erase', '×', 'Erase'],
    ['floor', '□', 'Floor socket'],
    ['lane', '·', 'Open lane'],
  ]
    .map(
      ([key, icon, label]) =>
        `<button data-brush="${key}" aria-pressed="${brush.type === key}" class="${brush.type === key ? 'active' : ''}"><span class="tool-icon">${icon}</span>${label}</button>`,
    )
    .join('');
  $('brushes').innerHTML = buttons + tools;
  for (const b of $('brushes').querySelectorAll('button')) b.disabled = !!playing;
}
function editMarkup(l) {
  return l.board
    .map((v, i) => {
      if (!insideBoard(i)) return '<div class="outside" hidden aria-hidden="true"></div>';
      let cls = l.walls[i] ? 'wall' : v ? 'chip' : l.mask[i] ? 'socket' : 'lane';
      const content = l.walls[i]
        ? '<span>▰</span>'
        : v
          ? componentIcon(v - 1) + `<small>${types[v - 1].name.slice(0, 3).toUpperCase()}</small>`
          : l.mask[i]
            ? '+'
            : '·';
      return `<button class="editor-cell ${cls} ${l.shields[i] ? 'shielded' : ''} ${l.shields[i] > 1 ? 'double' : ''}" data-cell="${i}" aria-label="Row ${(i / 8) | 0}, column ${i % 8}: ${l.walls[i] ? 'wall' : v ? (l.shields[i] > 1 ? 'double-shielded ' : l.shields[i] ? 'shielded ' : '') + types[v - 1].name : l.mask[i] ? 'empty floor' : 'open lane'}">${content}${l.shields[i] ? '<span class="shield-mark" aria-hidden="true">' + (l.shields[i] > 1 ? '2' : '⬡') + '</span>' : ''}</button>`;
    })
    .join('');
}
function renderLibrary() {
  const value = $('librarySelect').value;
  $('librarySelect').innerHTML =
    '<option value="">Choose a saved level</option>' +
    Object.values(library)
      .map((l) => `<option value="${esc(l.id)}">${esc(l.name)}</option>`)
      .join('');
  if (Object.hasOwn(library, value)) $('librarySelect').value = value;
}
function render() {
  const l = draft.value,
    report = analyze(l);
  $('board').innerHTML = playing
    ? boardMarkup({ state: playing, selected, hints, busy })
    : editMarkup(l);
  $('board').classList.toggle('editor-board', !playing);
  $('modeTitle').textContent = playing
    ? 'PLAY TEST · ' + playing.score + ' PAIRS CLEARED'
    : 'EDIT MODE';
  $('testLevel').hidden = !!playing;
  $('stopTest').hidden = !playing;
  $('testTools').hidden = !playing;
  $('testUndo').disabled = busy || !playing?.history.length;
  $('testRestart').disabled = busy;
  $('testHint').disabled = busy;
  $('editUndo').disabled = !!playing || !draft.canUndo;
  $('editRedo').disabled = !!playing || !draft.canRedo;
  $('testLevel').disabled = report.errors.length > 0;
  $('checkSolution').disabled = checking || !!playing || report.errors.length > 0;
  $('levelId').value = l.id;
  $('levelName').value = l.name;
  $('levelTip').value = l.tip;
  $('campaignStage').value = l.campaignStage || 1;
  for (const id of [
    'levelId',
    'levelName',
    'levelTip',
    'campaignStage',
    'newDraft',
    'applyShape',
    'loadStage',
    'loadSaved',
    'applyJson',
    'importFile',
    'campaignExport',
    'downloadLevel',
    'saveLevel',
    'deleteSaved',
  ])
    $(id).disabled = !!playing;
  $('boardStats').textContent =
    `${report.chips} chips · ${report.pairs} pairs · ${report.shields} shields · ${report.walls} walls`;
  $('validationMessages').innerHTML = report.errors.length
    ? report.errors.map((e) => '<li>' + esc(e) + '</li>').join('')
    : '<li>Chip counts and placements are valid. Use the solution check and play-test to assess routes.</li>';
  $('componentCounts').innerHTML = types
    .map(
      (t, i) =>
        `<span class="${report.counts[i] % 2 ? 'odd' : ''}">${t.name}: ${report.counts[i] || 0}</span>`,
    )
    .join('');
  renderBrushes();
  renderLibrary();
}
function paintCell(i) {
  if (!editAllowed() || lastPaint === i) return;
  lastPaint = i;
  try {
    change(paint(draft.value, i, brush));
    message(
      brush.type === 'shield'
        ? 'Shield changed. Tap again to cycle: shield, double shield (two nearby matches), none.'
        : 'Cell painted. Odd component counts must be paired before testing.',
    );
  } catch (e) {
    message(e.message);
  }
}
function startTest() {
  const report = analyze(draft.value);
  if (report.errors.length) {
    message(report.errors.join(' '));
    return;
  }
  session++;
  effects.clearWire();
  playing = levelState(draft.value);
  selected = null;
  hints = [];
  busy = false;
  render();
  message('Test mode. Same routing, shields, walls, spark, and pop as the game.');
}
function testStatus() {
  const status = boardStatus(playing.board, playing.shields, playing.walls);
  message(
    status === 'cleared'
      ? 'Test clear! The draft is unchanged. Return to editing or try again.'
      : status === 'stuck'
        ? 'Test stuck: no legal pair remains. Undo a test move or return to editing.'
        : 'Connection made. Keep testing the layout.',
  );
  render();
}
function choose(i) {
  if (!playing || busy || !playing.board[i]) return;
  if (playing.shields[i]) {
    message('Shielded: clear a neighboring pair to free this chip.');
    return;
  }
  if (selected === null) {
    selected = i;
    hints = [];
    render();
    return;
  }
  if (selected === i) {
    selected = null;
    render();
    return;
  }
  const path = route(playing.board, selected, i, playing.shields, playing.walls);
  if (!path) {
    selected = i;
    message('No route with at most two bends. This chip is now selected.');
    render();
    return;
  }
  const first = selected,
    token = session;
  busy = true;
  hints = [first, i];
  render();
  effects.draw(path, () => {
    if (token !== session || !playing) return;
    effects.popPair(first, i, () => {
      if (token !== session || !playing) return;
      playing.history.push({
        board: playing.board.slice(),
        shields: playing.shields.slice(),
        score: playing.score,
      });
      playing.board[first] = playing.board[i] = 0;
      breakShields(playing.shields, first, i);
      playing.score++;
      busy = false;
      selected = null;
      hints = [];
      testStatus();
    });
  });
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function json() {
  return JSON.stringify(draft.value, null, 2);
}
$('brushes').onclick = (e) => {
  const b = e.target.closest('[data-brush]');
  if (!b || playing) return;
  brush = { type: b.dataset.brush, value: Number(b.dataset.value) };
  lastPaint = -1;
  renderBrushes();
  message('Selected ' + b.textContent.trim() + '. Click cells to paint.');
};
$('board').addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || playing) return;
  const c = e.target.closest('[data-cell]');
  if (c) {
    stroke = true;
    lastPaint = -1;
    paintCell(Number(c.dataset.cell));
  }
});
$('board').addEventListener('pointerover', (e) => {
  if (!stroke || !e.buttons || playing) return;
  const c = e.target.closest('[data-cell]');
  if (c) paintCell(Number(c.dataset.cell));
});
document.addEventListener('pointerup', () => {
  stroke = false;
  lastPaint = -1;
});
$('board').onclick = (e) => {
  if (playing) {
    const c = e.target.closest('[data-chip]');
    if (c) choose(Number(c.dataset.chip));
  } else if (e.detail === 0) {
    const c = e.target.closest('[data-cell]');
    if (c) {
      lastPaint = -1;
      paintCell(Number(c.dataset.cell));
    }
  }
};
for (const id of ['levelId', 'levelName', 'levelTip', 'campaignStage'])
  $(id).onchange = syncMetadata;
$('editUndo').onclick = () => {
  if (!editAllowed()) return;
  draft.undo();
  $('solutionMessage').textContent = 'Layout changed. Check for a solution when ready.';
  revision++;
  saveDraft();
  render();
  message('Edit undone.');
};
$('editRedo').onclick = () => {
  if (!editAllowed()) return;
  draft.redo();
  $('solutionMessage').textContent = 'Layout changed. Check for a solution when ready.';
  revision++;
  saveDraft();
  render();
  message('Edit restored.');
};
$('newDraft').onclick = () => {
  if (
    editAllowed() &&
    confirm('Start a new empty draft? Save your current board to the shelf or JSON first.')
  )
    replaceDraft(newLevel($('shapeTemplate').value));
};
$('applyShape').onclick = () => {
  if (editAllowed() && confirm('Replace this layout with an empty shape?')) {
    const l = newLevel($('shapeTemplate').value);
    l.id = draft.value.id;
    l.name = draft.value.name;
    l.tip = draft.value.tip;
    l.campaignStage = draft.value.campaignStage;
    change(l);
  }
};
$('loadStage').onclick = () => {
  if (editAllowed() && confirm('Load this campaign stage over the current draft?')) {
    const n = Number($('stageSource').value);
    replaceDraft(fromStage(makeStage(n), levels[n - 1], n));
  }
};
$('saveLevel').onclick = () => {
  if (!editAllowed()) return;
  try {
    const l = metadata();
    change(l);
    if (Object.hasOwn(library, l.id) && !confirm('Replace the saved level with ID ' + l.id + '?'))
      return;
    Object.defineProperty(library, l.id, {
      value: l,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
    renderLibrary();
    $('librarySelect').value = l.id;
    message('Saved to this browser’s level shelf. Download JSON for a backup.');
  } catch (e) {
    message('Could not save: ' + e.message);
  }
};
$('loadSaved').onclick = () => {
  if (!editAllowed()) return;
  const id = $('librarySelect').value;
  if (Object.hasOwn(library, id) && confirm('Load this saved level over the current draft?'))
    replaceDraft(library[id]);
};
$('deleteSaved').onclick = () => {
  if (!editAllowed()) return;
  const id = $('librarySelect').value;
  if (
    !Object.hasOwn(library, id) ||
    !confirm('Remove this level from the local shelf? Download a backup first if needed.')
  )
    return;
  delete library[id];
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
    renderLibrary();
    message('Removed from the shelf. The open draft is unchanged.');
  } catch (e) {
    message(e.message);
  }
};
$('showJson').onclick = () => {
  $('jsonText').value = json();
  message('Current draft JSON shown below. You can edit and apply it.');
};
$('applyJson').onclick = () => {
  if (!editAllowed()) return;
  try {
    replaceDraft(JSON.parse($('jsonText').value));
  } catch (e) {
    message('JSON not applied: ' + e.message);
  }
};
$('downloadLevel').onclick = () => {
  if (!editAllowed()) return;
  try {
    change(metadata());
    download(draft.value.id + '.json', json(), 'application/json');
    message('Level JSON downloaded. Incomplete drafts can be backed up too.');
  } catch (e) {
    message(e.message);
  }
};
$('importFile').onchange = async (e) => {
  const file = e.target.files?.[0];
  if (!file || !editAllowed()) return;
  try {
    if (file.size > 100000) throw Error('Level JSON must be under 100 KB.');
    const value = parseLevel(JSON.parse(await file.text()));
    if (confirm('Import ' + value.name + ' over the current draft?')) replaceDraft(value);
  } catch (error) {
    message('Import rejected: ' + error.message);
  } finally {
    e.target.value = '';
  }
};
$('campaignExport').onclick = () => {
  if (!editAllowed()) return;
  try {
    change(metadata());
    const report = analyze(draft.value);
    if (report.errors.length) throw Error(report.errors.join(' '));
    const overrides = { ...authoredLevels, [draft.value.campaignStage]: draft.value };
    const code =
      '/** Campaign overrides exported by the level editor. */\nexport const authoredLevels = ' +
      JSON.stringify(overrides, null, 2) +
      ';\n';
    $('jsonText').value = code;
    download('authored-levels.js', code, 'text/javascript');
    message(
      'Downloaded authored-levels.js. Replace src/data/authored-levels.js and rebuild to apply it. Run the solution check before publishing.',
    );
  } catch (e) {
    message('Campaign export blocked: ' + e.message);
  }
};
$('checkSolution').onclick = () => {
  if (checking || playing) return;
  const token = revision;
  checking = true;
  render();
  $('solutionMessage').textContent = 'Checking routes and shield order…';
  setTimeout(() => {
    const result = solveLevel(draft.value);
    checking = false;
    if (token !== revision) {
      render();
      return;
    }
    $('solutionMessage').textContent =
      result.status === 'solved'
        ? 'Solution found: ' +
          result.moves.length +
          ' pairs can be cleared in a verified order. This does not mean every move order wins.'
        : result.status === 'unsolvable'
          ? 'No solution exists under the current rules. Change chips, shields, or walls.'
          : result.status === 'inconclusive'
            ? 'Search limit reached. Solvability is unknown; simplify the layout or play-test it.'
            : result.reason;
    render();
  }, 20);
};
$('testLevel').onclick = startTest;
$('stopTest').onclick = () => {
  session++;
  effects.clearWire();
  playing = null;
  selected = null;
  hints = [];
  busy = false;
  $('pops').innerHTML = '';
  render();
  message('Back in edit mode. Your draft has not changed.');
};
$('testRestart').onclick = () => {
  if (!busy) startTest();
};
$('testUndo').onclick = () => {
  if (busy || !playing?.history.length) return;
  effects.clearWire();
  Object.assign(playing, playing.history.pop());
  selected = null;
  hints = [];
  testStatus();
};
$('testHint').onclick = () => {
  if (busy || !playing) return;
  const p = findPair(playing.board, playing.shields, playing.walls);
  if (p) {
    hints = [p.a, p.z];
    selected = null;
    render();
    effects.draw(p.path);
    message('Highlighted pair has a valid route.');
  } else testStatus();
};
$('shapeTemplate').innerHTML = Object.entries(shapes)
  .map(([key, s]) => `<option value="${key}">${s.name}</option>`)
  .join('');
$('campaignStage').max = levels.length + 1;
$('stageSource').innerHTML = levels
  .map((l, i) => `<option value="${i + 1}">${i + 1}. ${esc(l.name)}</option>`)
  .join('');
saveDraft();
render();
