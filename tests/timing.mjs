import assert from 'node:assert/strict';
import { cleanTiming, timingDefaults, timingRanges, animTiming } from '../src/ui/timing.js';

// No browser storage here, so the live values are the shipped defaults.
assert.deepEqual(animTiming, timingDefaults);
// Every knob has a slider range that contains its default.
for (const [key, value] of Object.entries(timingDefaults)) {
  const [min, max] = timingRanges[key];
  assert(min <= value && value <= max, key);
}
// Saved tuning is clamped to the slider range; junk and unknown keys are ignored.
const cleaned = cleanTiming({ wireBase: 99999, popChip: -5, wireFade: 'slow', extra: 1 });
assert.equal(cleaned.wireBase, timingRanges.wireBase[1]);
assert.equal(cleaned.popChip, timingRanges.popChip[0]);
assert.equal(cleaned.wireFade, timingDefaults.wireFade);
assert(!('extra' in cleaned));
assert.deepEqual(cleanTiming(null), timingDefaults);
console.log('PASS: animation timing defaults, slider ranges, saved tuning clamped and cleaned');
