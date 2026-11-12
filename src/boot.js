import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { createNativeStore } from './platform/native-store.js';
/** App entry: on iOS and Android, load native saves into memory first (see native-store.js),
 * then start the game. In a browser the game keeps using localStorage. */
async function start() {
  if (Capacitor.isNativePlatform()) {
    try {
      globalThis.circuitStore = await createNativeStore(Preferences);
    } catch {
      /* If native storage fails, the game still runs on localStorage. */
    }
  }
  await import('./main.js');
}
start();
