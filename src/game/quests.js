/** Daily quests: three small goals a day that pay Chip Coins (see docs/GAME_DESIGN.md).
 * Pure rules with no DOM, storage, or clock of their own: callers pass today's date and the
 * events that happen in play. Progress only counts after a day's quests are dealt. */

/** Quest kinds, their target ranges [min, max, step], and placeholder Chip Coin rewards. */
export const QUEST_KINDS = {
  collect: { range: [16, 24, 2], reward: 15 },
  connect: { range: [30, 50, 5], reward: 15 },
  shield: { range: [6, 12, 2], reward: 20 },
  clear: { range: [2, 4, 1], reward: 20 },
  firstTry: { range: [1, 2, 1], reward: 25 },
};
export const QUESTS_PER_DAY = 3;

/** The local calendar day, like "2026-11-13"; quests change at local midnight. */
export function questDay(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

/** A small seeded random generator so a day always deals the same quests. */
function dayRandom(day) {
  let h = 2166136261;
  for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Deals a day's quests: three different kinds; "collect" names one Chip’um type (0-5). */
export function questsForDay(day, typeCount = 6) {
  const random = dayRandom(day),
    kinds = Object.keys(QUEST_KINDS);
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return kinds.slice(0, QUESTS_PER_DAY).map((kind) => {
    const [min, max, step] = QUEST_KINDS[kind].range,
      target = min + step * Math.floor(random() * ((max - min) / step + 1));
    const quest = { kind, target, reward: QUEST_KINDS[kind].reward, progress: 0, claimed: false };
    if (kind === 'collect') quest.type = Math.floor(random() * typeCount);
    return quest;
  });
}

/** Today's quests: the saved ones if they're from today, otherwise a fresh deal. */
export function questsToday(saved, day) {
  if (saved?.day === day && Array.isArray(saved.quests) && saved.quests.length) return saved;
  return { day, quests: questsForDay(day) };
}

/** Plain words for a quest, using the Chip’um names ("Collect 20 Lulos"). */
export function questLabel(quest, types) {
  const n = quest.target;
  switch (quest.kind) {
    case 'collect':
      return 'Collect ' + n + ' ' + types[quest.type].character + 's';
    case 'connect':
      return 'Make ' + n + ' connections';
    case 'shield':
      return 'Break ' + n + ' shields';
    case 'clear':
      return 'Clear ' + n + ' levels';
    default:
      return n === 1 ? 'Clear a level on the first try' : 'Clear ' + n + ' levels on the first try';
  }
}

export const questDone = (quest) => quest.progress >= quest.target;

/** Records something that happened in play; returns true if any quest moved.
 * Events: { connect: typeIndex } for a match (two chips of that type),
 * { shields: layers } for shield layers broken, { clear: true, firstTry } for a cleared board. */
export function questEvent(today, event) {
  let moved = false;
  for (const q of today.quests) {
    if (q.claimed || questDone(q)) continue;
    let add = 0;
    if (event.connect !== undefined) {
      if (q.kind === 'connect') add = 1;
      if (q.kind === 'collect' && q.type === event.connect) add = 2;
    }
    if (event.shields && q.kind === 'shield') add = event.shields;
    if (event.clear) {
      if (q.kind === 'clear') add = 1;
      if (q.kind === 'firstTry' && event.firstTry) add = 1;
    }
    if (add) {
      q.progress = Math.min(q.target, q.progress + add);
      moved = true;
    }
  }
  return moved;
}

/** Claims a finished quest; returns its Chip Coin reward, or 0 if it can't be claimed. */
export function claimQuest(today, index) {
  const q = today.quests[index];
  if (!q || q.claimed || !questDone(q)) return 0;
  q.claimed = true;
  return q.reward;
}
