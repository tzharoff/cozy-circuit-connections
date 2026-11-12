import { animTiming } from './timing.js';
/** Idle life for the Chip’ums: every so often one random visible Chip’um blinks, yawns, bounces,
 * or wiggles. Each action is a CSS class on the chip (or crew member) for a moment; the
 * artwork's tagged parts (eyes, mouth, yawn, idle group) do the moving. */

/** Actions and how often each is picked relative to the others. */
const IDLE_ACTIONS = [
  ['blink', 4],
  ['wiggle', 3],
  ['bounce', 2],
  ['yawn', 2],
];
/** How long each action's class stays on (matches the CSS animations). */
export const IDLE_MS = { blink: 260, wiggle: 700, bounce: 650, yawn: 1600 };

function pickIdleAction() {
  const total = IDLE_ACTIONS.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [name, weight] of IDLE_ACTIONS) if ((roll -= weight) < 0) return name;
  return 'blink';
}

/** Plays one idle action on one element; returns false if it was already busy. */
export function playIdle(el, action) {
  const cls = 'idle-' + action;
  if (!el?.classList || [...el.classList].some((c) => c.startsWith('idle-'))) return false;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), IDLE_MS[action]);
  return true;
}

/** `getTargets` returns the elements that may act right now (only visible, calm ones). */
export function createIdle(getTargets) {
  let timer = null;
  function schedule() {
    // Gaps vary around the tuned average so the board never feels mechanical.
    timer = setTimeout(act, animTiming.idleGap * (0.5 + Math.random()));
  }
  function act() {
    schedule();
    if (globalThis.document?.hidden) return;
    const targets = getTargets();
    if (!targets.length) return;
    const el = targets[Math.floor(Math.random() * targets.length)];
    // With reduced motion, Chip’ums only blink.
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    playIdle(el, reduced ? 'blink' : pickIdleAction());
  }
  return {
    start() {
      if (timer === null) schedule();
    },
    stop() {
      clearTimeout(timer);
      timer = null;
    },
  };
}
