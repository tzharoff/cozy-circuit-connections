/** Animation timings for the zap line (wire), the chip pop, and the selection sparks, in
 * milliseconds (plus the selection style).
 * The play room (playroom.html) adjusts these and saves them in this browser under
 * `circuitTuning`; the game uses the saved values too, so they can be felt in real play.
 * To ship new values, change `timingDefaults` below. */
export const timingDefaults = {
  /** Zap line travel time for the shortest wire. */
  wireBase: 330,
  /** Extra travel time for each cell the wire passes. */
  wirePerCell: 30,
  /** Longest a wire may take to travel, however long it is. */
  wireMax: 750,
  /** Ring that spreads where the spark arrives. */
  wireRing: 280,
  /** How long the finished wire stays before fading. */
  wireLinger: 190,
  /** Wire fade-out. */
  wireFade: 280,
  /** Pause after the wire lands, with both chips lit, before they pop. */
  wireHold: 120,
  /** Chip shrink-and-vanish; the pair is removed when this ends. */
  popChip: 180,
  /** Confetti bits flying out. */
  popConfetti: 480,
  /** Ring that bursts around each popping chip. */
  popRing: 370,
  /** Average time between idle moments (a Chip’um blinking, yawning, bouncing, or wiggling). */
  idleGap: 1600,
  /** Bedtime levels: average time between Chip’ums dozing off (each level scales it). */
  dozeMs: 4500,
  /** One lap of the sparks racing around a selected chip. */
  zapLap: 1250,
  /** Selection ring: 1 = bold (deeper green, thicker), 0 = subtle (paler, thinner). */
  zapBold: 1,
};

/** How long the zap line takes to travel a path of `cells` cells. */
export function wireTravelMs(cells) {
  return Math.min(animTiming.wireMax, animTiming.wireBase + (cells - 1) * animTiming.wirePerCell);
}

/** Slider ranges for the play room: [min, max, step]. */
export const timingRanges = {
  wireBase: [50, 1500, 10],
  wirePerCell: [0, 120, 2],
  wireMax: [100, 3000, 10],
  wireRing: [0, 1000, 10],
  wireLinger: [0, 1500, 10],
  wireFade: [0, 1500, 10],
  wireHold: [0, 800, 10],
  popChip: [50, 1000, 10],
  popConfetti: [100, 2000, 10],
  popRing: [100, 2000, 10],
  idleGap: [300, 6000, 100],
  dozeMs: [1000, 15000, 250],
  zapLap: [200, 3000, 50],
  zapBold: [0, 1, 1],
};

const TUNING_KEY = 'circuitTuning';
/** Native saves on iOS and Android (boot.js); localStorage in the browser and play room. */
const tuningStore = () => globalThis.circuitStore || globalThis.localStorage;

/** Keeps only known keys with numbers inside their slider range. */
export function cleanTiming(raw) {
  const out = { ...timingDefaults };
  if (!raw || typeof raw !== 'object') return out;
  for (const key of Object.keys(timingDefaults)) {
    const [min, max] = timingRanges[key],
      value = Number(raw[key]);
    if (Number.isFinite(value)) out[key] = Math.min(max, Math.max(min, Math.round(value)));
  }
  return out;
}

function readTuning() {
  try {
    return cleanTiming(JSON.parse(tuningStore().getItem(TUNING_KEY)));
  } catch {
    return { ...timingDefaults };
  }
}

/** The live values every effect reads. */
export const animTiming = readTuning();

/** Pushes the pop durations into CSS, where the pop keyframes read them. */
export function applyTimingCss(root = globalThis.document?.documentElement) {
  const style = root?.style;
  if (!style?.setProperty) return;
  style.setProperty('--pop-chip-ms', animTiming.popChip + 'ms');
  style.setProperty('--pop-confetti-ms', animTiming.popConfetti + 'ms');
  style.setProperty('--pop-ring-ms', animTiming.popRing + 'ms');
  style.setProperty('--zap-lap-ms', animTiming.zapLap + 'ms');
  if (root.dataset) root.dataset.zap = animTiming.zapBold ? 'bold' : 'subtle';
}

/** Changes timings live and saves them (play room only). */
export function setTiming(values) {
  Object.assign(animTiming, cleanTiming({ ...animTiming, ...values }));
  try {
    tuningStore().setItem(TUNING_KEY, JSON.stringify(animTiming));
  } catch {}
  applyTimingCss();
}

/** Back to the shipped defaults, forgetting saved tuning. */
export function resetTiming() {
  Object.assign(animTiming, timingDefaults);
  try {
    tuningStore().removeItem(TUNING_KEY);
  } catch {}
  applyTimingCss();
}

applyTimingCss();
