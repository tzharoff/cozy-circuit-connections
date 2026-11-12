import { types, shapes, lessons, levels } from './data/definitions.js';
import { route, findPair, breakShields, boardStatus } from './game/rules.js';
import { make, makeStage, makeTutorial } from './game/generate.js';
import { clone, valid } from './game/state.js';
import { createStorage } from './platform/storage.js';
import {
  MAX_CHARGES,
  RECHARGE_PRICE,
  clock,
  fullCharges,
  settle,
  spendCharge,
  untilNext,
} from './game/charges.js';
import { componentIcon } from './ui/components.js';
import { batteryIcon, chipCoinIcon } from './ui/currency.js';
import { createSputter } from './ui/sputter.js';
import { createSound } from './ui/sound.js';
import { wireTravelMs } from './ui/timing.js';
import { createEffects } from './ui/effects.js';
import { boardMarkup } from './ui/view.js';
/** Application controller: selection, stage navigation, UI events, and match commits. */

const $ = (id) => document.getElementById(id);
const sound = createSound();
/** Opens a card or sheet with focus on the card itself, so no button inside starts out
 * highlighted (browsers otherwise focus the first button, often the ✕). */
function showCard(card) {
  card.showModal();
  card.focus?.({ preventScroll: true });
}
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
      ? 'Shield broken! Now connect the two blue logic Chip’ums.'
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
  $('winTitle').textContent = 'Tutorial';
  $('winSubtitle').textContent = 'You’re connected!';
  $('winPairs').textContent = state.tutorialTotal + state.score;
  $('winShields').textContent = 1;
  $('winNext').textContent = 'Continue';
  openClearCard();
}
const storage = createStorage();
let { completed, tutorialDone, endlessSave } = storage.loadProgress();
let charges = storage.loadCharges(),
  chipCoins = storage.loadChipCoins(),
  /** Replaces the refill line on the Charges card until it closes (e.g. not enough coins). */
  chargesNote = '';
/** Restarting a campaign level after making matches spends a Charge; the tutorial,
 * Endless, untouched boards, and the one-time layout upgrade are free. */
