const vm = require('vm'),
  assert = require('assert');
const source = require('./helpers/source.cjs').gameSource();
const saved = {
  circuitCampaign: JSON.stringify({
    completed: Array.from({ length: 14 }, (_, i) => i + 1),
    tutorialDone: true,
  }),
};
const els = {},
  timers = [],
  ctx = {
    document: {
      getElementById: (id) =>
        els[id] ??
        (els[id] = {
          value: 'random',
          open: false,
          showModal() {
            this.open = true;
          },
          close() {
            this.open = false;
          },
        }),
    },
    localStorage: { getItem: (k) => saved[k] ?? null, setItem: (k, v) => (saved[k] = v) },
    setTimeout: (f, ms) => (timers.push({ f, ms }), timers.length),
    clearTimeout() {},
  };
vm.createContext(ctx);
vm.runInContext(source, ctx);
const run = (s) => vm.runInContext(s, ctx);

// Pure rules: candidates skip shields and protected chips; lights out needs every unshielded
// chip asleep; a match startles sleepers beside it.
run(`var b=Array(64).fill(0),sh=Array(64).fill(0),zz=Array(64).fill(0);b[9]=b[10]=1;b[11]=2;b[12]=2;sh[12]=1;
var t={board:b,shields:sh,asleep:zz};`);
assert.deepEqual(run('JSON.stringify(dozeCandidates(t,[9]))'), '[10,11]');
assert(!run('lightsOut(t)'));
run('t.asleep[9]=t.asleep[10]=t.asleep[11]=1');
assert(run('lightsOut(t)'), 'all unshielded asleep is lights out (shielded chips do not count)');
run('var w=Array(64).fill(0);w[18]=1;w[20]=1');
assert.equal(run('wakeNeighbors(w,10,26)'), 1);
assert.equal(run('w[18]'), 0);
assert.equal(run('w[20]'), 1);

// Level 15 is the first Bedtime level: night board, moon, and a sleep array.
run('startStage(15)');
assert(run('isBedtime(state)'));
assert(!els.levelMoon.hidden);
assert.equal(run('state.asleep.filter(Boolean).length'), 0);

// Tapping a sleeper wakes and selects it, even as the second tap.
run('var p=findPair(state.board,state.shields,state.walls);state.asleep[p.z]=1;render()');
run('choose(p.a)');
assert.equal(run('selected'), run('p.a'));
run('choose(p.z)');
assert.equal(run('selected'), run('p.z'), 'a sleeper tapped second becomes the new selection');
assert.equal(run('state.asleep[p.z]'), 0);
assert.equal(run('state.score'), 0, 'no match was made from a sleeper as the second tap');
run('choose(p.a)');
assert.equal(run('state.score'), 1, 'the woken sleeper then matches normally');

// The doze clock puts an awake Chip’um to sleep after its warning yawn.
run('screen="play";busy=false;selected=null');
const before = run('state.asleep.filter(Boolean).length');
run('doze()');
timers.at(-1).f();
assert.equal(run('state.asleep.filter(Boolean).length'), before + 1);

// Everyone asleep: the failed card's sleepy twin, Lights out, without Undo.
run('for(let i=0;i<64;i++) if(state.board[i]&&!state.shields[i]) state.asleep[i]=1; render()');
assert(els.stuckDialog.open);
assert.equal(els.stuckHeadline.textContent, 'Lights out!');
assert.equal(els.stuckText.textContent, 'Everyone fell asleep.');
assert(els.stuckUndo.hidden);
assert.equal(els.stuckNoticeText.textContent, 'Lights out.');
// Restart wakes everyone (and spends a Charge, since a match was made).
els.stuckRestart.onclick();
assert.equal(run('state.asleep.filter(Boolean).length'), 0);
assert.equal(run('state.score'), 0);
assert.equal(run('charges.count'), 4);

// Non-Bedtime levels never doze and show no moon.
run('startStage(5)');
assert(!run('isBedtime(state)'));
assert(els.levelMoon.hidden);
run('doze()');
assert.equal(run('(state.asleep||[]).filter(Boolean).length'), 0);
console.log(
  'PASS: Bedtime dozing, sleeper first-tap rule, startle on match, lights out card, restart wakes all, normal levels unaffected',
);
