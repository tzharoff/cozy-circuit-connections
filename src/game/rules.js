/** Pure matching, routing, shield, and solvability rules. No DOM or storage. */
// Keep 8x8 save indices stable, but only the inner 6x6 cells are playable/routable.
export function insideBoard(index) {
  return Number.isInteger(index) && index >= 8 && index < 56 && index % 8 >= 1 && index % 8 <= 6;
}
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
  if (
    !insideBoard(a) ||
    !insideBoard(z) ||
    a === z ||
    !b[a] ||
    b[a] !== b[z] ||
    shields[a] ||
    shields[z] ||
    walls[a] ||
    walls[z]
  )
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
      if (r < 1 || r > 6 || c < 1 || c > 6) continue;
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
/** A shield value is its number of layers: 1 is a shield, 2 a double shield. A match removes
 * one layer from each shielded chip directly beside either matched chip (once per match, even
 * if it touches both). Returns how many chips were fully freed. */
export function breakShields(shields, a, z) {
  let freed = 0;
  for (let i = 0; i < 64; i++)
    if (shields[i] && (neighbors(i, a) || neighbors(i, z))) {
      shields[i]--;
      if (!shields[i]) freed++;
    }
  return freed;
}
/** Total shield layers left on the board. */
export function shieldLayers(shields) {
  return shields.reduce((sum, v) => sum + (v || 0), 0);
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
