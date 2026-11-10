import { types, shapes, lessons, levels } from './data/definitions.js';
import { route, findPair, breakShields } from './game/rules.js';
import { make, makeStage, makeTutorial } from './game/generate.js';
import { clone, valid } from './game/state.js';
import { createStorage } from './platform/storage.js';
import { componentIcon } from './ui/components.js';
import { createEffects } from './ui/effects.js';
import { boardMarkup, levelMarkup } from './ui/view.js';
/** Application controller: selection, stage navigation, UI events, and match commits. */

const $ = (id) => document.getElementById(id);
function tutorialGuide() {
  const l = lessons[state.tutorialStep],
    empty = state.board.every((v) => !v);
  $('tutorialCoach').hidden = false;
  $('lessonNumber').textContent =
    'LEVEL 0 · LESSON ' + (state.tutorialStep + 1) + ' / ' + lessons.length;
  $('lessonTitle').textContent = empty ? 'Connection made!' : l.name;
  $('lessonText').textContent = empty
    ? 'Nicely done. Ready for the next little lesson?'
    : state.tutorialStep === 2 && !state.shields.some(Boolean)
      ? 'Shield broken! Now connect the two blue logic friends.'
      : l.tip;
  $('lessonNext').hidden = !empty || state.tutorialStep === lessons.length - 1;
  $('lessonNext').disabled = busy;
  $('tutorialSkip').disabled = busy;
  if (!busy && !empty) {
    const p = findPair(state.board, state.shields, state.walls);
    if (p) hints = [p.a, p.z];
  }
  $('modeLabel').textContent = 'LEVEL 0 · GUIDED TUTORIAL';
  $('stageTitle').textContent = 'A friendly first circuit';
  $('stageTip').textContent = 'Four tiny lessons. No pressure. Follow the glowing chips.';
  $('shapePicker').hidden = true;
  $('new').textContent = 'Levels ↗';
  $('endlessButton').hidden = false;
  $('undo').disabled = busy || !state.history.length;
}
function nextLesson() {
  if (
    busy ||
    !state.tutorial ||
    state.board.some(Boolean) ||
    state.tutorialStep >= lessons.length - 1
  )
    return;
  clearWire();
  state = makeTutorial(state.tutorialStep + 1, state.tutorialTotal + state.score);
  selected = null;
  hints = [];
  say(lessons[state.tutorialStep].tip);
  render();
}
function tutorialWin() {
  const key = 'tutorial:' + state.seed;
  if (winKey === key) return;
  winKey = key;
  $('winEyebrow').textContent = 'LEVEL 0 · TUTORIAL COMPLETE';
  $('winTitle').textContent = 'You’re connected!';
  $('winSubtitle').textContent = 'You know the circuit basics.';
  $('winPairs').textContent = state.tutorialTotal + state.score;
  $('winShields').textContent = 1;
  $('winNote').textContent =
    'Match friends, bend wires, free shields, and route around walls. Stage 1 is ready when you are.';
  $('winNext').textContent = 'Start Stage 1 ↗';
  $('winReplay').textContent = 'Replay tutorial';
  $('winLevels').textContent = 'Level select';
  if (!$('stageWin').open) $('stageWin').showModal();
}
const storage = createStorage();
let { completed, tutorialDone, endlessSave } = storage.loadProgress();
let winKey = '';
function unlocked(n) {
  return n === 0 || n === 1 || completed.includes(n - 1);
}
function keepEndless() {
  if (state && !state.stage && !state.tutorial) {
    endlessSave = clone(state);
    storage.saveEndless(endlessSave);
  }
}
function leaving() {
  return (
    busy ||
    (state &&
      state.score &&
      state.board.some(Boolean) &&
      !confirm('Leave this board? You can replay this stage from the beginning.'))
  );
}
function closeWin() {
  if ($('stageWin').open) $('stageWin').close();
}
function startStage(n, skipConfirm = false) {
  if (!Number.isInteger(n) || n < 0 || n > levels.length || !unlocked(n) || busy) return;
  if (!skipConfirm && leaving()) return;
  keepEndless();
  closeWin();
  if ($('levelPicker').open) $('levelPicker').close();
  clearWire();
  state = n === 0 ? makeTutorial() : makeStage(n);
  selected = null;
  hints = [];
  winKey = '';
  say(n === 0 ? lessons[0].tip : levels[n - 1].tip);
  render();
}
function openLevels() {
  if (busy) return;
  closeWin();
  $('levelGrid').innerHTML = levelMarkup({ state, completed, tutorialDone, isUnlocked: unlocked });
  $('campaignCount').textContent = completed.length + ' / ' + levels.length + ' stages cleared';
  if (!$('levelPicker').open) $('levelPicker').showModal();
}
function showWin() {
  if (state.tutorial) {
    tutorialWin();
    return;
  }
  const key = (state.stage || 'endless') + ':' + state.seed;
  if (winKey === key) return;
  winKey = key;
  const n = state.stage,
    final = n === levels.length;
  $('winEyebrow').textContent = n
    ? 'STAGE ' + String(n).padStart(2, '0') + ' / ' + levels.length
    : 'ENDLESS MODE';
  $('winTitle').textContent = final ? 'Power restored!' : n ? 'Stage clear!' : 'Board clear!';
  $('winSubtitle').textContent = n ? levels[n - 1].name : 'Another clean circuit.';
  $('winPairs').textContent = state.score;
  $('winShields').textContent = state.initialShields.filter(Boolean).length;
  $('winNote').textContent = final
    ? 'All 12 stages cleared. Replay a favorite or keep going in Endless.'
    : n
      ? 'Stage ' + (n + 1) + ' is unlocked. Ready for the next circuit?'
      : 'Fresh boards are always waiting.';
  $('winNext').textContent = final ? 'Play Endless ↗' : n ? 'Next stage ↗' : 'New board ↗';
  $('winReplay').textContent = n ? 'Replay stage' : 'Replay board';
  $('winLevels').textContent = 'Level select';
  if (!$('stageWin').open) $('stageWin').showModal();
}
function enterEndless(skipConfirm = false) {
  if (busy || (!skipConfirm && leaving())) return;
  if (!state?.stage && !state?.tutorial) {
    closeWin();
    return;
  }
  closeWin();
  if ($('levelPicker').open) $('levelPicker').close();
  clearWire();
  state =
    endlessSave && valid(endlessSave)
      ? clone(endlessSave)
      : make(Math.floor(Math.random() * 2147483647), $('shape').value || 'random');
  if (!Array.isArray(state.walls)) state.walls = Array(64).fill(0);
  selected = null;
  hints = [];
  winKey = '';
  say('Endless mode. Your campaign progress is saved.');
  render();
}
let { state, wins } = storage.loadCurrent();
state = storage.migrate(state);
let selected = null,
  hints = [],
  busy = false;
