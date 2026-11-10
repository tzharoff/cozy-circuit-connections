import assert from 'node:assert/strict';
import { make, makeStage, makeTutorial } from '../src/game/generate.js';
import { levels, lessons } from '../src/data/definitions.js';
import { findPair, breakShields, solvable } from '../src/game/rules.js';
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
console.log(
  'PASS: native ES-module engine imports, deterministic boards, tutorial, wall-aware routes, save roundtrip, blocked storage',
);
