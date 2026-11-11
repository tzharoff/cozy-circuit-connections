/** Inline artwork for the Charges battery and Chip Coins (see docs/GAME_DESIGN.md). */

/** The battery counter: the count is printed on the battery, and the cells fill to match.
 * At zero it turns gray and shows an orange spark instead of cells. */
export function batteryIcon(count, max = 5) {
  const empty = count < 1;
  const body = empty ? ['#e6dfd2', '#8a8174'] : ['#effff6', '#2f7d55'];
  let inside = '';
  if (empty) {
    inside =
      '<path class="battery-spark" d="M80 9 63 35h12l-7 21 21-28H77Z" fill="#ffb066" stroke="#c4602a" stroke-width="3" stroke-linejoin="round"/>';
  } else {
    for (let i = 0; i < max; i++)
      inside +=
        '<rect x="' +
        (12 + i * 20) +
        '" y="12" width="16" height="40" rx="4" fill="' +
        (i < count ? '#a7e6a0' : '#d7eedd') +
        '"/>';
  }
  return (
    '<svg class="battery-art' +
    (empty ? ' battery-empty' : '') +
    '" viewBox="0 0 132 64" aria-hidden="true">' +
    '<rect x="4" y="4" width="112" height="56" rx="14" fill="' +
    body[0] +
    '" stroke="' +
    body[1] +
    '" stroke-width="5"/><rect x="116" y="21" width="11" height="22" rx="4" fill="' +
    body[1] +
    '"/>' +
    inside +
    '<text x="' +
    (empty ? 38 : 60) +
    '" y="45" text-anchor="middle" font-size="34" font-weight="700" fill="' +
    (empty ? '#6e6557' : '#1d4d35') +
    '" stroke="' +
    (empty ? '#e6dfd2' : '#effff6') +
    '" stroke-width="6" paint-order="stroke">' +
    count +
    '</text></svg>'
  );
}

/** A Chip Coin: gold, with an inner ring, bitcoin-style bars at the top and bottom, and a
 * plain medium C. The small version (price tags, counters) drops the ring and bars. */
export function chipCoinIcon(small = false) {
  if (small)
    return '<svg class="coin-art" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="#f6c94a" stroke="#c98a1a" stroke-width="8"/><path d="M75 44A21 21 0 1 0 75 76" fill="none" stroke="#7a4c06" stroke-width="15" stroke-linecap="round"/></svg>';
  return '<svg class="coin-art" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="62" r="50" fill="#c98a1a"/><circle cx="60" cy="58" r="50" fill="#f6c94a"/><circle cx="60" cy="58" r="41" fill="none" stroke="#e0a92e" stroke-width="4"/><g fill="#7a4c06"><rect x="52" y="12" width="5" height="12" rx="2"/><rect x="63" y="12" width="5" height="12" rx="2"/><rect x="52" y="92" width="5" height="12" rx="2"/><rect x="63" y="92" width="5" height="12" rx="2"/></g><path d="M72 46A17 17 0 1 0 72 70" fill="none" stroke="#7a4c06" stroke-width="9" stroke-linecap="round"/><ellipse cx="40" cy="32" rx="9" ry="5" fill="#fff3c4" opacity=".7" transform="rotate(-30 40 32)"/></svg>';
}