function restartCosts() {
  return !!(state.stage && !state.tutorial && !state.needsBoundaryRestart && midBoard());
}
/** Adds refilled Charges and redraws the battery wherever it shows. */
function updateCharges() {
  const now = Date.now(),
    settled = settle(charges, now);
  if (settled.count !== charges.count || settled.since !== charges.since) {
    charges = settled;
    storage.saveCharges(charges);
  }
  const wait = untilNext(charges, now),
    status = charges.count >= MAX_CHARGES ? 'Full' : '+1 in ' + clock(wait),
    empty = charges.count < 1;
  $('homeBattery').innerHTML = batteryIcon(charges.count, MAX_CHARGES);
  // The battery shows no number, so screen readers get the count from the label.
  $('homeCharges').ariaLabel = 'Charges: ' + charges.count + ' of ' + MAX_CHARGES;
  $('homeRefill').textContent = charges.count >= MAX_CHARGES ? 'Full' : clock(wait);
  $('homeCoins').textContent = chipCoins;
  $('chargesBattery').innerHTML = batteryIcon(charges.count, MAX_CHARGES);
  $('chargesStatus').textContent = chargesNote || status;
  $('chargesBastion').hidden = !empty;
  $('chargesRecharge').hidden = !empty;
  $('stuckRestartLabel').textContent = empty && restartCosts() ? 'Recharge' : 'Restart';
  $('stuckRestartCost').hidden = empty || !restartCosts();
}
function openCharges() {
  chargesNote = '';
  updateCharges();
  const card = $('chargesDialog');
  land(card);
  if (card.open) return;
  // A soft thump as the card finishes dropping in.
  setTimeout(() => sound.play('land'), 380);
  card.classList?.remove('arrive');
  void card.offsetWidth;
  card.classList?.add('arrive');
  showCard(card);
}
function closeCharges() {
  closeCard($('chargesDialog'));
}
/** Recharge is offered only at zero and always refills the battery to full. */
function recharge() {
  if (charges.count > 0) return;
  if (chipCoins < RECHARGE_PRICE) {
    chargesNote = 'Not enough Chip Coins';
    sound.play('blocked');
    updateCharges();
    return;
  }
  chipCoins -= RECHARGE_PRICE;
  sound.play('coin');
  sound.play('recharge');
  storage.saveChipCoins(chipCoins);
  charges = fullCharges();
  storage.saveCharges(charges);
  updateCharges();
  flyOut($('chargesDialog'));
  // Back on a stuck board, the failed card returns with Restart ready.
  if (screen === 'play' && boardStatus(state.board, state.shields, state.walls) === 'stuck')
    showStuck(true);
}
/** Restarts the board, spending a Charge when it costs one; at zero, opens the Charges card. */
function paidRestart() {
  if (restartCosts()) {
    const spent = spendCharge(charges, Date.now());
    if (!spent) {
      closeStuck();
      openCharges();
      return;
    }
    charges = spent;
    storage.saveCharges(charges);
    sound.play('spend');
  }
  restartBoard();
  updateCharges();
}
let winKey = '';
function unlocked(n) {
  return n === 0 || n === 1 || completed.includes(n - 1);
}
/** Progress only moves forward: the next level is the first stage not yet cleared (0 when all are). */
function nextLevel() {
  for (let n = 1; n <= levels.length; n++) if (!completed.includes(n)) return n;
  return 0;
}
function keepEndless() {
  if (state && !state.stage && !state.tutorial) {
    endlessSave = clone(state);
    storage.saveEndless(endlessSave);
  }
}
/** True when leaving now would throw away matches on an unfinished board. */
function midBoard() {
  return !!(state && state.score && state.board.some(Boolean));
}
let confirmed = null;
/** In-game confirmation card; runs `then` only when the player taps the action button. */
function ask(title, text, action, then) {
  $('confirmTitle').textContent = title;
  $('confirmText').textContent = text;
  $('confirmOk').textContent = action;
  confirmed = then;
  land($('confirmDialog'));
  if (!$('confirmDialog').open) showCard($('confirmDialog'));
}
/** Opens the clear card and replays its drop-in entrance and edge spark. */
function openClearCard() {
  const card = $('stageWin');
  land(card);
  if (card.open) return;
  sound.play('clear');
  card.classList?.remove('arrive');
  void card.offsetWidth;
  card.classList?.add('arrive');
  showCard(card);
}
/** Closes a card at once, unless it is already flying off. */
function closeCard(card) {
  if (card.open && !card.leaving) card.close();
}
function closeWin() {
  closeCard($('stageWin'));
}
/** Stops a card mid-flight so it can be shown again in place. */
function land(card) {
  if (!card.leaving) return;
  card.leaving = false;
  for (const a of card.flight || []) a.cancel();
  card.flight = null;
}
/** Sends a card flying up off the top of the screen, then closes it. Closes at once with
 * reduced motion or where animations aren't available. */
