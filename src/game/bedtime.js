import { neighbors } from './rules.js';
/** Bedtime levels: pure sleep rules with no DOM, timers, or storage (see docs/GAME_DESIGN.md).
 * `state.asleep` is a 64-cell array: 1 where a Chip’um is asleep. Sleep never changes routes. */

/** True when the level is a Bedtime level. */
export const isBedtime = (state) => !!state?.bedtime;

/** A fresh, all-awake sleep array. */
export const noSleep = () => Array(64).fill(0);

/** Chips that may doze off now: awake, unshielded, and not in `protect` (selected, wired). */
export function dozeCandidates(state, protect = []) {
  const asleep = state.asleep || [];
  const out = [];
  for (let i = 0; i < 64; i++)
    if (state.board[i] && !state.shields[i] && !asleep[i] && !protect.includes(i)) out.push(i);
  return out;
}

/** Lights out: chips remain, and every unshielded one is asleep. */
export function lightsOut(state) {
  const asleep = state.asleep || [];
  let unshielded = 0;
  for (let i = 0; i < 64; i++)
    if (state.board[i] && !state.shields[i]) {
      if (!asleep[i]) return false;
      unshielded++;
    }
  return unshielded > 0;
}

/** A match startles sleepers right beside either matched chip; returns how many woke. */
export function wakeNeighbors(asleep, a, z) {
  let woke = 0;
  for (let i = 0; i < 64; i++)
    if (asleep[i] && (neighbors(i, a) || neighbors(i, z))) {
      asleep[i] = 0;
      woke++;
    }
  return woke;
}
