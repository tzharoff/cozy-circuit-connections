/** Native saves: progress, Charges, Chip Coins, and settings live in the phone's own storage
 * (iOS UserDefaults, Android SharedPreferences, through Capacitor Preferences) instead of the
 * web view's localStorage, which iOS can clear when the phone is low on space.
 *
 * The game reads saves synchronously, so everything is loaded into memory once at startup;
 * reads come from memory and every write goes straight through to native storage.
 * The first time it runs, any existing `circuit…` localStorage saves are copied across, so
 * players keep their progress. The browser and standalone exports keep using localStorage. */

/** Marks that the one-time copy from localStorage has happened. */
export const MIGRATED_KEY = 'circuitNativeSaves';

/** `prefs` is the Capacitor Preferences plugin (or a stand-in with get/set/remove/keys). */
export async function createNativeStore(prefs, local = globalThis.localStorage) {
  const memory = new Map();
  let { keys } = await prefs.keys();
  if (!keys.includes(MIGRATED_KEY)) {
    // Copy every existing save across once; native values already there win.
    const copies = [];
    try {
      for (let i = 0; i < (local?.length || 0); i++) {
        const key = local.key(i);
        if (key?.startsWith('circuit') && !keys.includes(key)) {
          const value = local.getItem(key);
          if (value !== null) copies.push(prefs.set({ key, value }));
        }
      }
    } catch {
      /* Unreadable localStorage simply means nothing to carry over. */
    }
    await Promise.all(copies);
    await prefs.set({ key: MIGRATED_KEY, value: '1' });
    ({ keys } = await prefs.keys());
  }
  await Promise.all(
    keys.map(async (key) => {
      const { value } = await prefs.get({ key });
      if (value !== null && value !== undefined) memory.set(key, value);
    }),
  );
  /** Writes that haven't reached native storage yet (so tests and shutdown can wait). */
  let pending = Promise.resolve();
  const later = (work) => (pending = pending.then(work).catch(() => {}));
  return {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem(key, value) {
      value = String(value);
      memory.set(key, value);
      later(() => prefs.set({ key, value }));
    },
    removeItem(key) {
      memory.delete(key);
      later(() => prefs.remove({ key }));
    },
    flush: () => pending,
  };
}
