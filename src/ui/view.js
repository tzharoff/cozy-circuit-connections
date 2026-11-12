import { types } from '../data/definitions.js';
import { maskFor } from '../game/generate.js';
import { componentIcon } from './components.js';
import { insideBoard } from '../game/rules.js';
/** Two sparks racing around inside a selected or connecting chip's edge. */
const zapRing =
  '<svg class="zap-ring" aria-hidden="true"><rect class="zap-track" width="100%" height="100%" rx="9" pathLength="100"/><rect class="zap-sparks" width="100%" height="100%" rx="9" pathLength="100"/></svg>';
/** `lit` chips show the selected look too: the first chip while the wire runs, then both. */
export function boardMarkup({ state, selected, hints, busy, lit = [] }) {
  const mask = state.mask || maskFor(state.shape);
  return state.board
    .map((v, i) => {
      if (!insideBoard(i)) return '<div class="outside" hidden aria-hidden="true"></div>';
      if (state.walls[i])
        return '<div class="wall" role="img" aria-label="Wall: cables cannot pass"><span>▰</span></div>';
      if (!v)
        return '<div class="empty ' + (mask[i] ? 'socket' : 'lane') + '" aria-hidden="true"></div>';
      const t = types[v - 1];
      return `<button class="chip ${selected === i || lit.includes(i) ? 'selected' : ''} ${hints.includes(i) ? 'hint' : ''} ${busy && hints.includes(i) ? 'connecting' : ''} ${state.shields[i] ? 'shielded' : ''}" style="--tone:${t.color}" data-chip="${i}" aria-label="${state.shields[i] ? 'Shielded ' : ''}${t.name}, row ${(i / 8) | 0}, column ${i % 8}" aria-pressed="${selected === i}">${componentIcon(v - 1)}<small>${t.name.slice(0, 3).toUpperCase()}</small>${state.shields[i] ? '<span class="shield-mark" aria-hidden="true">⬡</span>' : ''}${selected === i || lit.includes(i) || (busy && hints.includes(i)) ? zapRing : ''}</button>`;
    })
    .join('');
}
