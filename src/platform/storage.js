import { levels, shapes } from '../data/definitions.js';
import { clone, valid } from '../game/state.js';
import { shieldsFor, wallsFor } from '../game/generate.js';
import { solvable } from '../game/rules.js';
import { insideBoard } from '../game/rules.js';
import { STARTING_CHIP_COINS, validCharges } from '../game/charges.js';

/** Browser save adapter. Keep these existing keys stable across web/mobile refactors. */
export function createStorage(storage) {
  if (!storage) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  }
  function read(key) {
    try {
      return JSON.parse(storage.getItem(key));
    } catch {
      return null;
    }
  }
  function write(key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      /* Play remains available when storage is blocked or full. */
    }
  }
  return {
    loadProgress() {
      const progress = read('circuitCampaign');
      const old = read('circuitEndlessState');
      return {
        completed: Array.isArray(progress?.completed)
          ? [
              ...new Set(
                progress.completed.filter(
                  (n) => Number.isInteger(n) && n >= 1 && n <= levels.length,
                ),
              ),
            ]
          : [],
        tutorialDone: !!progress?.tutorialDone,
        endlessSave: valid(old) ? old : null,
      };
    },
    loadCurrent() {
      const saved = read('circuitState');
      return { state: valid(saved) ? saved : undefined, wins: Number(read('circuitWins')) || 0 };
    },
    migrate(state) {
      if (!state) return state;
      if (state.routingVersion !== 2) {
        state.needsBoundaryRestart = true;
        state.routingVersion = 2;
      }
      if (!shapes[state.shape]) state.shape = 'classic';
      if (!Array.isArray(state.shields) || state.shields.length !== 64) {
        state.shields = shieldsFor(state.board, state.seed);
        state.initialShields = shieldsFor(state.initial, state.seed);
        state.history = [];
      }
      if (!Array.isArray(state.initialShields))
        state.initialShields = shieldsFor(state.initial, state.seed);
      if (!Array.isArray(state.walls)) {
        state.walls = wallsFor(state.board, state.seed, state.shields);
        for (let i = 0; i < 64; i++)
          if (
            state.walls[i] &&
            (state.initial[i] ||
              !solvable(state.initial, state.initialShields, state.walls) ||
              state.history.some(
                (h) => h.board[i] || !solvable(h.board, h.shields || [], state.walls),
              ))
          )
            state.walls[i] = 0;
      }
      state.walls = state.walls.map((v, i) => (insideBoard(i) ? v : 0));
      return state;
    },
    saveGame({ state, wins, completed, tutorialDone }) {
      write('circuitCampaign', { completed, tutorialDone });
      if (!state.stage && !state.tutorial) write('circuitEndlessState', state);
      write('circuitState', state);
      write('circuitWins', wins);
    },
    saveEndless(state) {
      write('circuitEndlessState', state);
    },
    loadCharges() {
      return validCharges(read('circuitCharges'));
    },
    saveCharges(charges) {
      write('circuitCharges', charges);
    },
    loadChipCoins() {
      const coins = read('circuitChipCoins');
      return Number.isInteger(coins) && coins >= 0 ? coins : STARTING_CHIP_COINS;
    },
    saveChipCoins(coins) {
      write('circuitChipCoins', coins);
    },
    loadShapeChoice() {
      try {
        return storage.getItem('circuitShapeChoice') || 'random';
      } catch {
        return 'random';
      }
    },
    saveShapeChoice(value) {
      try {
        storage.setItem('circuitShapeChoice', value);
      } catch {}
    },
  };
}
