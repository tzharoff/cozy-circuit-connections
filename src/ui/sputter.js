/** The failed card's broken edge spark: it starts somewhere random, runs a short way while
 * flickering, dies, sometimes pops a small zigzag zap, and tries again 0.5–2s later. */
export function createSputter({ head, zap }) {
  let running = false,
    timer = null,
    runs = [];
  const later = (fn, ms) => (timer = setTimeout(fn, ms));
  function zapAt(position) {
    if (!head.getTotalLength || !head.getPointAtLength || !zap.animate) return;
    const point = head.getPointAtLength((position / 100) * head.getTotalLength());
    zap.setAttribute(
      'transform',
      'translate(' + point.x + ' ' + point.y + ') rotate(' + Math.round(Math.random() * 360) + ')',
    );
    runs.push(
      zap.animate(
        [
          { opacity: 0 },
          { opacity: 1, offset: 0.15 },
          { opacity: 0.2, offset: 0.4 },
          { opacity: 1, offset: 0.55 },
          { opacity: 0 },
        ],
        { duration: 380 },
      ),
    );
  }
  function sputter() {
    if (!running || !head.animate) return;
    const from = Math.random() * 100,
      length = 6 + Math.random() * 14,
      run = head.animate(
        [
          { strokeDashoffset: -from, opacity: 0 },
          { opacity: 1, offset: 0.12 },
          { opacity: 0.25, offset: 0.35 },
          { opacity: 1, offset: 0.5 },
          { opacity: 0.4, offset: 0.72 },
          { strokeDashoffset: -(from + length), opacity: 0 },
        ],
        { duration: 450 + Math.random() * 450, easing: 'ease-out' },
      );
    runs = [run];
    run.onfinish = () => {
      if (!running) return;
      if (Math.random() < 0.4) zapAt((from + length) % 100);
      later(sputter, 500 + Math.random() * 1500);
    };
  }
  function stop() {
    running = false;
    clearTimeout(timer);
    for (const run of runs) run?.cancel?.();
    runs = [];
  }
  /** Starts after `delay` ms (so the card lands first); does nothing with reduced motion. */
  function start(delay = 0) {
    stop();
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    running = true;
    later(sputter, delay);
  }
  return { start, stop };
}
