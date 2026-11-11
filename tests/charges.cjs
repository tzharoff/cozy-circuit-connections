const vm = require('vm'),
  assert = require('assert');
const source = require('./helpers/source.cjs').gameSource();
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

// Refill rules: one Charge every 30 minutes, capped at five; the clock never runs backwards.
assert.equal(run('MAX_CHARGES'), 5);
assert.deepEqual(run('settle({count:3,since:0},REFILL_MS*2+5)'), { count: 5, since: null });
assert.deepEqual(run('settle({count:1,since:0},REFILL_MS+10)'), {
  count: 2,
  since: run('REFILL_MS'),
});
assert.deepEqual(run('settle({count:1,since:1e12},5)'), { count: 1, since: 5 });
assert.equal(run('untilNext({count:1,since:0},60000)'), run('REFILL_MS') - 60000);
assert.deepEqual(run('spendCharge(fullCharges(),100)'), { count: 4, since: 100 });
assert.equal(run('spendCharge({count:0,since:0},100)'), null);
assert.equal(run('clock(65000)'), '1:05');
assert.deepEqual(run('validCharges({count:-1})'), { count: 5, since: null });

// New saves start with a full battery and the placeholder Chip Coin balance.
assert.equal(run('charges.count'), 5);
assert.equal(run('chipCoins'), run('STARTING_CHIP_COINS'));
run('showHome()');
assert.equal(els.homeRefill.textContent, 'Full');
assert.equal(els.homeCoins.textContent, run('STARTING_CHIP_COINS'));

// Restarting a level after making matches asks first and spends one Charge.
run('startStage(5)');
assert.equal(run('state.stage'), 5);
run('var p=findPair(state.board,state.shields,state.walls);choose(p.a);choose(p.z)');
els.restart.onclick();
assert(els.confirmDialog.open);
assert(els.confirmText.textContent.includes('one Charge'));
els.confirmOk.onclick();
assert.equal(run('state.score'), 0);
assert.equal(run('charges.count'), 4);
assert.equal(JSON.parse(saved.circuitCharges).count, 4);
// An untouched board restarts for free.
els.restart.onclick();
assert.equal(run('charges.count'), 4);

// At zero, the restart booster opens the Charges card instead.
run('charges={count:0,since:Date.now()}');
run('var p=findPair(state.board,state.shields,state.walls);choose(p.a);choose(p.z)');
els.restart.onclick();
assert(els.chargesDialog.open);
assert(!els.chargesRecharge.hidden);
assert(!els.chargesBastion.hidden);
assert.equal(run('state.score'), 1);
els.chargesClose.onclick();
assert(!els.chargesDialog.open);

// A stuck level at zero: the failed card's Restart becomes Recharge.
run(`
var stuckBoard = Array(64).fill(0), shield = Array(64).fill(0), wall = Array(64).fill(0);
for(const [p,v] of [[9,6],[10,4],[11,5],[12,3],[17,5],[18,6],[19,3],[20,4]]) stuckBoard[p]=v;
for(const p of [9,12,17]) shield[p]=1;
for(const p of [22,33,42]) wall[p]=1;
state.board=stuckBoard.slice();state.shields=shield.slice();state.walls=wall;state.score=1;
render();
`);
assert(els.stuckDialog.open);
assert.equal(els.stuckRestartLabel.textContent, 'Recharge');
assert(els.stuckRestartCost.hidden);
els.stuckRestart.onclick();
assert(!els.stuckDialog.open);
assert(els.chargesDialog.open);
assert.equal(run('state.score'), 1, 'Recharge must not restart the board');

// Without enough Chip Coins, Recharge says so and changes nothing.
run('chipCoins=5');
els.chargesRecharge.onclick();
assert.equal(els.chargesStatus.textContent, 'Not enough Chip Coins');
assert.equal(run('charges.count'), 0);
assert.equal(run('chipCoins'), 5);

// With enough, Recharge spends the price, refills to full, and brings the failed card back.
run('chipCoins=60');
els.chargesRecharge.onclick();
assert.equal(run('chipCoins'), 60 - run('RECHARGE_PRICE'));
assert.equal(JSON.parse(saved.circuitChipCoins), 60 - run('RECHARGE_PRICE'));
assert.equal(run('charges.count'), 5);
assert(!els.chargesDialog.open);
assert(els.stuckDialog.open);
assert.equal(els.stuckRestartLabel.textContent, 'Restart');
assert(!els.stuckRestartCost.hidden);
els.stuckRestart.onclick();
assert.equal(run('state.score'), 0);
assert.equal(run('charges.count'), 4);

// Recharge is only offered at zero.
els.chargesRecharge.onclick();
assert.equal(run('chipCoins'), 60 - run('RECHARGE_PRICE'));

// Play with an empty battery opens the Charges card instead of the level.
run('charges={count:0,since:Date.now()};showHome()');
els.homePlay.onclick();
assert(els.chargesDialog.open);
assert(els.game.hidden);
console.log(
  'PASS: Charges refill/cap/spend, restart costs, free untouched restarts, zero-Charge Recharge from booster, failed card, and Play, Chip Coin balance and saves',
);
