/** Themed covers: the shield mechanic in seasonal outfits (see docs/GAME_DESIGN.md). The rule is
 * the same for every theme; only the look, messages, sounds, and break burst change. A level
 * picks one with `cover`; anything unknown falls back to the default gold shield. */
export const coverThemes = {
  default: {
    crack: 'Double shield cracked!',
    broken: (n) => n + ' shield' + (n === 1 ? '' : 's') + ' broken!',
    crackSound: 'crack',
    breakSound: 'shield',
    burst: '#ffd36b',
  },
  ice: {
    crack: 'Ice cracked!',
    broken: (n) => (n === 1 ? 'Ice shattered!' : n + ' ice blocks shattered!'),
    crackSound: 'iceCrack',
    breakSound: 'iceBreak',
    burst: '#bfeaff',
  },
  gift: {
    crack: 'Wrapping torn!',
    broken: (n) => (n === 1 ? 'Unwrapped!' : n + ' gifts unwrapped!'),
    crackSound: 'paperTear',
    breakSound: 'unwrap',
    burst: '#ff8fb0',
  },
  egg: {
    crack: 'Shell cracked!',
    broken: (n) => (n === 1 ? 'Hatched!' : n + ' Chip’ums hatched!'),
    crackSound: 'eggCrack',
    breakSound: 'hatch',
    burst: '#fff1c9',
  },
};
/** The cover theme name for a board state. */
export const coverOf = (state) => (coverThemes[state?.cover] ? state.cover : 'default');