function flyOut(card) {
  if (!card.open || card.leaving) return;
  sound.play('whoosh');
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || !card.animate) {
    card.close();
    return;
  }
  card.leaving = true;
  const timing = { duration: 520, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' };
  // A small dip first, like it's pushing off, then up and away.
  const fly = card.animate(
    [
      { transform: 'none' },
      { transform: 'translateY(12px)', offset: 0.2 },
      { transform: 'translateY(-120vh)' },
    ],
    timing,
  );
  const fade = card.animate([{ opacity: 1 }, { opacity: 0 }], {
    ...timing,
    pseudoElement: '::backdrop',
  });
  card.flight = [fly, fade];
  fly.onfinish = () => {
    card.leaving = false;
    card.flight = null;
    card.close();
    fly.cancel();
    fade.cancel();
  };
}
/** Continue (or ✕) on the clear card: the card flies off while home appears underneath. */
function leaveClearCard() {
  if (busy) return;
  flyOut($('stageWin'));
  showHome();
}
function closeMenu() {
  if ($('menu').open) $('menu').close();
}
function startStage(n) {
  if (!Number.isInteger(n) || n < 0 || n > levels.length || !unlocked(n) || busy) return;
  keepEndless();
  closeWin();
  closeMenu();
  clearWire();
  state = n === 0 ? makeTutorial() : makeStage(n);
  selected = null;
  hints = [];
  winKey = '';
  say(n === 0 ? lessons[0].tip : levels[n - 1].tip);
  showGame();
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
  $('winTitle').textContent = n ? 'Level ' + n : 'Endless';
  $('winSubtitle').textContent = final ? 'Power restored!' : 'Well done!';
  $('winPairs').textContent = state.score;
  $('winShields').textContent = state.initialShields.filter(Boolean).length;
  $('winNext').textContent = 'Continue';
  openClearCard();
}
function enterEndless() {
  if (busy) return;
  closeMenu();
  if (!state?.stage && !state?.tutorial) {
    closeWin();
    return;
  }
  closeWin();
  clearWire();
  state =
    endlessSave && valid(endlessSave) && endlessSave.board.some(Boolean)
      ? clone(endlessSave)
      : make(Math.floor(Math.random() * 2147483647), $('shape').value || 'random');
  state = storage.migrate(state);
  if (!Array.isArray(state.walls)) state.walls = Array(64).fill(0);
  selected = null;
  hints = [];
  winKey = '';
  say('Endless mode. Your campaign progress is saved.');
  showGame();
}
let { state, wins } = storage.loadCurrent();
/** 'home' shows the home screen; 'play' shows the board and lets win/stuck cards open. */
let screen = 'home';
/** What the home Play button does: resume the tutorial, play the next level, or play Endless. */
function homeTarget() {
  const next = nextLevel(),
    endless = !state.stage && !state.tutorial;
  if (state.tutorial && !tutorialDone && state.board.some(Boolean))
    return ['Tutorial', state.tutorialStep + 1 + '/' + lessons.length, showGame];
  if (next)
    return [
      'Level',
      next,
      () => (state.stage === next && state.board.some(Boolean) ? showGame() : startStage(next)),
    ];
  return [
    'Endless',
    '∞',
    () => (!endless ? enterEndless() : state.board.some(Boolean) ? showGame() : fresh()),
  ];
}
function showHome() {
  if (busy) return;
  screen = 'home';
  closeWin();
  closeMenu();
  closeStuck();
  closeCharges();
  clearWire();
  selected = null;
  hints = [];
  const [kind, badge] = homeTarget();
  $('homeKind').textContent = kind;
  $('homeLevel').textContent = badge;
  updateCharges();
  $('game').hidden = true;
  $('home').hidden = false;
}
function showGame() {
  screen = 'play';
  $('home').hidden = true;
  $('game').hidden = false;
  render();
}
state = storage.migrate(state);
let selected = null,
  hints = [],
  busy = false;
