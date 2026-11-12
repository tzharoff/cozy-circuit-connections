import { make } from '../game/generate.js';
import { route, findPair, breakShields } from '../game/rules.js';
import { createEffects } from '../ui/effects.js';
import { boardMarkup } from '../ui/view.js';
import { createSound } from '../ui/sound.js';
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
  ],
  popSliders: [
    ['popChip', 'Chip vanish'],
    ['popConfetti', 'Confetti'],
    ['popRing', 'Burst ring'],
  ],
};
let state = make(Math.floor(Math.random() * 2147483647), 'classic'),
  selected = null,
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
  $('board').innerHTML = boardMarkup({ state, selected, hints: [], busy });
}
function freshBoard() {
  if (busy) return;
  effects.clearWire();
  state = make(Math.floor(Math.random() * 2147483647), 'classic');
  selected = null;
  render();
}
/** Runs one connection with the real wire and pop effects, then removes the pair. */
function connect(a, z, path) {
  busy = true;
  selected = null;
  render();
  sound.play('zap', { ms: wireTravelMs(path.length) });
  effects.draw(path, () => {
    sound.play('pop', { type: state.board[a] - 1 });
    effects.popPair(a, z, () => {
      breakShields(state.shields, a, z);
      state.board[a] = state.board[z] = 0;
      busy = false;
      render();
      if (!findPair(state.board, state.shields, state.walls)) setTimeout(freshBoard, 400);
      if ($('loop').checked) loopTimer = setTimeout(zap, 700);
    });
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
function syncSliders() {
  for (const key of Object.keys(timingDefaults)) {
    $('t-' + key).value = animTiming[key];
    $('o-' + key).textContent = animTiming[key] + ' ms';
    $('o-' + key).classList.toggle('changed', animTiming[key] !== timingDefaults[key]);
  }
}
for (const [box, rows] of Object.entries(sliders)) $(box).innerHTML = rows.map(sliderRow).join('');
for (const key of Object.keys(timingDefaults))
  $('t-' + key).oninput = (e) => {
    setTiming({ [key]: Number(e.target.value) });
    syncSliders();
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
syncSliders();
render();