function say(s) {
  $('message').textContent = s;
}
function save() {
  storage.saveGame({ state, wins, completed, tutorialDone });
}
const { clearWire, draw, popPair } = createEffects({ getElement: $, getState: () => state });
function render() {
  $('tutorialCoach').hidden = !state.tutorial;
  const stage = state.stage;
  const spec = stage ? levels[stage - 1] : null;
  $('modeLabel').textContent = stage
    ? 'STAGE ' + String(stage).padStart(2, '0') + ' / ' + levels.length
    : 'ENDLESS MODE';
  $('stageTitle').textContent = spec ? spec.name : 'A fresh circuit, every time';
  $('stageTip').textContent = spec
    ? spec.tip
    : 'Choose a shape and play as many boards as you like.';
  $('shapePicker').hidden = !!stage;
  $('new').textContent = stage ? 'Levels ↗' : 'New board ↗';
  $('campaignButton').disabled = busy;
  $('endlessButton').disabled = busy;
  $('endlessButton').hidden = !stage;
  const left = state.board.filter(Boolean).length / 2;
  $('shapeName').textContent = shapes[state.shape].name;
  $('shapeNote').textContent = shapes[state.shape].note;
  $('shieldCount').textContent = state.shields.filter(Boolean).length + ' shields remaining';
  $('left').textContent = left;
  $('score').textContent = state.score;
  $('undo').disabled = busy || !state.history.length;
  for (const id of ['new', 'restart', 'hint']) $(id).disabled = busy;
  $('deal').textContent = 'BOARD ' + String(state.seed).slice(-5);
  if (state.tutorial) tutorialGuide();
  $('board').innerHTML = boardMarkup({ state, selected, hints, busy });
  if (!left && (!state.tutorial || state.tutorialStep === lessons.length - 1)) {
    if (state.tutorial) tutorialDone = true;
    if (!state.claimed) {
      state.claimed = true;
      wins++;
    }
    if (state.stage && !completed.includes(state.stage)) completed.push(state.stage);
    say(
      state.stage
        ? 'Stage clear! Next circuit unlocked.'
        : 'All circuits clear. Nice work. Ready for another board?',
    );
  } else if (left > 0 && !findPair(state.board, state.shields, state.walls))
    say('No connections remain. Undo a pair or restart this board.');
  $('wins').textContent = wins;
  save();
  if (!left && (!state.tutorial || state.tutorialStep === lessons.length - 1)) showWin();
}
function choose(i) {
  if (busy || !state.board[i]) return;
  if (state.shields[i]) {
    say('Shield locked. Clear a pair directly above, below, left, or right to free this chip.');
    return;
  }
  if (selected === null) {
    selected = i;
    hints = [];
    say('Find its matching partner. The wire can bend twice.');
    render();
    return;
  }
  if (selected === i) {
    selected = null;
    say('Selection cleared. Choose any chip.');
    render();
    return;
  }
  const path = route(state.board, selected, i, state.shields, state.walls);
  if (path) {
    const first = selected;
    busy = true;
    hints = [first, i];
    say('Power flowing…');
    render();
    draw(path, () =>
      popPair(first, i, () => {
        state.history.push({
          board: state.board.slice(),
          shields: state.shields.slice(),
          score: state.score,
        });
        const freed = breakShields(state.shields, first, i);
        state.board[first] = state.board[i] = 0;
        state.score++;
        selected = null;
        hints = [];
        busy = false;
        say(
          freed
            ? 'Connection made. ' + freed + ' shield' + (freed === 1 ? '' : 's') + ' broken!'
            : 'Connection made. One less pair in the machine.',
        );
        render();
      }),
    );
  } else {
    selected = i;
    hints = [];
    say(
      'No clear route: wires cannot cross walls or chips, or bend more than twice. This chip is now selected.',
    );
    render();
  }
}
$('board').onclick = (e) => {
  const c = e.target.closest('[data-chip]');
  if (c) choose(Number(c.dataset.chip));
};
function fresh() {
  keepEndless();
  winKey = '';
  closeWin();
  clearWire();
  state = make(Math.floor(Math.random() * 2147483647), $('shape').value || 'random');
  selected = null;
  hints = [];
  say('Clear pairs beside shielded chips to break their shields.');
  render();
}
$('new').onclick = () => {
  if (state.stage || state.tutorial) {
    openLevels();
    return;
  }
  if (state.score && state.board.some(Boolean) && !confirm('Leave this board and start a new one?'))
    return;
  fresh();
};
$('undo').onclick = () => {
  const old = state.history.pop();
  if (!old) return;
  state.board = old.board;
  state.shields = old.shields.slice();
  state.score = old.score;
  selected = null;
  hints = [];
  clearWire();
  say('Last pair restored. Try another connection.');
  render();
};
$('restart').onclick = () => {
  if (state.tutorial) {
    startStage(0);
    return;
  }
  winKey = '';
  if (state.score && !confirm('Restore this board to its starting layout?')) return;
  state.board = state.initial.slice();
  state.shields = state.initialShields.slice();
  state.history = [];
  state.score = 0;
  selected = null;
  hints = [];
  clearWire();
  say('Same board. A fresh start.');
  render();
};
$('hint').onclick = () => {
  const p = findPair(state.board, state.shields, state.walls);
  selected = null;
  if (p) {
    hints = [p.a, p.z];
    say('These two chips connect. Click one, then the other.');
    render();
    draw(p.path);
  } else {
    hints = [];
    render();
  }
};
$('help').onclick = () => $('manual').showModal();
$('close').onclick = () => $('manual').close();
$('components').innerHTML = types
  .map((t, i) => `<div style="color:${t.color}">${componentIcon(i)}<small>${t.name}</small></div>`)
  .join('');
