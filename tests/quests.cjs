const vm = require('vm'),
  assert = require('assert');
const source = require('./helpers/source.cjs').gameSource();

// Pure rules, run inside the game bundle.
const saved = { circuitCampaign: JSON.stringify({ completed: [1, 2, 3, 4], tutorialDone: true }) };
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
  };
vm.createContext(ctx);
vm.runInContext(source, ctx);
const run = (s) => vm.runInContext(s, ctx);

// A day always deals the same three different quests; another day deals others.
const a = run('JSON.stringify(questsForDay("2026-11-13"))');
assert.equal(a, run('JSON.stringify(questsForDay("2026-11-13"))'));
const deal = JSON.parse(a);
assert.equal(deal.length, 3);
assert.equal(new Set(deal.map((q) => q.kind)).size, 3);
for (const q of deal) {
  const [min, max] = run('QUEST_KINDS')[q.kind].range;
  assert(q.target >= min && q.target <= max, q.kind);
}
const days = new Set();
for (let d = 1; d <= 28; d++)
  days.add(
    run(`JSON.stringify(questsForDay("2026-02-${String(d).padStart(2, '0')}").map(q=>q.kind))`),
  );
assert(days.size > 3, 'quests vary from day to day');
assert.equal(run('questDay(new Date(2026, 0, 5))'), '2026-01-05');

// Labels use Chip’um names.
assert.equal(run('questLabel({kind:"collect",type:2,target:20},types)'), 'Collect 20 Lulos');
assert.equal(run('questLabel({kind:"firstTry",target:1},types)'), 'Clear a level on the first try');

// Events: a match counts one connection and two chips of its type; shields count layers.
run(`var t={day:"x",quests:[
  {kind:"collect",type:1,target:4,reward:15,progress:0,claimed:false},
  {kind:"connect",target:2,reward:15,progress:0,claimed:false},
  {kind:"firstTry",target:1,reward:25,progress:0,claimed:false}]}`);
run('questEvent(t,{connect:1,shields:2})');
assert.deepEqual(run('t.quests.map(q=>q.progress)'), [2, 1, 0]);
run('questEvent(t,{connect:1});questEvent(t,{connect:1})');
assert.deepEqual(run('t.quests.map(q=>q.progress)'), [4, 2, 0], 'progress stops at the target');
run('questEvent(t,{clear:true,firstTry:false})');
assert.equal(run('t.quests[2].progress'), 0);
run('questEvent(t,{clear:true,firstTry:true})');
assert.equal(run('t.quests[2].progress'), 1);
assert.equal(run('claimQuest(t,0)'), 15);
assert.equal(run('claimQuest(t,0)'), 0, 'a quest pays once');

// In the game: today's quests show as three icons, play moves them, and Claim pays coins.
assert.equal((els.challengesLeft.innerHTML.match(/data-quest=/g) || []).length, 3);
run(`quests={day:questDay(),quests:[
  {kind:"connect",target:1,reward:15,progress:0,claimed:false},
  {kind:"clear",target:1,reward:20,progress:0,claimed:false},
  {kind:"firstTry",target:1,reward:25,progress:0,claimed:false}]};renderQuests()`);
run('startStage(5)');
run('var p=findPair(state.board,state.shields,state.walls);choose(p.a);choose(p.z)');
assert.equal(run('quests.quests[0].progress'), 1);
assert(els.challengesLeft.innerHTML.includes('quest-icon ready'));
// Restarting after a match spoils the first try, but clearing still counts as a clear.
els.restart.onclick();
els.confirmOk.onclick();
assert(run('state.restarted'));
run(
  'while(state.board.some(Boolean)){const q=findPair(state.board,state.shields,state.walls);choose(q.a);choose(q.z)}',
);
assert.equal(run('quests.quests[1].progress'), 1);
assert.equal(run('quests.quests[2].progress'), 0);
// A fresh level cleared without restarting is a first try.
run('startStage(6)');
run(
  'while(state.board.some(Boolean)){const q=findPair(state.board,state.shields,state.walls);choose(q.a);choose(q.z)}',
);
assert.equal(run('quests.quests[2].progress'), 1);
assert.equal(JSON.parse(saved.circuitQuests).quests[2].progress, 1);
// Claiming from the Quests card adds the reward to Chip Coins.
const coins = run('chipCoins');
run('openQuests()');
assert(els.questList.innerHTML.includes('data-claim="0"'));
els.questList.onclick({ target: { closest: () => ({ dataset: { claim: '0' } }) } });
assert.equal(run('chipCoins'), coins + 15);
assert(run('quests.quests[0].claimed'));
console.log(
  'PASS: daily quests deal by date, Chip’um labels, match/shield/clear/first-try progress, icons, Claim pays Chip Coins',
);
