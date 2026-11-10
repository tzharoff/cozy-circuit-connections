import assert from 'node:assert/strict';
import { route, insideBoard, findPair, breakShields } from '../src/game/rules.js';
import { make, makeStage } from '../src/game/generate.js';
import { createStorage } from '../src/platform/storage.js';
import { boardMarkup } from '../src/ui/view.js';
import { newLevel, paint } from '../src/editor/model.js';
import { parseLevel } from '../src/game/level-format.js';

const b = Array(64).fill(0),
  w = Array(64).fill(0);
b[9] = b[11] = 1;
w[10] = 1;
const around = route(b, 9, 11, [], w);
assert(around);
assert(around.every(insideBoard));
w[17] = 1;
assert.equal(
  route(b, 9, 11, [], w),
  null,
  'An escape through the old top/left lanes must be rejected',
);
b[1] = b[6] = 2;
assert.equal(route(b, 1, 6), null, 'Outside cells cannot be endpoints');
for (const shape of ['classic', 'ring', 'cross', 'islands', 'bridge', 'steps'])
  for (let seed = 1; seed <= 30; seed++) {
    const s = make(seed, shape);
    assert(s.walls.every((v, i) => !v || insideBoard(i)));
    let p;
    while ((p = findPair(s.board, s.shields, s.walls))) {
      assert(p.path.every(insideBoard));
      s.board[p.a] = s.board[p.z] = 0;
      breakShields(s.shields, p.a, p.z);
    }
    assert(s.board.every((v) => !v));
  }
const stage = makeStage(12),
  markup = boardMarkup({ state: stage, selected: null, hints: [], busy: false });
assert.equal((markup.match(/class="outside"/g) || []).length, 28);
assert.equal(
  (markup.match(/<button|<div/g) || []).length,
  64,
  'Retain save-index/animation alignment',
);
const legacy = makeStage(4);
delete legacy.routingVersion;
legacy.walls[1] = 1;
const store = createStorage({ getItem: () => null, setItem() {} }),
  migrated = store.migrate(structuredClone(legacy));
assert.deepEqual(migrated.board, legacy.board, 'Do not silently replace an in-progress board');
assert(migrated.needsBoundaryRestart);
assert.equal(migrated.walls[1], 0);
assert.equal(migrated.routingVersion, 2);
const current = store.migrate(makeStage(4));
assert(!current.needsBoundaryRestart);
assert.throws(() => paint(newLevel(), 0, { type: 'wall' }), /inside/);
const oldDraft = newLevel();
oldDraft.walls[1] = 1;
assert.equal(parseLevel(oldDraft).walls[1], 0);
console.log(
  'PASS: hard 6×6 routing boundary, no outside endpoints/escapes, interior walls, 180 bounded solutions, 36 visible cells, index alignment, old-save/draft compatibility',
);
