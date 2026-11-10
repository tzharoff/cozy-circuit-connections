import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  newLevel,
  fromStage,
  paint,
  analyze,
  solveLevel,
  createDraft,
} from '../src/editor/model.js';
import { parseLevel, levelState } from '../src/game/level-format.js';
import { makeStage } from '../src/game/generate.js';
import { levels } from '../src/data/definitions.js';
import { authoredLevels } from '../src/data/authored-levels.js';
import { route, breakShields, boardStatus } from '../src/game/rules.js';

for (let n = 1; n <= 12; n++) {
  const state = makeStage(n),
    level = fromStage(state, levels[n - 1], n),
    roundtrip = parseLevel(JSON.parse(JSON.stringify(level)));
  assert.deepEqual(roundtrip, level);
  assert.deepEqual(levelState(level).board, state.board);
  assert.equal(analyze(level).errors.length, 0);
  const solution = solveLevel(level);
  assert.equal(solution.status, 'solved');
  const game = levelState(level);
  for (const [a, z] of solution.moves) {
    assert(route(game.board, a, z, game.shields, game.walls));
    game.board[a] = game.board[z] = 0;
    breakShields(game.shields, a, z);
  }
  assert.equal(boardStatus(game.board, game.shields, game.walls), 'cleared');
}
let l = newLevel('cross');
assert(analyze(l).errors.length);
assert.throws(() => paint(l, 0, { type: 'chip', value: 1 }));
assert.throws(() => paint(l, 9, { type: 'shield' }));
l = paint(l, 26, { type: 'chip', value: 1 });
assert(analyze(l).errors.some((e) => e.includes('Resistor')));
l = paint(l, 29, { type: 'chip', value: 1 });
assert.equal(analyze(l).errors.length, 0);
l = paint(l, 26, { type: 'shield' });
assert.equal(l.shields[26], 1);
l = paint(l, 26, { type: 'wall' });
assert.equal(l.shields[26], 0);
assert.equal(l.board[26], 0);
l = paint(l, 26, { type: 'chip', value: 1 });
assert.equal(l.walls[26], 0);
l = paint(l, 26, { type: 'lane' });
assert(!l.mask[26]);
assert.equal(l.board[26], 0);
const draft = createDraft(newLevel());
const isolated = draft.value;
isolated.board[26] = 1;
assert.equal(draft.value.board[26], 0);
draft.replace(paint(draft.value, 26, { type: 'chip', value: 1 }));
draft.undo();
assert.equal(draft.value.board[26], 0);
draft.redo();
assert.equal(draft.value.board[26], 1);
draft.undo();
draft.replace(paint(draft.value, 29, { type: 'chip', value: 2 }));
assert(!draft.canRedo);
const invalid = newLevel();
invalid.shields[9] = 2;
assert.throws(() => parseLevel(invalid), /Double shields/);
assert.throws(() => parseLevel({ ...newLevel(), board: [1] }));
const overlap = newLevel();
overlap.board[9] = 1;
overlap.walls[9] = 1;
assert.throws(() => parseLevel(overlap), /overlap/);
const badMask = newLevel();
badMask.mask[0] = true;
assert.throws(() => parseLevel(badMask));
const impossible = newLevel();
for (const [p, v] of [
  [9, 1],
  [10, 1],
  [45, 2],
  [46, 2],
])
  impossible.board[p] = v;
impossible.shields[45] = impossible.shields[46] = 1;
assert.equal(analyze(impossible).errors.length, 0);
assert.equal(solveLevel(impossible).status, 'unsolvable');
assert.equal(solveLevel(impossible, { maxStates: 0 }).status, 'inconclusive');
const authored = fromStage(makeStage(1), levels[0], 1);
authored.name = 'Workshop stage';
authoredLevels[1] = authored;
assert.deepEqual(makeStage(1).initial, authored.board);
assert.equal(makeStage(1).customLevel, true);
assert.deepEqual(makeStage(1).mask, authored.mask);
delete authoredLevels[1];
authoredLevels[13] = { ...authored, campaignStage: 13 };
const appended = await import('../src/data/definitions.js?test-append');
assert.equal(appended.levels.length, 13);
assert.equal(appended.levels[12].name, 'Workshop stage');
assert.equal(makeStage(13).stage, 13);
delete authoredLevels[13];
// Editor is a separate entry and does not import the game's persistence/controller.
const source = await readFile('src/editor/main.js', 'utf8');
assert(!source.includes("from '../main.js'"));
assert(!source.includes('circuitState'));
assert(source.includes('cozyEditorDraftV1'));
const html = await readFile('editor.html', 'utf8');
for (const m of source.matchAll(/\$\('([^']+)'\)/g))
  assert(html.includes('id="' + m[1] + '"'), 'missing editor element ' + m[1]);
console.log(
  'PASS: 12 campaign roundtrips and play-test solutions, painting, masks, parity, shield/wall rules, undo/redo, invalid imports, bounded solver, campaign override, editor isolation/DOM wiring',
);
