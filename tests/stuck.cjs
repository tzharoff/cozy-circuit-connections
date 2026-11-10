const assert = require('node:assert/strict');
const vm = require('node:vm');
const { gameSource } = require('./helpers/source.cjs');
const elements = {},
  saved = {};
const ctx = {
  document: {
    getElementById: (id) =>
      elements[id] ??
      (elements[id] = {
        value: 'random',
        open: false,
        shown: 0,
        showModal() {
          this.open = true;
          this.shown++;
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
vm.runInContext(gameSource(), ctx);
const run = (source) => vm.runInContext(source, ctx);
// Exact chip/shield/wall arrangement from the reported screenshot.
run(`
var screenshot = Array(64).fill(0), shield = Array(64).fill(0), wall = Array(64).fill(0);
for(const [p,v] of [[9,6],[10,4],[11,5],[12,3],[17,5],[18,6],[19,3],[20,4]]) screenshot[p]=v;
for(const p of [9,12,17]) shield[p]=1;
for(const p of [22,33,42]) wall[p]=1;
if(boardStatus(screenshot,shield,wall)!=='stuck')throw Error('screenshot not detected');
var earlier=screenshot.slice();earlier[26]=earlier[29]=2;
if(boardStatus(earlier,shield,wall)!=='playing')throw Error('undo fixture invalid');
state={seed:123,shape:'steps',board:screenshot.slice(),initial:earlier.slice(),shields:shield.slice(),initialShields:shield.slice(),walls:wall,score:1,claimed:false,history:[{board:earlier,shields:shield.slice(),score:0}]};
var winsBefore=wins,completedBefore=JSON.stringify(completed);render();
`);
assert(elements.stuckDialog.open);
assert(!elements.stuckNotice.hidden);
assert(!elements.stuckUndo.disabled);
assert.equal(run('wins'), run('winsBefore'));
assert.equal(run('JSON.stringify(completed)'), run('completedBefore'));
elements.stuckReview.onclick();
assert(!elements.stuckDialog.open);
run('render()');
assert(!elements.stuckDialog.open, 'Reviewing must not reopen the same dialog');
assert(!elements.stuckNotice.hidden);
run('choose(9)');
assert(elements.stuckDialog.open);
assert(elements.message.textContent.includes('No moves left'));
elements.stuckUndo.onclick();
assert(!elements.stuckDialog.open);
assert(elements.stuckNotice.hidden);
assert.equal(run('boardStatus(state.board,state.shields,state.walls)'), 'playing');
run('state.board=screenshot.slice();state.shields=shield.slice();state.history=[];render()');
assert(elements.stuckDialog.open);
assert(elements.stuckUndo.disabled);
elements.stuckRestart.onclick();
assert(!elements.stuckDialog.open);
assert(elements.stuckNotice.hidden);
run('state.board=screenshot.slice();render();save()');
// Reopening a saved dead end detects it immediately.
elements.stuckReview.onclick();
assert(!elements.stuckDialog.open);
elements.stuckNotice.hidden = true;
const loaded = { ...ctx };
vm.createContext(loaded);
vm.runInContext(gameSource(), loaded);
assert(elements.stuckDialog.open);
run('state.board=Array(64).fill(0);state.shields=Array(64).fill(0);render()');
assert(!elements.stuckDialog.open);
assert(elements.stageWin.open);
console.log(
  'PASS: reported screenshot, dead-end dialog/notice, shield clicks, undo, restart, reload, no false win/unlocks, empty board wins',
);
