import { types, levels } from '../data/definitions.js';
import { maskFor } from '../game/generate.js';
import { componentIcon } from './components.js';
export function boardMarkup({ state, selected, hints, busy }) {
  const mask = state.mask || maskFor(state.shape);
  return state.board
    .map((v, i) => {
      if (state.walls[i])
        return '<div class="wall" role="img" aria-label="Wall: cables cannot pass"><span>▰</span></div>';
      if (!v)
        return '<div class="empty ' + (mask[i] ? 'socket' : 'lane') + '" aria-hidden="true"></div>';
      const t = types[v - 1];
      return `<button class="chip ${selected === i ? 'selected' : ''} ${hints.includes(i) ? 'hint' : ''} ${busy && hints.includes(i) ? 'connecting' : ''} ${state.shields[i] ? 'shielded' : ''}" style="--tone:${t.color}" data-chip="${i}" aria-label="${state.shields[i] ? 'Shielded ' : ''}${t.name}, row ${(i / 8) | 0}, column ${i % 8}" aria-pressed="${selected === i}">${componentIcon(v - 1)}<small>${t.name.slice(0, 3).toUpperCase()}</small>${state.shields[i] ? '<span class="shield-mark" aria-hidden="true">⬡</span>' : ''}</button>`;
    })
    .join('');
}
export function levelMarkup({ state, completed, tutorialDone, isUnlocked }) {
  return (
    '<button class="level-tile tutorial-tile ' +
    (tutorialDone ? 'cleared' : '') +
    '" data-level="0"><span class="level-no">00</span><b>A friendly first circuit</b><small>' +
    (tutorialDone ? '✓ TUTORIAL COMPLETE' : 'START HERE · TUTORIAL') +
    '</small></button>' +
    levels
      .map((l, i) => {
        const n = i + 1,
          done = completed.includes(n),
          open = isUnlocked(n);
        return (
          '<button class="level-tile ' +
          (done ? 'cleared' : '') +
          ' ' +
          (state?.stage === n ? 'current' : '') +
          '" data-level="' +
          n +
          '" ' +
          (!open ? 'disabled' : '') +
          ' aria-label="Stage ' +
          n +
          ': ' +
          l.name +
          (done ? ', completed' : open ? ', unlocked' : ', locked') +
          '"><span class="level-no">' +
          String(n).padStart(2, '0') +
          '</span><b>' +
          l.name +
          '</b><small>' +
          (done
            ? '✓ CLEARED'
            : open
              ? n === state?.stage
                ? 'IN PROGRESS'
                : 'READY TO PLAY'
              : 'LOCKED') +
          '</small></button>'
        );
      })
      .join('')
  );
}
