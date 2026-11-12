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
    // The wire leaps off the middle of the first chip's facing edge and lands on the middle
    // of the second chip's edge, instead of running from center to center.
    const half = path.map((p) => {
      const rect = grid.children?.[p]?.getBoundingClientRect?.();
      return bounds?.width && bounds?.height && rect
        ? [(rect.width / 2 / bounds.width) * 100, (rect.height / 2 / bounds.height) * 100]
        : [100 / 12, 100 / 12];
    });
    // Wires run straight, so move only along the main direction (tiny rounding differences
    // on the other axis would otherwise push the end onto a corner).
    const toEdge = (i, j) => {
      const dx = coords[j][0] - coords[i][0],
        dy = coords[j][1] - coords[i][1];
      return Math.abs(dx) >= Math.abs(dy)
        ? [coords[i][0] + Math.sign(dx) * half[i][0], coords[i][1]]
        : [coords[i][0], coords[i][1] + Math.sign(dy) * half[i][1]];
    };
    if (coords.length > 1) {
      const last = coords.length - 1,
        start = toEdge(0, 1),
        end = toEdge(last, last - 1);
      coords[0] = start;
      coords[last] = end;
    }
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
  /** A ring and eight confetti bits flying out from the middle of a chip. */
  function burstMarkup(chip, bounds, color, extra = '') {
    const rect = chip.getBoundingClientRect(),
      x = ((rect.left + rect.width / 2 - bounds.left) / bounds.width) * 100,
      y = ((rect.top + rect.height / 2 - bounds.top) / bounds.height) * 100;
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
    return (
      '<div class="pop-burst ' +
      extra +
      '" style="left:' +
      x +
      '%;top:' +
      y +
      '%;--pop-color:' +
      color +
      '"><span class="pop-ring"></span>' +
      bits +
      '</div>'
    );
  }
  /** When covers break, burst themed bits (ice shards, paper, shell) from those chips. */
  function coverBurst(cells, color) {
    const board = $('board'),
      layer = $('pops');
    if (
      !cells.length ||
      globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ||
      !board.querySelector ||
      !layer?.insertAdjacentHTML
    )
      return;
    const bounds = layer.getBoundingClientRect();
    let html = '';
    for (const p of cells) {
      const chip = board.querySelector('[data-chip="' + p + '"]');
      if (chip) html += burstMarkup(chip, bounds, color, 'cover-burst');
    }
    layer.insertAdjacentHTML('beforeend', html);
    setTimeout(() => {
      for (const el of layer.querySelectorAll('.cover-burst')) el.remove();
    }, animTiming.popConfetti + 120);
  }
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
      layer.innerHTML += burstMarkup(chip, bounds, types[getState().board[p] - 1].color);
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

  return { clearWire, draw, popPair, coverBurst };
}
