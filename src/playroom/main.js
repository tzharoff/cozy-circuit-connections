import { make, shieldsFor } from '../game/generate.js';
import { route, findPair, breakShields, shieldLayers } from '../game/rules.js';
import { createEffects } from '../ui/effects.js';
import { boardMarkup } from '../ui/view.js';
import { createSound } from '../ui/sound.js';
import { createIdle, playIdle, IDLE_MS } from '../ui/idle.js';
import { noSleep, dozeCandidates, lightsOut, wakeNeighbors } from '../game/bedtime.js';
import {
  animTiming,
  timingDefaults,
  timingRanges,
  setTiming,
  resetTiming,
  wireTravelMs,
} from '../ui/timing.js';
/** Play room: a test board for tuning the zap line and pop speeds by feel. */

const $ = (id) => document.getElementById(id);
const sliders = {
  wireSliders: [
    ['wireBase', 'Travel time'],
    ['wirePerCell', 'Extra per cell'],
    ['wireMax', 'Longest travel'],
    ['wireRing', 'Arrival ring'],
    ['wireLinger', 'Stay before fade'],
    ['wireFade', 'Fade out'],
    ['wireHold', 'Hold before pop'],
  ],
  popSliders: [
    ['popChip', 'Chip vanish'],
    ['popConfetti', 'Confetti'],
    ['popRing', 'Burst ring'],
  ],
  zapSliders: [['zapLap', 'Spark lap']],
  idleSliders: [['idleGap', 'Time between']],
  bedSliders: [['dozeMs', 'Doze every']],
};
/** A random board with up to six shields, three of them double, to try both kinds. */
function testBoard() {
  const seed = Math.floor(Math.random() * 2147483647),
    s = make(seed, 'classic');
  s.shields = shieldsFor(s.board, seed, s.walls, 6, 3);
  s.initialShields = s.shields.slice();
  s.asleep = noSleep();
  return s;
}
let state = testBoard(),
  selected = null,
  lit = [],
  busy = false,
  loopTimer = null;
const effects = createEffects({ getElement: $, getState: () => state });
const sound = createSound();
/** Plain names for the sound board buttons. */
const soundLabels = {
  select: 'Select',
  deselect: 'Deselect',
  blocked: 'No route',
  zap: 'Zap line',
  pop: 'Pop',
  shield: 'Shield break',
  crack: 'Shield crack',
  doze: 'Doze off',
  wake: 'Wake up',
  lightsOut: 'Lights out',
  clear: 'Level clear',
  shortCircuit: 'Short circuit',
  land: 'Card land',
  whoosh: 'Card fly-out',
  tap: 'Button',
  spend: 'Spend Charge',
  recharge: 'Recharge',
  coin: 'Chip Coin',
  hint: 'Hint',
};
let popType = 0;

function render() {
  $('board').innerHTML = boardMarkup({ state, selected, hints: [], busy, lit });
}
function freshBoard() {
  if (busy) return;
  effects.clearWire();
  state = testBoard();
  selected = null;
  render();
}
/** Runs one connection with the real wire and pop effects, then removes the pair. */
/** Same sequence as the game: the first chip stays lit while the wire leaps across, the
 * second lights up when it lands, both hold for a beat, then pop. */
function connect(a, z, path) {
  busy = true;
  selected = null;
  lit = [a];
  render();
  sound.play('zap', { ms: wireTravelMs(path.length) });
  effects.draw(path, () => {
    lit = [a, z];
    render();
    setTimeout(() => {
      sound.play('pop', { type: state.board[a] - 1 });
      effects.popPair(a, z, () => {
        const before = shieldLayers(state.shields),
          freed = breakShields(state.shields, a, z);
        if (freed) sound.play('shield');
        else if (before > shieldLayers(state.shields)) sound.play('crack');
        state.board[a] = state.board[z] = 0;
        state.asleep[a] = state.asleep[z] = 0;
        if (wakeNeighbors(state.asleep, a, z)) sound.play('wake');
        lit = [];
        busy = false;
        render();
        if (!findPair(state.board, state.shields, state.walls)) setTimeout(freshBoard, 400);
        if ($('loop').checked) loopTimer = setTimeout(zap, 700);
      });
    }, animTiming.wireHold);
  });
}
function zap() {
  clearTimeout(loopTimer);
  if (busy) return;
  const p = findPair(state.board, state.shields, state.walls);
  if (!p) {
    freshBoard();
    if ($('loop').checked) loopTimer = setTimeout(zap, 500);
    return;
  }
  connect(p.a, p.z, p.path);
}
$('board').onclick = (e) => {
  const chip = e.target.closest('[data-chip]');
  if (!chip || busy) return;
  const i = Number(chip.dataset.chip);
  if (state.shields[i]) return;
  // Bedtime rule: a sleeper can only be the first tap; tapping it wakes and selects it.
  if (state.asleep[i]) {
    state.asleep[i] = 0;
    sound.play('wake');
    selected = i;
    render();
    playIdle(document.querySelector('[data-chip="' + i + '"]'), 'bounce');
    return;
  }
  if (selected === null || selected === i) {
    sound.play(selected === i ? 'deselect' : 'select');
    selected = selected === i ? null : i;
    render();
    return;
  }
  const path = route(state.board, selected, i, state.shields, state.walls);
  if (path) connect(selected, i, path);
  else {
    selected = i;
    render();
  }
};

