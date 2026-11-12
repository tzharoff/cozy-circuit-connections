import assert from 'node:assert/strict';
import { createSound } from '../src/ui/sound.js';

// Without Web Audio (like these tests), every sound is a silent no-op.
const saved = {};
const storage = { getItem: (k) => saved[k] ?? null, setItem: (k, v) => (saved[k] = v) };
const quiet = createSound(storage);
for (const name of quiet.names) quiet.play(name, { ms: 300, type: 2 });
assert.equal(quiet.muted, false);

// A tiny stand-in for Web Audio records which sounds actually start oscillators or noise.
let started = 0;
const param = () => ({
  value: 0,
  setValueAtTime() {},
  exponentialRampToValueAtTime() {},
});
const node = () => ({
  gain: param(),
  frequency: param(),
  Q: param(),
  connect: (next) => next,
  start: () => started++,
  stop() {},
});
globalThis.AudioContext = class {
  currentTime = 0;
  sampleRate = 8000;
  state = 'running';
  destination = node();
  createGain = node;
  createOscillator = node;
  createBiquadFilter = node;
  createDynamicsCompressor = node;
  createBufferSource = node;
  createBuffer = (_, length) => ({ getChannelData: () => new Float32Array(length) });
};
const sound = createSound(storage);
for (const name of sound.names) {
  const before = started;
  sound.play(name, { ms: 300, type: 4 });
  assert(started > before, name + ' makes no sound');
}
// Muting silences everything and is remembered.
sound.setMuted(true);
assert.equal(saved.circuitSound, 'off');
const before = started;
sound.play('pop');
assert.equal(started, before);
assert.equal(createSound(storage).muted, true);
sound.setMuted(false);
assert.equal(createSound(storage).muted, false);
console.log('PASS: every sound effect plays, silent without Web Audio, mute saved and restored');
