/** Sound effects, synthesized with the Web Audio API: no audio files to load or license.
 * Each sound is a short recipe of oscillators and filtered noise. The audio context starts
 * on the first sound after a tap (browsers and iOS require a user gesture). Sound on/off is
 * saved under `circuitSound`. Everything is silent where Web Audio is unavailable (tests). */

/** A cozy pentatonic scale; each Chip’um type pops on its own note. */
const POP_NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

export function createSound(storage = globalThis.circuitStore || globalThis.localStorage) {
  let ctx = null,
    master = null,
    noise = null,
    muted = false;
  try {
    muted = storage?.getItem('circuitSound') === 'off';
  } catch {}

  function audio() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume?.();
      return ctx;
    }
    const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0.55;
    // A gentle compressor keeps stacked sounds (two pops at once) from clipping.
    const squash = ctx.createDynamicsCompressor();
    master.connect(squash).connect(ctx.destination);
    // One second of white noise, reused for crackles, whooshes, and fizzles.
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  /** Attack/decay volume envelope on a new gain node. */
  function envelope(at, peak, attack, decay) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    g.connect(master);
    return g;
  }
  /** A pitched tone that can glide from one frequency to another. */
  function tone({ type = 'sine', from, to = from, at, length, peak = 0.3, attack = 0.005 }) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, at);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, at + length);
    osc.connect(envelope(at, peak, attack, length));
    osc.start(at);
    osc.stop(at + attack + length + 0.02);
  }
  /** Band-passed noise whose center can sweep (whoosh, fizzle, crackle). */
  function hiss({ from, to = from, at, length, peak = 0.2, q = 1.5, attack = 0.01 }) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = q;
    band.frequency.setValueAtTime(from, at);
    if (to !== from) band.frequency.exponentialRampToValueAtTime(to, at + length);
    src.connect(band).connect(envelope(at, peak, attack, length));
    src.start(at, Math.random() * 0.5);
    src.stop(at + attack + length + 0.02);
  }

  const recipes = {
    /** Picking a chip: a soft rising blip. */
    select(t) {
      tone({ from: 660, to: 990, at: t, length: 0.07, peak: 0.18 });
    },
    /** Tapping the same chip again: a soft falling blip. */
    deselect(t) {
      tone({ from: 700, to: 470, at: t, length: 0.07, peak: 0.14 });
    },
    /** No route there: two low, gentle buzzes. */
    blocked(t) {
      tone({ type: 'square', from: 150, at: t, length: 0.06, peak: 0.06 });
      tone({ type: 'square', from: 130, at: t + 0.09, length: 0.08, peak: 0.06 });
    },
    /** The zap line traveling: a rising electric hum with crackle, lasting `ms`. */
    zap(t, { ms = 400 } = {}) {
      const length = ms / 1000;
      tone({ type: 'sawtooth', from: 220, to: 880, at: t, length, peak: 0.05, attack: 0.02 });
      tone({ type: 'triangle', from: 440, to: 1760, at: t, length, peak: 0.07, attack: 0.02 });
      hiss({ from: 2500, to: 6000, at: t, length, peak: 0.05, q: 4, attack: 0.02 });
    },
    /** A chip popping: a bubbly drop on the chip type's own note. */
    pop(t, { type = 0 } = {}) {
      const note = POP_NOTES[type % POP_NOTES.length];
      tone({ from: note * 1.6, to: note * 0.7, at: t, length: 0.12, peak: 0.28 });
      tone({ type: 'triangle', from: note * 2, at: t, length: 0.05, peak: 0.08 });
      hiss({ from: 3000, at: t, length: 0.03, peak: 0.08, q: 0.8, attack: 0.002 });
    },
    /** A shield breaking: a bright glassy clink. */
    shield(t) {
      tone({ type: 'triangle', from: 1975, at: t, length: 0.18, peak: 0.12, attack: 0.002 });
      tone({ type: 'sine', from: 2637, at: t + 0.02, length: 0.22, peak: 0.08, attack: 0.002 });
      hiss({ from: 7000, at: t, length: 0.05, peak: 0.06, q: 2, attack: 0.002 });
    },
    /** A double shield cracking (one layer left): a dull crunch and a low clink. */
    crack(t) {
      hiss({ from: 2600, to: 900, at: t, length: 0.12, peak: 0.16, q: 1, attack: 0.002 });
      tone({
        type: 'triangle',
        from: 980,
        to: 620,
        at: t,
        length: 0.12,
        peak: 0.08,
        attack: 0.002,
      });
    },
    /** Ice cover cracking: a sharp, glassy tick. */
    iceCrack(t) {
      tone({
        type: 'triangle',
        from: 2400,
        to: 1800,
        at: t,
        length: 0.08,
        peak: 0.1,
        attack: 0.001,
      });
      hiss({ from: 6000, to: 3000, at: t, length: 0.08, peak: 0.08, q: 3, attack: 0.001 });
    },
    /** Ice cover shattering: a tinkling cascade of shards. */
    iceBreak(t) {
      [2637, 3136, 2349, 3520, 2794].forEach((f, n) =>
        tone({
          type: 'triangle',
          from: f,
          at: t + n * 0.035,
          length: 0.18,
          peak: 0.07,
          attack: 0.001,
        }),
      );
      hiss({ from: 7000, to: 4000, at: t, length: 0.2, peak: 0.08, q: 2, attack: 0.001 });
    },
    /** Gift cover tearing: a short paper rip. */
    paperTear(t) {
      hiss({ from: 1800, to: 3200, at: t, length: 0.14, peak: 0.16, q: 0.7, attack: 0.005 });
    },
    /** Gift cover unwrapping: a longer rip and a little bow-pop ding. */
    unwrap(t) {
      hiss({ from: 1500, to: 3600, at: t, length: 0.22, peak: 0.16, q: 0.7, attack: 0.005 });
      tone({ from: 880, to: 1320, at: t + 0.2, length: 0.12, peak: 0.12 });
      tone({ from: 1760, at: t + 0.28, length: 0.2, peak: 0.08 });
    },
    /** Egg cover cracking: a soft, hollow tock. */
    eggCrack(t) {
      tone({ from: 700, to: 420, at: t, length: 0.07, peak: 0.16, attack: 0.001 });
      hiss({ from: 2200, at: t, length: 0.04, peak: 0.08, q: 1.5, attack: 0.001 });
    },
    /** Egg cover hatching: a crack and a happy little peep. */
    hatch(t) {
      tone({ from: 650, to: 380, at: t, length: 0.07, peak: 0.16, attack: 0.001 });
      tone({ from: 1400, to: 2100, at: t + 0.12, length: 0.1, peak: 0.12 });
      tone({ from: 1600, to: 2400, at: t + 0.24, length: 0.12, peak: 0.1 });
    },
    /** Level clear: a rising bell arpeggio with a sparkle on top. */
    clear(t) {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone({ type: 'triangle', from: f, at: t + i * 0.09, length: 0.5, peak: 0.16 });
        tone({ from: f * 2, at: t + i * 0.09, length: 0.25, peak: 0.05 });
      });
      tone({ from: 2093, at: t + 0.4, length: 0.6, peak: 0.07 });
    },
    /** Short circuit (failed card): a fizzle, a falling buzz, and a soft thud. */
    shortCircuit(t) {
      hiss({ from: 5000, to: 600, at: t, length: 0.45, peak: 0.16, q: 2 });
      tone({ type: 'sawtooth', from: 420, to: 70, at: t + 0.05, length: 0.4, peak: 0.06 });
      tone({ from: 110, to: 55, at: t + 0.42, length: 0.18, peak: 0.25 });
    },
    /** Bedtime: a Chip’um dozing off, a soft sleepy slide down. */
    doze(t) {
      tone({ from: 520, to: 260, at: t, length: 0.45, peak: 0.1, attack: 0.04 });
      tone({ type: 'triangle', from: 390, to: 200, at: t + 0.1, length: 0.4, peak: 0.05 });
    },
    /** Bedtime: a Chip’um waking with a startled little chirp. */
    wake(t) {
      tone({ from: 600, to: 1200, at: t, length: 0.09, peak: 0.16 });
      tone({ from: 900, to: 1600, at: t + 0.08, length: 0.08, peak: 0.1 });
    },
    /** Bedtime lost: a gentle three-note lullaby falling to sleep. */
    lightsOut(t) {
      [659.25, 523.25, 392].forEach((f, n) =>
        tone({
          type: 'triangle',
          from: f,
          at: t + n * 0.28,
          length: 0.5,
          peak: 0.13,
          attack: 0.03,
        }),
      );
      tone({ from: 196, at: t + 0.84, length: 0.8, peak: 0.08, attack: 0.06 });
    },
    /** A card landing: a soft low thump. */
    land(t) {
      tone({ from: 160, to: 70, at: t, length: 0.14, peak: 0.22 });
    },
    /** A card flying up and away: a rising whoosh. */
    whoosh(t) {
      hiss({ from: 500, to: 3500, at: t, length: 0.32, peak: 0.12, q: 1.2, attack: 0.08 });
    },
    /** A hint appearing: a soft two-note twinkle. */
    hint(t) {
      tone({ from: 1319, at: t, length: 0.12, peak: 0.12 });
      tone({ from: 1760, at: t + 0.08, length: 0.2, peak: 0.1 });
    },
    /** Any ordinary button. */
    tap(t) {
      tone({ from: 520, to: 600, at: t, length: 0.04, peak: 0.12 });
    },
    /** Spending a Charge on a restart: a short downward hum. */
    spend(t) {
      tone({ type: 'triangle', from: 600, to: 300, at: t, length: 0.18, peak: 0.14 });
    },
    /** Recharge: a rising power-up hum, then a ding. */
    recharge(t) {
      tone({ type: 'triangle', from: 200, to: 1200, at: t, length: 0.5, peak: 0.12, attack: 0.03 });
      hiss({ from: 800, to: 5000, at: t, length: 0.5, peak: 0.04, q: 3, attack: 0.03 });
      tone({ from: 1568, at: t + 0.52, length: 0.4, peak: 0.12 });
      tone({ from: 2093, at: t + 0.6, length: 0.4, peak: 0.08 });
    },
    /** Chip Coins changing hands: a classic two-note coin. */
    coin(t) {
      tone({ type: 'square', from: 988, at: t, length: 0.06, peak: 0.05 });
      tone({ type: 'square', from: 1319, at: t + 0.07, length: 0.25, peak: 0.05 });
    },
  };

  /** Plays a sound by name. `options` carry details such as { ms } or { type }. */
  function play(name, options) {
    if (muted || !recipes[name]) return;
    try {
      if (!audio()) return;
      recipes[name](ctx.currentTime + 0.005, options);
    } catch {
      /* A failed sound never stops the game. */
    }
  }
  return {
    play,
    names: Object.keys(recipes),
    get muted() {
      return muted;
    },
    setMuted(value) {
      muted = !!value;
      try {
        storage?.setItem('circuitSound', muted ? 'off' : 'on');
      } catch {}
    },
  };
}