/** One labeled slider with a live millisecond readout. */
function sliderRow([key, label]) {
  const [min, max, step] = timingRanges[key];
  return `<label class="room-slider"><span>${label}</span><input type="range" id="t-${key}" min="${min}" max="${max}" step="${step}" value="${animTiming[key]}" /><output id="o-${key}">${animTiming[key]} ms</output></label>`;
}
/** Every setting that has a slider (the selection style is a toggle instead). */
const sliderKeys = () => Object.values(sliders).flatMap((rows) => rows.map(([key]) => key));
function syncSliders() {
  $('zapBold').setAttribute('aria-pressed', String(!!animTiming.zapBold));
  $('zapSubtle').setAttribute('aria-pressed', String(!animTiming.zapBold));
  for (const key of sliderKeys()) {
    $('t-' + key).value = animTiming[key];
    $('o-' + key).textContent = animTiming[key] + ' ms';
    $('o-' + key).classList.toggle('changed', animTiming[key] !== timingDefaults[key]);
  }
}
for (const [box, rows] of Object.entries(sliders)) $(box).innerHTML = rows.map(sliderRow).join('');
/** Selection settings show on a selected chip, so pick one if nothing is selected. */
function showSelection() {
  if (selected !== null || busy) return;
  const chip = $('board').querySelector('.chip:not(.shielded)');
  if (chip) {
    selected = Number(chip.dataset.chip);
    render();
  }
}
for (const key of sliderKeys())
  $('t-' + key).oninput = (e) => {
    setTiming({ [key]: Number(e.target.value) });
    syncSliders();
    if (key.startsWith('zap')) showSelection();
  };
for (const [id, bold] of [
  ['zapBold', 1],
  ['zapSubtle', 0],
])
  $(id).onclick = () => {
    setTiming({ zapBold: bold });
    syncSliders();
    showSelection();
  };
$('zap').onclick = zap;
$('loop').onchange = () => {
  if ($('loop').checked) zap();
  else clearTimeout(loopTimer);
};
$('newBoard').onclick = freshBoard;
$('resetValues').onclick = () => {
  resetTiming();
  syncSliders();
  $('roomStatus').textContent = 'Back to the shipped speeds.';
};
$('copyValues').onclick = async () => {
  const text = JSON.stringify(animTiming, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    $('roomStatus').textContent = 'Copied. Paste them to Claude to make them the defaults.';
  } catch {
    $('roomStatus').textContent = text;
  }
};
$('soundBoard').innerHTML = sound.names
  .map((name) => `<button data-sound="${name}">${soundLabels[name] || name}</button>`)
  .join('');
$('soundBoard').onclick = (e) => {
  const name = e.target.closest('[data-sound]')?.dataset.sound;
  // Pops cycle through the six Chip’um notes; the zap lasts as long as a 4-cell wire.
  if (name === 'pop') sound.play('pop', { type: popType++ % 6 });
  else if (name) sound.play(name, { ms: wireTravelMs(4) });
};
createIdle(() => [
  ...document.querySelectorAll('#board .chip:not(.selected):not(.popping):not(.shielded)'),
]).start();
// Idle buttons make every calm Chip’um do that action at once, to judge it quickly.
$('idleBoard').onclick = (e) => {
  const action = e.target.closest('[data-idle]')?.dataset.idle;
  if (action)
    for (const chip of document.querySelectorAll('#board .chip:not(.selected):not(.popping)'))
      playIdle(chip, action);
};
/** Bedtime board: with the box ticked, Chip’ums doze off at the Doze every pace. */
function playroomDoze() {
  setTimeout(playroomDoze, animTiming.dozeMs * (0.75 + Math.random() * 0.5));
  if (!$('bedtime').checked || busy || lightsOut(state)) return;
  const pool = dozeCandidates(
    state,
    [selected, ...lit].filter((v) => v !== null),
  );
  if (!pool.length) return;
  const i = pool[Math.floor(Math.random() * pool.length)];
  playIdle(document.querySelector('[data-chip="' + i + '"]'), 'yawn');
  setTimeout(() => {
    if (busy || !state.board[i] || selected === i || lit.includes(i)) return;
    state.asleep[i] = 1;
    sound.play('doze');
    render();
    if (lightsOut(state)) {
      sound.play('lightsOut');
      $('roomStatus').textContent = 'Lights out! Everyone fell asleep. Press New board.';
    }
  }, IDLE_MS.yawn * 0.8);
}
playroomDoze();
$('bedtime').onchange = () => {
  $('playroomBoard').classList.toggle('bedtime', $('bedtime').checked);
  if (!$('bedtime').checked) {
    state.asleep = noSleep();
    render();
  }
};
syncSliders();
render();
