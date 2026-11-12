import { shapes, lessons, levels } from '../data/definitions.js';
import { rng, route, findPair, neighbors, breakShields, solvable, insideBoard } from './rules.js';
import { authoredLevels } from '../data/authored-levels.js';
import { levelState } from './level-format.js';
import { noSleep } from './bedtime.js';
/** Deterministic factories for endless boards, stages, and tutorial lessons. */
/** Picks up to `limit` shielded chips, then upgrades up to `doubles` of them to double shields,
 * keeping every choice solvable. */
export function shieldsFor(board, seed, walls = [], limit = 6, doubles = 0) {
  if (!limit) return Array(64).fill(0);
  let b = board.slice(),
    order = Array(64).fill(Infinity),
    p,
    step = 0;
  while ((p = findPair(b, [], walls))) {
    order[p.a] = order[p.z] = step++;
    b[p.a] = b[p.z] = 0;
  }
  if (b.some(Boolean)) return Array(64).fill(0);
  let candidates = board
    .map((v, i) => i)
    .filter((i) => board[i] && board.some((v, j) => v && neighbors(i, j) && order[j] < order[i]));
  const random = rng(seed + 971);
  for (let i = candidates.length - 1; i > 0; i--) {
    let j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  let s = Array(64).fill(0);
  for (const i of candidates) {
    s[i] = 1;
    if (!solvable(board, s, walls)) s[i] = 0;
    if (s.filter(Boolean).length >= limit) break;
  }
  let upgraded = 0;
  for (const i of candidates) {
    if (upgraded >= doubles) break;
    if (!s[i]) continue;
    s[i] = 2;
    if (solvable(board, s, walls)) upgraded++;
    else s[i] = 1;
  }
  return s;
}
export function maskFor(shape) {
  const mask = Array(64).fill(false);
  shapes[shape].rows.forEach((row, r) =>
    [...row].forEach((v, c) => (mask[(r + 1) * 8 + c + 1] = v === '#')),
  );
  return mask;
}
export function wallsFor(board, seed, shields = [], limit = 4) {
  if (!limit) return Array(64).fill(0);
  const random = rng(seed + 401),
    walls = Array(64).fill(0);
  let candidates = board.map((v, i) => i).filter((i) => !board[i] && insideBoard(i));
  for (let i = candidates.length - 1; i > 0; i--) {
    let j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  candidates.sort(
    (a, b) =>
      Number(a < 8 || a >= 56 || a % 8 === 0 || a % 8 === 7) -
      Number(b < 8 || b >= 56 || b % 8 === 0 || b % 8 === 7),
  );
  for (const i of candidates) {
    walls[i] = 1;
    if (!solvable(board, shields, walls)) walls[i] = 0;
    if (walls.filter(Boolean).length >= limit) break;
  }
  return walls;
}
export function make(seed, shape = 'random') {
  if (!shapes[shape]) shape = Object.keys(shapes)[seed % Object.keys(shapes).length];
  let s = makePlain(seed, shape);
  // A full rectangle needs room for real interior walls, rather than hidden border walls.
  while (s.board.filter(Boolean).length > 28) {
    const p = findPair(s.board);
    s.board[p.a] = s.board[p.z] = 0;
  }
  s.initial = s.board.slice();
  s.walls = wallsFor(s.board, seed);
  while (s.walls.filter(Boolean).length < 4 && s.board.filter(Boolean).length > 8) {
    const p = findPair(s.board);
    s.board[p.a] = s.board[p.z] = 0;
    s.walls = wallsFor(s.board, seed);
  }
  s.initial = s.board.slice();
  s.shields = shieldsFor(s.board, seed, s.walls);
  s.initialShields = s.shields.slice();
  return s;
}
export function makePlain(seed, shape = 'classic') {
  const random = rng(seed),
    mask = maskFor(shape),
    positions = mask.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
  let b;
  const result = () => ({
    routingVersion: 2,
    seed,
    shape,
    board: b,
    initial: b.slice(),
    history: [],
    score: 0,
    claimed: false,
  });
  for (let tries = 0; tries < 120; tries++) {
    let tiles = Array.from({ length: positions.length }, (_, i) => 1 + (Math.floor(i / 2) % 6));
    for (let i = tiles.length - 1; i > 0; i--) {
      let j = Math.floor(random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    b = Array(64).fill(0);
    positions.forEach((p, i) => (b[p] = tiles[i]));
    if (solvable(b)) return result();
  }
  b = Array(64).fill(0);
  for (let r = 1; r <= 6; r++)
    for (let c = 1; c <= 6; c++)
      if (mask[r * 8 + c]) {
        let t = 1 + Math.floor(random() * 6);
        b[r * 8 + c] = b[r * 8 + c + 1] = t;
        c++;
      }
  return result();
}
export function makeTutorial(step = 0, total = 0) {
  const l = lessons[step],
    b = Array(64).fill(0),
    s = Array(64).fill(0),
    w = Array(64).fill(0);
  l.chips.forEach(([i, v]) => (b[i] = v));
  l.shields.forEach((i) => (s[i] = 1));
  l.walls.forEach((i) => (w[i] = 1));
  return {
    routingVersion: 2,
    seed: 7000 + step,
    shape: 'classic',
    stage: 0,
    tutorial: true,
    tutorialStep: step,
    tutorialTotal: total,
    board: b,
    initial: b.slice(),
    shields: s,
    initialShields: s.slice(),
    walls: w,
    history: [],
    score: 0,
    claimed: false,
  };
}
export function makeStage(n) {
  if (authoredLevels[n]) return levelState(authoredLevels[n], n);
  const spec = levels[n - 1],
    seed = 83641 + n * 7919,
    s = makePlain(seed, spec.shape);
  while (s.board.filter(Boolean).length > spec.pairs * 2) {
    const p = findPair(s.board);
    if (!p) throw Error('Stage generation failed');
    s.board[p.a] = s.board[p.z] = 0;
  }
  s.initial = s.board.slice();
  s.walls = wallsFor(s.board, seed, [], spec.walls);
  s.shields = shieldsFor(s.board, seed, s.walls, spec.shields, spec.doubleShields || 0);
  s.initialShields = s.shields.slice();
  if (spec.cover) s.cover = spec.cover;
  if (spec.bedtime) {
    s.bedtime = { dozeScale: spec.dozeScale || 1 };
    s.asleep = noSleep();
  }
  s.stage = n;
  return s;
}
