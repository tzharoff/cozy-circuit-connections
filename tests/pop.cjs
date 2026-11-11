const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert');
const js = require('./helpers/source.cjs').gameSource('src/ui/effects.js');
const timers = [],
  marked = [];
const layer = {
  innerHTML: '',
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
};
const board = {
  querySelector: (s) => ({
    classList: { add: (c) => marked.push(c) },
    getBoundingClientRect: () => ({ left: 80, top: 120, width: 40, height: 40 }),
  }),
};
const ctx = {
  $: (id) => (id === 'board' ? board : layer),
  state: { board: Array(64).fill(1) },
  types: [{ color: '#ffcf80' }],
  clearTimeout() {},
  setTimeout: (f, ms) => (timers.push({ f, ms }), 1),
};
vm.createContext(ctx);
vm.runInContext(js + '\nconst {popPair}=createEffects({getElement:$,getState:()=>state});', ctx);
vm.runInContext('let committed=0;popPair(9,10,()=>committed++)', ctx);
assert.equal(marked.length, 2);
assert.equal((layer.innerHTML.match(/class="pop-bit"/g) || []).length, 16);
assert.equal(vm.runInContext('committed', ctx), 0);
// Timings come from src/ui/timing.js, so retuning the defaults doesn't break this test.
const chipMs = vm.runInContext('animTiming.popChip', ctx),
  clearMs = vm.runInContext('Math.max(animTiming.popConfetti + 20, animTiming.popRing) + 80', ctx);
timers.find((t) => t.ms === chipMs).f();
assert.equal(vm.runInContext('committed', ctx), 1);
timers.find((t) => t.ms === clearMs).f();
assert.equal(layer.innerHTML, '');
ctx.matchMedia = () => ({ matches: true });
vm.runInContext('popPair(9,10,()=>committed++)', ctx);
assert.equal(vm.runInContext('committed', ctx), 2);
console.log('PASS: both chips pop, 16 particles, delayed commit, effect cleanup, reduced motion');
