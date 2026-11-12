import assert from 'node:assert/strict';
import { createNativeStore, MIGRATED_KEY } from '../src/platform/native-store.js';
import { createStorage } from '../src/platform/storage.js';

/** A stand-in for Capacitor Preferences backed by a Map. */
function fakePrefs(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    keys: async () => ({ keys: [...data.keys()] }),
    get: async ({ key }) => ({ value: data.has(key) ? data.get(key) : null }),
    set: async ({ key, value }) => void data.set(key, value),
    remove: async ({ key }) => void data.delete(key),
  };
}
/** A stand-in for the web view's localStorage. */
function fakeLocal(entries) {
  const keys = Object.keys(entries);
  return { length: keys.length, key: (i) => keys[i], getItem: (k) => entries[k] ?? null };
}

// First launch: existing progress (and only circuit… keys) is copied into native storage once.
const local = fakeLocal({
  circuitCampaign: '{"completed":[1,2,3],"tutorialDone":true}',
  circuitChipCoins: '45',
  otherApp: 'leave me',
});
const prefs = fakePrefs();
const store = await createNativeStore(prefs, local);
assert.equal(prefs.data.get('circuitCampaign'), local.getItem('circuitCampaign'));
assert.equal(prefs.data.get('circuitChipCoins'), '45');
assert(!prefs.data.has('otherApp'));
assert.equal(prefs.data.get(MIGRATED_KEY), '1');
assert.equal(store.getItem('circuitChipCoins'), '45');

// The game's save adapter reads and writes through it; writes reach native storage.
const saves = createStorage(store);
assert.deepEqual(saves.loadProgress().completed, [1, 2, 3]);
assert.equal(saves.loadChipCoins(), 45);
saves.saveChipCoins(30);
await store.flush();
assert.equal(prefs.data.get('circuitChipCoins'), '30');
store.removeItem('circuitChipCoins');
await store.flush();
assert(!prefs.data.has('circuitChipCoins'));

// Later launches never copy again, so stale localStorage can't overwrite newer native saves.
prefs.data.set('circuitChipCoins', '12');
const again = await createNativeStore(prefs, fakeLocal({ circuitChipCoins: '999' }));
assert.equal(again.getItem('circuitChipCoins'), '12');

// Native values already present win over localStorage during the first copy.
const mixed = fakePrefs({ circuitWins: '7' });
await createNativeStore(mixed, fakeLocal({ circuitWins: '2', circuitSound: 'off' }));
assert.equal(mixed.data.get('circuitWins'), '7');
assert.equal(mixed.data.get('circuitSound'), 'off');

// Broken localStorage just means nothing to carry over.
const broken = {
  get length() {
    throw new Error('blocked');
  },
};
const fresh = await createNativeStore(fakePrefs(), broken);
assert.equal(fresh.getItem('circuitCampaign'), null);
console.log(
  'PASS: native saves load into memory, one-time migration from localStorage, writes reach native storage',
);
