const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert');
const source = require('./helpers/source.cjs').gameSource();
function boot(saved = {}) {
  const els = {},
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
      setTimeout: () => 1,
      clearTimeout() {},
      confirm: () => true,
    };
  vm.createContext(ctx);
  vm.runInContext(source, ctx);
  return { ctx, els, saved, run: (s) => vm.runInContext(s, ctx) };
}
const t = boot(),
  { run, els, saved } = t;
run('startStage(1)');
assert.equal(run('state.stage'), 1);
assert.equal(run('state.board.filter(Boolean).length/2'), 4);
assert(els.shapePicker.hidden);
assert(!run('unlocked(2)'));
run(
  `for(let n=1;n<=12;n++){let s=makeStage(n),l=levels[n-1];if(s.board.filter(Boolean).length!==l.pairs*2)throw Error('pair count '+n);if(s.walls.filter(Boolean).length!==l.walls)throw Error('wall count '+n);if(s.shields.filter(Boolean).length!==l.shields)throw Error('shield count '+n);if(!solvable(s.board,s.shields,s.walls))throw Error('unsolvable stage '+n)}`,
);
run('startStage(3)');
assert.equal(run('state.stage'), 1);
function clear() {
  run(
    `while(state.board.some(Boolean)){const p=findPair(state.board,state.shields,state.walls);if(!p)throw Error('stuck stage '+state.stage);choose(p.a);choose(p.z)}`,
  );
}
clear();
assert(els.stageWin.open);
assert.equal(els.winTitle.textContent, 'Level 1');
assert.equal(els.winPairs.textContent, 4);
assert.equal(run('completed.join()'), '1');
assert(run('unlocked(2)'));
run('render();render()');
assert.equal(run('completed.length'), 1);
assert.equal(run('wins'), 1);
els.winNext.onclick();
assert.equal(run('state.stage'), 2);
assert(!els.stageWin.open);
for (let n = 2; n <= 12; n++) {
  assert.equal(run('state.stage'), n);
  clear();
  if (n < 12) els.winNext.onclick();
}
assert.equal(run('completed.length'), 12);
assert.equal(els.winTitle.textContent, 'Level 12');
assert.equal(els.winSubtitle.textContent, 'Power restored!');
assert.equal(els.winNext.textContent, 'Continue');
const restored = boot(saved);
assert.equal(restored.run('completed.length'), 12);
assert.equal(restored.run('state.stage'), 12);
assert(restored.els.stageWin.open);
els.winNext.onclick();
assert(!run('state.stage'));
assert(!els.shapePicker.hidden);
const endless = run('JSON.stringify(state)');
run('startStage(1)');
assert.equal(run('state.stage'), 1);
run('enterEndless()');
assert.equal(run('JSON.stringify(state)'), endless);
run('startStage(5)');
const before = run('JSON.stringify(state.board)');
run('var p=findPair(state.board,state.shields,state.walls);choose(p.a);choose(p.z)');
els.undo.onclick();
assert.equal(run('JSON.stringify(state.board)'), before);
els.restart.onclick();
assert.equal(run('state.stage'), 5);
assert.equal(run('state.score'), 0);
// Restarting mid-board asks in-game; Cancel keeps the board.
run('var p=findPair(state.board,state.shields,state.walls);choose(p.a);choose(p.z)');
assert.equal(run('state.score'), 1);
els.restart.onclick();
assert(els.confirmDialog.open);
assert.equal(els.confirmTitle.textContent, 'Restart?');
els.confirmCancel.onclick();
assert(!els.confirmDialog.open);
assert.equal(run('state.score'), 1);
els.restart.onclick();
els.confirmOk.onclick();
assert.equal(run('state.score'), 0);
// Forward only: with every stage cleared, Continue goes to Endless and nothing is left to replay.
clear();
els.winNext.onclick();
assert(!run('state.stage'));
assert(!els.stageWin.open);
assert.equal(run('completed.length'), 12);
assert(els.campaignButton.hidden);
// Continue always picks the first uncleared stage, even after a stray older board.
run('completed=[1,2,3];startStage(2)');
clear();
els.winNext.onclick();
assert.equal(run('state.stage'), 4);
// Closing the clear card also moves on.
clear();
els.winClose.onclick();
assert.equal(run('state.stage'), 5);
// An existing endless board is preserved on upgrade.
const oldState = run('make(256,"ring")');
const legacy = boot({ circuitState: JSON.stringify(oldState), circuitWins: '7' });
assert(!legacy.run('state.stage'));
assert.equal(legacy.run('state.seed'), 256);
assert.equal(legacy.run('wins'), 7);
assert.equal(legacy.run('completed.length'), 0);
const animated = boot(),
  timers = [];
animated.run('startStage(1)');
animated.ctx.document.getElementById('stageWin');
animated.run(
  'while(state.board.filter(Boolean).length>2){const p=findPair(state.board,state.shields,state.walls);choose(p.a);choose(p.z)}',
);
let frame;
animated.ctx.requestAnimationFrame = (f) => ((frame = f), 1);
animated.ctx.cancelAnimationFrame = () => {};
animated.ctx.setTimeout = (f, ms) => (timers.push({ f, ms }), 1);
animated.els.wires.querySelector = () => ({ setAttribute() {} });
animated.els.board.querySelector = () => ({
  classList: { add() {} },
  getBoundingClientRect: () => ({ left: 40, top: 40, width: 30, height: 30 }),
});
animated.ctx.document.getElementById('pops').getBoundingClientRect = () => ({
  left: 0,
  top: 0,
  width: 400,
  height: 400,
});
animated.run('var p=findPair(state.board,state.shields,state.walls);choose(p.a);choose(p.z)');
assert(!animated.els.stageWin.open);
frame(0);
frame(1000);
assert(!animated.els.stageWin.open);
assert(animated.run('busy&&state.board.filter(Boolean).length===2'));
timers.find((t) => t.ms === 200).f();
assert(animated.els.stageWin.open);
assert(animated.run('!busy&&state.board.every(v=>!v)'));
console.log(
  'PASS: 12 stage solutions, unlocks, win/replay/finale, reload, endless saves, undo/restart, migration, win screen after spark and pop',
);
