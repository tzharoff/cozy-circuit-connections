/** Charges (lives) and Chip Coins: pure rules with no DOM, storage, or clock of their own. */

export const MAX_CHARGES = 5;
export const REFILL_MS = 30 * 60 * 1000;
/** Placeholder until prices are chosen (see docs/GAME_DESIGN.md). */
export const RECHARGE_PRICE = 20;
/** Placeholder price of one hint after the free one each level. */
export const HINT_PRICE = 10;
/** Placeholder: there is no shop yet, so new players start with enough for a few Recharges. */
export const STARTING_CHIP_COINS = 60;

/** A full battery. `since` is when the current refill began; null while full. */
export const fullCharges = () => ({ count: MAX_CHARGES, since: null });

/** Cleans a saved value; anything unreadable becomes a full battery. */
export function validCharges(raw) {
  if (!raw || !Number.isInteger(raw.count) || raw.count < 0) return fullCharges();
  if (raw.count >= MAX_CHARGES) return fullCharges();
  return { count: raw.count, since: Number.isFinite(raw.since) ? raw.since : null };
}

/** Adds every Charge that has refilled by `now`. */
export function settle(charges, now) {
  const c = validCharges(charges);
  if (c.count >= MAX_CHARGES) return fullCharges();
  // A missing or future start time (clock moved back) restarts the refill from now.
  let since = c.since === null || c.since > now ? now : c.since;
  const gained = Math.floor((now - since) / REFILL_MS);
  const count = Math.min(MAX_CHARGES, c.count + gained);
  if (count >= MAX_CHARGES) return fullCharges();
  return { count, since: since + gained * REFILL_MS };
}

/** Milliseconds until the next Charge refills; 0 when full. */
export function untilNext(charges, now) {
  const c = settle(charges, now);
  return c.since === null ? 0 : c.since + REFILL_MS - now;
}

/** Spends one Charge, or returns null when the battery is empty. */
export function spendCharge(charges, now) {
  const c = settle(charges, now);
  if (c.count < 1) return null;
  return { count: c.count - 1, since: c.since ?? now };
}

/** "12:30" style countdown, rounded up to the next second. */
export function clock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
