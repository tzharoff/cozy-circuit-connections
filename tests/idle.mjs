import assert from 'node:assert/strict';
import { createIdle, playIdle, IDLE_MS } from '../src/ui/idle.js';
import { componentIcon } from '../src/ui/components.js';

// Happy faces carry the parts the idle animations move.
const art = componentIcon(1);
for (const part of ['class="idle"', 'class="eyes"', 'class="mouth"', 'class="yawn"'])
  assert(art.includes(part), part);
assert(!componentIcon(1, 'sleepy').includes('class="eyes"'));

// One action at a time per Chip’um, removed when it finishes.
const classes = new Set();
const el = {
  classList: {
    add: (c) => classes.add(c),
    remove: (c) => classes.delete(c),
    [Symbol.iterator]: () => classes.values(),
  },
};
assert(playIdle(el, 'blink'));
assert(classes.has('idle-blink'));
assert(!playIdle(el, 'wiggle'), 'a busy Chip’um ignores a second action');
await new Promise((r) => setTimeout(r, IDLE_MS.blink + 40));
assert(!classes.size);

// The loop picks a target and acts; stop() ends it.
let asked = 0;
const idle = createIdle(() => (asked++, [el]));
const realSetTimeout = globalThis.setTimeout;
let scheduled;
globalThis.setTimeout = (f, ms) => ((scheduled = f), realSetTimeout(() => {}, 0));
idle.start();
scheduled();
assert.equal(asked, 1);
assert([...classes].some((c) => c.startsWith('idle-')));
idle.stop();
globalThis.setTimeout = realSetTimeout;
console.log('PASS: idle faces have blink/yawn parts, one action at a time, loop picks and acts');