function say(s) {
  $('message').textContent = s;
}
let stuckKey = '';
const sputter = createSputter({ head: $('sputterHead'), zap: $('sputterZap') });
function closeStuck() {
  closeCard($('stuckDialog'));
  sputter.stop();
}
/** Undo, Look, and Restart send the failed card flying off. */
function leaveStuck() {
  sputter.stop();
  flyOut($('stuckDialog'));
}
/** The failed card: a broken twin of the clear card that clunks in with a fried Chip’um. */
function showStuck(force = false) {
  if (busy) return;
  const key = JSON.stringify([state.board, state.shields, state.walls]);
  $('stuckUndo').disabled = !state.history.length;
  if (!force && stuckKey === key) return;
  updateCharges();
  stuckKey = key;
  const card = $('stuckDialog');
  land(card);
  if (card.open) return;
  $('stuckTitle').textContent = state.tutorial
    ? 'Tutorial'
    : state.stage
      ? 'Level ' + state.stage
      : 'Endless';
  // The frazzled Chip’um is one of the types still stuck on the board.
  $('stuckChipum').innerHTML = componentIcon((state.board.find(Boolean) || 1) - 1, 'fried');
  card.classList?.remove('clunk');
  void card.offsetWidth;
  card.classList?.add('clunk');
  showCard(card);
  sound.play('shortCircuit');
  sputter.start(800);
}
function save() {
  storage.saveGame({ state, wins, completed, tutorialDone });
}
const { clearWire, draw, popPair } = createEffects({ getElement: $, getState: () => state });
function render() {
  const stuck = !busy && boardStatus(state.board, state.shields, state.walls) === 'stuck';
  if (stuck) {
    selected = null;
    hints = [];
  }
  $('tutorialCoach').hidden = !state.tutorial;
  const stage = state.stage;
  $('levelKind').textContent = state.tutorial ? 'Tutorial' : stage ? 'Level' : 'Endless';
  $('levelBadge').textContent = state.tutorial
    ? state.tutorialStep + 1 + '/' + lessons.length
    : stage || '∞';
  const spec = stage ? levels[stage - 1] : null;
  $('modeLabel').textContent = stage
    ? 'STAGE ' + String(stage).padStart(2, '0') + ' / ' + levels.length
    : 'ENDLESS MODE';
  $('stageTitle').textContent = spec ? spec.name : 'A fresh circuit, every time';
  $('stageTip').textContent = spec
    ? spec.tip
    : 'Choose a shape and play as many boards as you like.';
  $('shapePicker').hidden = !!stage;
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
  $('stuckNotice').hidden = !stuck;
  if (stuck) {
    say('No moves left. Undo a pair or restart this board.');
    if (screen === 'play') showStuck();
  } else {
    stuckKey = '';
    closeStuck();
  }
  if (!left && (!state.tutorial || state.tutorialStep === lessons.length - 1) && screen === 'play')
    showWin();
}
function choose(i) {
  if (busy || !state.board[i]) return;
  if (boardStatus(state.board, state.shields, state.walls) === 'stuck') {
    say('No moves left. Undo a pair or restart this board.');
    showStuck(true);
    return;
  }
  if (state.shields[i]) {
    say('Shielded. Clear a pair right beside it (not diagonal) to free it.');
    return;
  }
  if (selected === null) {
    sound.play('select');
    selected = i;
    hints = [];
    say('Find its matching partner. The wire can bend twice.');
    render();
    return;
  }
  if (selected === i) {
    sound.play('deselect');
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
    sound.play('zap', { ms: wireTravelMs(path.length) });
    draw(path, () => {
      sound.play('pop', { type: state.board[i] - 1 });
      popPair(first, i, () => {
        state.history.push({
          board: state.board.slice(),
          shields: state.shields.slice(),
          score: state.score,
        });
        const freed = breakShields(state.shields, first, i);
        if (freed) sound.play('shield');
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
      });
    });
  } else {
    selected = i;
    hints = [];
    sound.play('blocked');
    say('No route there. Wires can’t cross chips or walls, or bend more than twice.');
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
  closeMenu();
  clearWire();
  state = make(Math.floor(Math.random() * 2147483647), $('shape').value || 'random');
  selected = null;
  hints = [];
  say('Clear pairs beside shielded chips to break their shields.');
  showGame();
}
$('new').onclick = () => {
  if (state.stage || state.tutorial) return;
  if (midBoard()) {
    ask('New board?', 'Your matches on this board will be lost.', 'Deal', fresh);
    return;
  }
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
function relayout() {
  clearWire();
  winKey = '';
  selected = null;
  hints = [];
  state = state.tutorial
    ? makeTutorial(state.tutorialStep, state.tutorialTotal)
    : state.stage
      ? makeStage(state.stage)
      : make(state.seed, state.shape);
  say('Fresh layout. Cables now stay inside the board.');
  render();
}
function restartBoard() {
  if (state.needsBoundaryRestart) {
    relayout();
    return;
  }
  if (state.tutorial) {
    startStage(0);
    return;
  }
  winKey = '';
  state.board = state.initial.slice();
  state.shields = state.initialShields.slice();
  state.history = [];
  state.score = 0;
  selected = null;
  hints = [];
  clearWire();
  say('Same board. A fresh start.');
  render();
}
$('restart').onclick = () => {
  if (busy) return;
  if (state.needsBoundaryRestart)
    ask(
      'New layout',
      'This older board gets a fresh layout under the new rules.',
      'Restart',
      relayout,
    );
  else if (restartCosts() && charges.count < 1) openCharges();
  else if (restartCosts())
    ask('Restart?', 'Start this level over for one Charge.', 'Restart', paidRestart);
  else if (midBoard())
    ask('Restart?', 'Start this board over from the beginning.', 'Restart', restartBoard);
  else restartBoard();
};
$('confirmOk').onclick = () => {
  const then = confirmed;
  confirmed = null;
  flyOut($('confirmDialog'));
  if (then) then();
};
$('confirmCancel').onclick = () => {
  confirmed = null;
  flyOut($('confirmDialog'));
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
$('help').onclick = () => {
  closeMenu();
  showCard($('manual'));
};
$('menuButton').onclick = () => {
  if (!busy && !$('menu').open) showCard($('menu'));
};
$('menuClose').onclick = closeMenu;
$('goalIcon').innerHTML = $('winPairsIcon').innerHTML = componentIcon(2);
$('close').onclick = () => $('manual').close();
$('components').innerHTML = types
  .map(
    (t, i) =>
      `<div style="color:${t.color}">${componentIcon(i)}<b>${t.character}</b><small>the ${t.name}</small></div>`,
  )
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
$('tutorialSkip').onclick = () => startStage(nextLevel() || 1);
// Between levels, Continue returns home; the home Play button starts the next level.
$('winNext').onclick = leaveClearCard;
// Closing the clear card moves on too; there is no going back to a finished board.
$('winClose').onclick = leaveClearCard;
$('homePlay').onclick = () => {
  if (busy) return;
  const target = homeTarget();
  // With an empty battery, a level can't be restarted, so Play opens the Charges card first.
  if (target[0] === 'Level' && settle(charges, Date.now()).count < 1) openCharges();
  else target[2]();
};
$('homeButton').onclick = showHome;
/** Sound on/off, shown on home and in the menu; remembered in this browser. */
function showSoundState() {
  for (const id of ['homeSound', 'menuSound'])
    $(id).setAttribute?.('aria-pressed', String(!sound.muted));
}
$('homeSound').onclick = $('menuSound').onclick = () => {
  sound.setMuted(!sound.muted);
  showSoundState();
  sound.play('tap');
};
showSoundState();
// Ordinary buttons tap; chips, and buttons with their own sounds, are left alone.
document.addEventListener?.('click', (e) => {
  const button = e.target.closest?.('button');
  if (button && !button.matches('[data-chip], .sound-button')) sound.play('tap');
});
$('homeHelp').onclick = () => showCard($('manual'));
$('homeCrew').innerHTML = [0, 4, 2, 1, 5]
  .map((i) => '<span class="crew">' + componentIcon(i) + '</span>')
  .join('');
$('stageWin').oncancel = (e) => e.preventDefault();
$('stuckReview').onclick = leaveStuck;
$('stuckDialog').onclose = sputter.stop;
$('stuckOptions').onclick = () => showStuck(true);
$('stuckUndo').onclick = () => {
  if (!state.history.length || busy) return;
  leaveStuck();
  $('undo').onclick();
};
$('stuckRestart').onclick = () => {
  if (busy) return;
  leaveStuck();
  paidRestart();
};
$('homeCharges').onclick = openCharges;
$('chargesClose').onclick = () => flyOut($('chargesDialog'));
$('chargesRecharge').onclick = recharge;
$('homeCoinIcon').innerHTML = $('rechargeCoin').innerHTML = chipCoinIcon(true);
$('rechargePrice').textContent = RECHARGE_PRICE;
$('chargesBastion').innerHTML = componentIcon(1, 'sleepy') + '<span class="zzz">z</span>';
// Refills happen in real time, so the battery counts down while the game is open.
if (typeof setInterval === 'function') setInterval(updateCharges, 1000);
if (state) {
  if (
    state.stage &&
    (!Number.isInteger(state.stage) || state.stage < 1 || state.stage > levels.length)
  )
    delete state.stage;
} else {
  state = makeTutorial();
  say(lessons[0].tip);
}
// New players go straight into the tutorial; everyone else opens on the home screen.
if (state.tutorial && !tutorialDone) showGame();
else {
  render();
  showHome();
}

// Start the hold after the artwork is decoded and the game has initialized.
const studioSplash = document.getElementById('studioSplash');
// Test fakes have no real elements, so only run with a real image.
const splashArt = studioSplash?.querySelector?.('img');
if (typeof splashArt?.decode === 'function') {
  const artwork = splashArt;
  artwork
    .decode()
    .catch(() => {})
    .then(() => {
      requestAnimationFrame(() => {
        setTimeout(() => studioSplash.remove(), 1500);
      });
    });
}
