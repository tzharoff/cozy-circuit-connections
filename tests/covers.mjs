import assert from 'node:assert/strict';
import { coverThemes, coverOf } from '../src/data/covers.js';
import { boardMarkup } from '../src/ui/view.js';
import { createSound } from '../src/ui/sound.js';
import { makeStage } from '../src/game/generate.js';

// Every theme has its messages, sounds, and burst color, and unknown themes fall back.
const sounds = createSound({ getItem: () => null, setItem() {} }).names;
for (const [name, theme] of Object.entries(coverThemes)) {
  assert.match(theme.crack, /!$/, name);
  assert.match(theme.broken(1), /!$/, name);
  assert.match(theme.broken(2), /2/, name);
  assert(sounds.includes(theme.crackSound) && sounds.includes(theme.breakSound), name);
  assert.match(theme.burst, /^#[0-9a-f]{6}$/i, name);
}
assert.equal(coverOf({ cover: 'ice' }), 'ice');
assert.equal(coverOf({ cover: 'lava' }), 'default');
assert.equal(coverOf({}), 'default');

// Themed covers drop the single-cover badge (the cover is obvious) but keep the "2" on doubles.
const s = makeStage(13);
const single = s.shields.indexOf(1),
  double = s.shields.indexOf(2);
const badge = (state, i) => {
  const html = boardMarkup({ state, selected: null, hints: [], busy: false });
  const chip = html.split('<button').find((b) => b.includes('data-chip="' + i + '"'));
  return chip.match(/class="shield-mark"[^>]*>([^<]*)</)?.[1] ?? null;
};
assert.equal(badge(s, single), '⬡');
assert.equal(badge(s, double), '2');
const iced = { ...s, cover: 'ice' };
assert.equal(badge(iced, single), null);
assert.equal(badge(iced, double), '2');
console.log(
  'PASS: cover themes (shield, ice, gift, egg) have messages, sounds, bursts; badges per theme',
);
