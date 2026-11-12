import assert from 'node:assert/strict';
import { make, makeStage, makeTutorial } from '../src/game/generate.js';
import { levels, lessons } from '../src/data/definitions.js';
import { findPair, breakShields, solvable, shieldLayers } from '../src/game/rules.js';
import { createStorage } from '../src/platform/storage.js';

// These import the actual modules without a browser or the integration-test loader.
for (let stage = 1; stage <= levels.length; stage++) {
  const s = makeStage(stage);
  assert.deepEqual(s, makeStage(stage), 'Stage generation must remain deterministic');
  assert(solvable(s.board, s.shields, s.walls));
}
for (let lesson = 0; lesson < lessons.length; lesson++) {
  const s = makeTutorial(lesson);
  assert(solvable(s.board, s.shields, s.walls));
}
const s = make(234, 'bridge');
const pair = findPair(s.board, s.shields, s.walls);
assert(pair);
assert(!pair.path.some((p) => s.walls[p]));
s.board[pair.a] = s.board[pair.z] = 0;
breakShields(s.shields, pair.a, pair.z);
const memory = new Map();
const store = createStorage({
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
});
store.saveGame({ state: s, wins: 7, completed: [1, 2], tutorialDone: true });
assert.deepEqual(store.loadCurrent(), { state: s, wins: 7 });
assert.deepEqual(store.loadProgress().completed, [1, 2]);
assert.equal(store.loadProgress().tutorialDone, true);
const blocked = createStorage({
  getItem() {
    throw Error('blocked');
  },
  setItem() {
    throw Error('full');
  },
});
assert.deepEqual(blocked.loadCurrent(), { state: undefined, wins: 0 });
assert.doesNotThrow(() =>
  blocked.saveGame({ state: s, wins: 0, completed: [], tutorialDone: false }),
);
// Double shields: each match beside the chip removes one layer, once per match even when the
// chip touches both matched chips; it is only freed when the last layer goes.
const layers = Array(64).fill(0);
layers[18] = 2; // row 2, column 2: beside both 10 (above) and 17 (left)
assert.equal(breakShields(layers, 10, 17), 0);
assert.equal(layers[18], 1);
assert.equal(breakShields(layers, 19, 40), 1);
assert.equal(layers[18], 0);
assert.equal(shieldLayers([2, 1, 0, 2]), 5);
// The double-shield stages have exactly the double shields their specs ask for.
for (let n = 1; n <= levels.length; n++) {
  const s = makeStage(n),
    spec = levels[n - 1];
  assert.equal(s.shields.filter((v) => v === 2).length, spec.doubleShields || 0, 'stage ' + n);
  assert(solvable(s.board, s.shields, s.walls), 'stage ' + n);
}
assert(levels.some((l) => l.doubleShields));
console.log(
  'PASS: double shields (one layer per match, freed at zero), double-shield stages, native ES-module engine imports, deterministic boards, tutorial, wall-aware routes, save roundtrip, blocked storage',
);
