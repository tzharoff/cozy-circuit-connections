const vm = require('vm'),
  fs = require('fs'),
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
assert(run('state.tutorial&&state.stage===0&&state.tutorialStep===0'));
assert.equal(els.modeLabel.textContent, 'LEVEL 0 · GUIDED TUTORIAL');
assert(els.shapePicker.hidden);
assert(!els.tutorialCoach.hidden);
run(
  'for(let i=0;i<lessons.length;i++){const s=makeTutorial(i);if(!solvable(s.board,s.shields,s.walls))throw Error("unsolvable lesson")}',
);
function clearLesson() {
  run(
    'while(state.board.some(Boolean)){const p=findPair(state.board,state.shields,state.walls);if(!p)throw Error("stuck lesson");choose(p.a);choose(p.z)}',
  );
}
clearLesson();
assert(!els.stageWin?.open);
assert(!els.lessonNext.hidden);
assert(!els.message.textContent.includes('No connections'));
assert.equal(run('wins'), 0);
assert(!run('tutorialDone'));
els.lessonNext.onclick();
assert.equal(run('state.tutorialStep'), 1);
assert.equal(run('state.tutorialTotal'), 1);
const resumed = boot(saved);
assert(resumed.run('state.tutorialStep===1&&state.tutorialTotal===1'));
clearLesson();
els.lessonNext.onclick();
assert.equal(run('state.tutorialStep'), 2);
run('choose(26)');
assert(run('state.shields[26]===1&&state.score===0'));
run('choose(18);choose(19)');
assert(run('state.shields[26]===0&&state.board[26]===3'));
els.undo.onclick();
assert(run('state.shields[26]===1&&state.score===0'));
clearLesson();
els.lessonNext.onclick();
assert.equal(run('state.tutorialStep'), 3);
run(
  'var p=findPair(state.board,state.shields,state.walls);if(p.path.includes(27)||p.path.length<=4)throw Error("wall not detoured")',
);
clearLesson();
assert(els.stageWin.open);
assert.equal(els.winTitle.textContent, 'Tutorial');
assert.equal(els.winPairs.textContent, 5);
assert.equal(run('wins'), 1);
assert(run('tutorialDone'));
assert.equal(run('completed.length'), 0);
assert.equal(els.winNext.textContent, 'Continue');
const finished = boot(saved);
assert(finished.run('tutorialDone'));
assert(finished.els.stageWin.open);
els.winReplay.onclick();
assert(run('state.tutorial&&state.tutorialStep===0'));
assert(!els.stageWin.open);
els.tutorialSkip.onclick();
assert.equal(run('state.stage'), 1);
assert.equal(run('completed.length'), 0);
assert(els.tutorialCoach.hidden);
els.campaignButton.onclick();
assert(els.levelGrid.innerHTML.includes('data-level="0"'));
assert(els.levelGrid.innerHTML.includes('TUTORIAL COMPLETE'));
run('startStage(0,true);enterEndless(true)');
assert(!run('state.tutorial'));
assert(!els.shapePicker.hidden);
// Existing campaign players keep their stage and unlocks when upgrading.
run('state=makeStage(7);completed=[1,2,3,4,5,6];save()');
const veteran = boot(saved);
assert.equal(veteran.run('state.stage'), 7);
assert.equal(veteran.run('completed.length'), 6);
veteran.run('startStage(0,true)');
assert(veteran.run('state.tutorial'));
assert.equal(veteran.run('completed.length'), 6);
console.log(
  'PASS: four lessons, guidance, shield/wall teaching, undo, lesson resume, tutorial win/replay/skip, Stage 1 handoff, endless, existing campaign saves',
);
