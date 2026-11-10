import { types } from '../data/definitions.js';
import { maskFor } from '../game/generate.js';
import { parseLevel, levelState } from '../game/level-format.js';
import { route, findPair, breakShields, boardStatus } from '../game/rules.js';

export function newLevel(shape = 'classic') {
  return {
    schemaVersion: 1,
    id: 'my-level',
    name: 'Untitled circuit',
    tip: 'Find a path for every pair.',
    campaignStage: 1,
    board: Array(64).fill(0),
    shields: Array(64).fill(0),
    walls: Array(64).fill(0),
    mask: maskFor(shape),
  };
}
export function fromStage(state, spec, stage) {
  return parseLevel({
    schemaVersion: 1,
    id: 'stage-' + stage,
    name: spec.name,
    tip: spec.tip,
    campaignStage: stage,
    board: state.initial,
    shields: state.initialShields,
    walls: state.walls,
    mask: state.mask || maskFor(state.shape),
  });
}
export function paint(level, index, brush) {
  if (!Number.isInteger(index) || index < 0 || index > 63) throw Error('Choose a board cell.');
  const next = parseLevel(level);
  const inside = index >= 8 && index < 56 && index % 8 > 0 && index % 8 < 7;
  if (brush.type === 'chip') {
    if (!inside) throw Error('Keep chips inside the 6×6 area. Border cells are wire lanes.');
    if (!Number.isInteger(brush.value) || brush.value < 1 || brush.value > 6)
      throw Error('Choose a component.');
    next.mask[index] = true;
    next.walls[index] = 0;
    next.board[index] = brush.value;
  } else if (brush.type === 'shield') {
    if (!next.board[index]) throw Error('Paint a chip before adding its shield.');
    next.shields[index] = next.shields[index] ? 0 : 1;
  } else if (brush.type === 'wall') {
    next.board[index] = 0;
    next.shields[index] = 0;
    next.walls[index] = 1;
  } else if (brush.type === 'erase') {
    next.board[index] = 0;
    next.shields[index] = 0;
    next.walls[index] = 0;
  } else if (brush.type === 'floor' || brush.type === 'lane') {
    if (!inside && brush.type === 'floor') throw Error('The outer border stays a wire lane.');
    next.board[index] = 0;
    next.shields[index] = 0;
    next.walls[index] = 0;
    next.mask[index] = brush.type === 'floor';
  } else throw Error('Unknown brush.');
  return next;
}
export function analyze(level) {
  let value;
  try {
    value = parseLevel(level);
  } catch (e) {
    return { errors: [e.message], counts: [], chips: 0, pairs: 0, shields: 0, walls: 0 };
  }
  const counts = types.map((_, i) => value.board.filter((v) => v === i + 1).length);
  const chips = counts.reduce((a, b) => a + b, 0),
    errors = [];
  if (!chips) errors.push('Add at least one pair of chips.');
  counts.forEach((n, i) => {
    if (n % 2)
      errors.push(types[i].name + ' has ' + n + ' chips. Add or remove one to make pairs.');
  });
  if (chips && !errors.length && boardStatus(value.board, value.shields, value.walls) === 'stuck')
    errors.push('No opening move. Free a chip, remove a wall, or change the layout.');
  return {
    errors,
    counts,
    chips,
    pairs: chips / 2,
    shields: value.shields.filter(Boolean).length,
    walls: value.walls.filter(Boolean).length,
  };
}

/** A found sequence is proof; a budget timeout is never reported as unsolvable. */
export function solveLevel(level, { maxStates = 5000, maxMs = 500 } = {}) {
  const report = analyze(level);
  if (report.errors.length)
    return { status: 'invalid', reason: report.errors.join(' '), moves: [], states: 0 };
  const initial = levelState(level),
    start = performance.now(),
    seen = new Set();
  let states = 0,
    limited = false;
  const greedy = [],
    b = initial.board.slice(),
    s = initial.shields.slice();
  let p;
  while ((p = findPair(b, s, initial.walls))) {
    greedy.push([p.a, p.z]);
    b[p.a] = b[p.z] = 0;
    breakShields(s, p.a, p.z);
  }
  if (b.every((v) => !v)) return { status: 'solved', moves: greedy, states: 1 };
  function visit(board, shields) {
    if (board.every((v) => !v)) return [];
    if (states >= maxStates || performance.now() - start >= maxMs) {
      limited = true;
      return null;
    }
    const key = board.join('') + ':' + shields.join('');
    if (seen.has(key)) return null;
    seen.add(key);
    states++;
    for (let a = 0; a < 64; a++)
      if (board[a] && !shields[a])
        for (let z = a + 1; z < 64; z++)
          if (board[z] === board[a] && !shields[z] && route(board, a, z, shields, initial.walls)) {
            if (states >= maxStates || performance.now() - start >= maxMs) {
              limited = true;
              return null;
            }
            const next = board.slice(),
              layers = shields.slice();
            next[a] = next[z] = 0;
            breakShields(layers, a, z);
            const result = visit(next, layers);
            if (result) return [[a, z], ...result];
            if (limited) return null;
          }
    return null;
  }
  const moves = visit(initial.board, initial.shields);
  return moves
    ? { status: 'solved', moves, states }
    : { status: limited ? 'inconclusive' : 'unsolvable', moves: [], states };
}

export function createDraft(initial) {
  let level = parseLevel(initial),
    undo = [],
    redo = [];
  return {
    get value() {
      return structuredClone(level);
    },
    get canUndo() {
      return undo.length > 0;
    },
    get canRedo() {
      return redo.length > 0;
    },
    replace(next) {
      next = parseLevel(next);
      if (JSON.stringify(next) === JSON.stringify(level)) return false;
      undo.push(level);
      if (undo.length > 200) undo.shift();
      level = next;
      redo = [];
      return true;
    },
    undo() {
      if (!undo.length) return;
      redo.push(level);
      level = undo.pop();
    },
    redo() {
      if (!redo.length) return;
      undo.push(level);
      level = redo.pop();
    },
  };
}
