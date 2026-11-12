import { types } from '../data/definitions.js';
import { animTiming, wireTravelMs } from './timing.js';
/** Visual effects own their timers; callbacks commit a match after arrival/pop. */
export function createEffects({ getElement: $, getState }) {
  let wireFrame = null,
    arrivalTimer = null,
    wireTimer;
  function clearWire() {
    clearTimeout(arrivalTimer);
    arrivalTimer = null;
    if (wireFrame !== null) {
      globalThis.cancelAnimationFrame?.(wireFrame);
      wireFrame = null;
    }
    clearTimeout(wireTimer);
    $('wires').innerHTML = '';
  }
  function draw(path, onArrival) {
    clearWire();
    let arrived = false;
    const arrive = () => {
      if (!arrived) {
        arrived = true;
        onArrival?.();
      }
    };
    const wire = $('wires'),
      grid = $('board'),
      bounds = wire.getBoundingClientRect?.();
    const coords = path.map((p) => {
      const rect = grid.children?.[p]?.getBoundingClientRect?.();
      return bounds?.width && bounds?.height && rect
        ? [
            ((rect.left + rect.width / 2 - bounds.left) / bounds.width) * 100,
            ((rect.top + rect.height / 2 - bounds.top) / bounds.height) * 100,
          ]
        : [((p % 8) - 0.5) * (100 / 6), (((p / 8) | 0) - 0.5) * (100 / 6)];
    });
    const points = coords.map((p) => p.join(',')).join(' ');
    if (
      globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ||
      !globalThis.requestAnimationFrame
    ) {
      wire.innerHTML = '<polyline class="power-core" points="' + points + '"/>';
      if (!globalThis.requestAnimationFrame) arrive();
      else arrivalTimer = setTimeout(arrive, 180);
      wireTimer = setTimeout(() => {
        arrive();
        wire.innerHTML = '';
      }, 650);
      return;
    }
    const trace = (cls) =>
      '<polyline class="' +
      cls +
      '" points="' +
      points +
      '" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="100"/>';
    const last = coords.at(-1);
    wire.innerHTML =
      '<g class="power-connection">' +
      trace('power-halo') +
      trace('power-core') +
      '<g class="power-spark"><circle class="spark-aura" r="2.1"/><circle class="spark-center" r=".85"/><path class="spark-rays" d="M-3 0h1M2 0h1M0-3v1M0 2v1M-2-2l.6.6M1.4 1.4l.6.6M-2 2l.6-.6M1.4-1.4l.6-.6"/></g><circle class="arrival-ring" cx="' +
      last[0] +
      '" cy="' +
      last[1] +
      '" r=".5" opacity="0"/></g>';
    const group = wire.querySelector('.power-connection'),
      core = wire.querySelector('.power-core'),
      halo = wire.querySelector('.power-halo'),
      spark = wire.querySelector('.power-spark'),
      ring = wire.querySelector('.arrival-ring');
    const lengths = [0];
    for (let i = 1; i < coords.length; i++)
      lengths[i] =
        lengths[i - 1] +
        Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
    const total = lengths.at(-1),
      duration = wireTravelMs(path.length),
      ringMs = animTiming.wireRing,
      fadeAt = duration + animTiming.wireLinger,
      gone = fadeAt + animTiming.wireFade;
    let started;
    function frame(now) {
      if (started === undefined) started = now;
      const elapsed = now - started,
        progress = Math.min(1, elapsed / duration),
        distance = total * progress;
      let index = 1;
      while (index < lengths.length - 1 && lengths[index] < distance) index++;
      const part = (distance - lengths[index - 1]) / (lengths[index] - lengths[index - 1] || 1);
      const x = coords[index - 1][0] + (coords[index][0] - coords[index - 1][0]) * part,
        y = coords[index - 1][1] + (coords[index][1] - coords[index - 1][1]) * part;
      core.setAttribute('stroke-dashoffset', String(100 * (1 - progress)));
      halo.setAttribute('stroke-dashoffset', String(100 * (1 - progress)));
      spark.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
      spark.setAttribute('opacity', elapsed > duration ? '0' : '1');
      if (progress === 1) arrive();
      const arrival = ringMs ? Math.max(0, Math.min(1, (elapsed - duration) / ringMs)) : 1;
      ring.setAttribute('r', String(0.5 + arrival * 4));
      ring.setAttribute('opacity', elapsed >= duration ? String((1 - arrival) * 0.9) : '0');
      group.setAttribute(
        'opacity',
        String(1 - Math.max(0, Math.min(1, (elapsed - fadeAt) / (animTiming.wireFade || 1)))),
      );
      if (elapsed < Math.max(gone, duration + ringMs))
        wireFrame = globalThis.requestAnimationFrame(frame);
      else {
        wire.innerHTML = '';
        wireFrame = null;
      }
    }
    wireFrame = globalThis.requestAnimationFrame(frame);
    wireTimer = setTimeout(
      () => {
        arrive();
        if (wireFrame !== null) globalThis.cancelAnimationFrame?.(wireFrame);
        wireFrame = null;
        wire.innerHTML = '';
      },
      Math.max(gone, duration + ringMs) + 1100,
    );
  }
  let burstTimer = null;
  function popPair(a, z, done) {
    const board = $('board'),
      layer = $('pops');
    if (
      globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ||
      !board.querySelector ||
      !layer
    ) {
      done();
      return;
    }
    clearTimeout(burstTimer);
    layer.innerHTML = '';
    const bounds = layer.getBoundingClientRect();
    for (const p of [a, z]) {
      const chip = board.querySelector('[data-chip="' + p + '"]');
      if (!chip) continue;
      chip.classList.add('popping');
      const rect = chip.getBoundingClientRect(),
        x = ((rect.left + rect.width / 2 - bounds.left) / bounds.width) * 100,
        y = ((rect.top + rect.height / 2 - bounds.top) / bounds.height) * 100,
        color = types[getState().board[p] - 1].color;
      let bits = '';
      for (let n = 0; n < 8; n++) {
        const angle = (n * Math.PI) / 4,
          distance = Math.max(17, rect.width * 0.55) + (n % 2) * 6;
        bits +=
          '<i class="pop-bit" style="--dx:' +
          Math.cos(angle) * distance +
          'px;--dy:' +
          Math.sin(angle) * distance +
          'px;--spin:' +
          n * 57 +
          'deg;--delay:' +
          (n % 2) * 20 +
          'ms"></i>';
      }
      layer.innerHTML +=
        '<div class="pop-burst" style="left:' +
        x +
        '%;top:' +
        y +
        '%;--pop-color:' +
        color +
        '"><span class="pop-ring"></span>' +
        bits +
        '</div>';
    }
    setTimeout(done, animTiming.popChip);
    // Confetti bits start up to 20ms late; leave a little room after the slowest part.
    burstTimer = setTimeout(
      () => {
        layer.innerHTML = '';
      },
      Math.max(animTiming.popConfetti + 20, animTiming.popRing) + 80,
    );
  }

  return { clearWire, draw, popPair };
}
