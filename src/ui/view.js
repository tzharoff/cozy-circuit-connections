import { types } from '../data/definitions.js';
import { maskFor } from '../game/generate.js';
import { componentIcon } from './components.js';
import { insideBoard } from '../game/rules.js';
/** Two sparks racing around inside a selected or connecting chip's edge. */
const zapRing =
  '<svg class="zap-ring" aria-hidden="true"><rect class="zap-track" width="100%" height="100%" rx="9" pathLength="100"/><rect class="zap-sparks" width="100%" height="100%" rx="9" pathLength="100"/></svg>';
/** Crack lines over a double shield that has lost one layer. */
const crack =
  '<svg class="shield-crack" viewBox="0 0 40 40" aria-hidden="true"><path d="M4 9l9 6-3 7 8 4-2 9M36 6l-8 7 4 6-7 5M30 36l-4-7 6-4"/></svg>';
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
      const t = types[v - 1],
        layers = state.shields[i] || 0,
        // A double shield that has taken one hit shows cracks until it breaks.
        cracked = layers === 1 && state.initialShields?.[i] === 2,
        shieldClass = layers
          ? 'shielded' + (layers > 1 ? ' double' : '') + (cracked ? ' cracked' : '')
          : '',
        // Bedtime: a sleeping Chip’um shows the sleepy face with a floating z.
        asleep = !!state.asleep?.[i],
        shieldLabel = layers > 1 ? 'Double-shielded ' : layers ? 'Shielded ' : '',
        // Themed covers (ice, gift, egg) are obvious on their own; only doubles show a badge.
        badge = layers > 1 || !state.cover || state.cover === 'default',
        mark = layers
          ? (badge
              ? '<span class="shield-mark" aria-hidden="true">' +
                (layers > 1 ? '2' : '⬡') +
                '</span>'
              : '') + (cracked ? crack : '')
          : '';
      return `<button class="chip ${selected === i || lit.includes(i) ? 'selected' : ''} ${hints.includes(i) ? 'hint' : ''} ${busy && hints.includes(i) ? 'connecting' : ''} ${shieldClass} ${asleep ? 'asleep' : ''}" style="--tone:${t.color}" data-chip="${i}" aria-label="${asleep ? 'Sleeping ' : ''}${shieldLabel}${t.name}, row ${(i / 8) | 0}, column ${i % 8}" aria-pressed="${selected === i}">${componentIcon(v - 1, asleep ? 'sleepy' : 'happy')}${asleep ? '<span class="chip-zz" aria-hidden="true">z</span>' : ''}<small>${t.name.slice(0, 3).toUpperCase()}</small>${mark}${selected === i || lit.includes(i) || (busy && hints.includes(i)) ? zapRing : ''}</button>`;
    })
    .join('');
}
