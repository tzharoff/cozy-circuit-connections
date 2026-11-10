/** Pure matching, routing, shield, and solvability rules. No DOM or storage. */
export function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function route(b, a, z, shields = [], walls = []) {
  if (a === z || !b[a] || b[a] !== b[z] || shields[a] || shields[z] || walls[a] || walls[z])
    return null;
  const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ],
    queue = [],
    seen = new Map();
  for (let d = 0; d < 4; d++) queue.push({ p: a, d, t: 0, path: [a] });
  for (let q = 0; q < queue.length; q++) {
    const s = queue[q];
    for (let d = 0; d < 4; d++) {
      let turns = s.t + (d !== s.d ? 1 : 0);
      if (turns > 2) continue;
      let r = ((s.p / 8) | 0) + dirs[d][0],
        c = (s.p % 8) + dirs[d][1];
      if (r < 0 || r > 7 || c < 0 || c > 7) continue;
      let p = r * 8 + c;
      if (p === a || walls[p] || (b[p] && p !== z)) continue;
      let path = [...s.path, p];
      if (p === z) return path;
      let key = p * 4 + d;
      if (seen.has(key) && seen.get(key) <= turns) continue;
      seen.set(key, turns);
      queue.push({ p, d, t: turns, path });
    }
  }
  return null;
}
export function findPair(b, shields = [], walls = []) {
  for (let a = 0; a < 64; a++)
    if (b[a])
      for (let z = a + 1; z < 64; z++)
        if (b[a] === b[z]) {
          let path = route(b, a, z, shields, walls);
          if (path) return { a, z, path };
        }
  return null;
}
export function neighbors(a, z) {
  return Math.abs(((a / 8) | 0) - ((z / 8) | 0)) + Math.abs((a % 8) - (z % 8)) === 1;
}
/** A dead end means chips remain but no unshielded, routable pair exists. */
export function boardStatus(board, shields = [], walls = []) {
  if (!board.some(Boolean)) return 'cleared';
  return findPair(board, shields, walls) ? 'playing' : 'stuck';
}
export function breakShields(shields, a, z) {
  let freed = 0;
  for (let i = 0; i < 64; i++)
    if (shields[i] && (neighbors(i, a) || neighbors(i, z))) {
      shields[i] = 0;
      freed++;
    }
  return freed;
}
export function solvable(board, shields = [], walls = []) {
  let b = board.slice(),
    s = shields.slice(),
    p;
  while ((p = findPair(b, s, walls))) {
    b[p.a] = b[p.z] = 0;
    breakShields(s, p.a, p.z);
  }
  return b.every((v) => !v);
}