$('shape').innerHTML =
  '<option value="random">Surprise me</option>' +
  Object.entries(shapes)
    .map(([key, s]) => '<option value="' + key + '">' + s.name + '</option>')
    .join('');
let preferred = storage.loadShapeChoice();
$('shape').value = shapes[preferred] ? preferred : 'random';
$('shape').onchange = () => {
  storage.saveShapeChoice($('shape').value);
  $('shapePreview').textContent =
    $('shape').value === 'random'
      ? 'New boards rotate through all six shapes.'
      : 'Next board: ' + shapes[$('shape').value].name + '.';
};
$('lessonNext').onclick = nextLesson;
$('tutorialSkip').onclick = () => startStage(1);
$('campaignButton').onclick = openLevels;
$('endlessButton').onclick = () => enterEndless();
$('levelClose').onclick = () => $('levelPicker').close();
$('levelGrid').onclick = (e) => {
  const b = e.target.closest('[data-level]');
  if (b && !b.disabled) startStage(Number(b.dataset.level));
};
$('winNext').onclick = () => {
  if (state.tutorial) {
    startStage(1, true);
    return;
  }
  if (state.stage && state.stage < levels.length) startStage(state.stage + 1, true);
  else if (state.stage) enterEndless(true);
  else fresh();
};
$('winReplay').onclick = () => {
  if (state.tutorial) {
    startStage(0, true);
    return;
  }
  if (state.stage) startStage(state.stage, true);
  else {
    closeWin();
    winKey = '';
    clearWire();
    state.board = state.initial.slice();
    state.shields = state.initialShields.slice();
    state.history = [];
    state.score = 0;
    state.claimed = false;
    selected = null;
    hints = [];
    render();
  }
};
$('winLevels').onclick = openLevels;
$('winClose').onclick = closeWin;
if (state) {
  if (
    state.stage &&
    (!Number.isInteger(state.stage) || state.stage < 1 || state.stage > levels.length)
  )
    delete state.stage;
  render();
} else {
  state = makeTutorial();
  say(lessons[0].tip);
  render();
}
