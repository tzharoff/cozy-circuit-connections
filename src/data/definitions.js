import { authoredLevels } from './authored-levels.js';
/** Chip’um identities (the component characters), board shapes, campaign stages, and tutorial lessons. */
export const types = [
  { symbol: 'Ω', name: 'Resistor', color: '#e4c88d' },
  { symbol: '⏻', name: 'Power', color: '#9ce5b8' },
  { symbol: '⊕', name: 'Logic', color: '#a8c7ed' },
  { symbol: '◇', name: 'Crystal', color: '#c8b1e5' },
  { symbol: '∿', name: 'Signal', color: '#eeafa1' },
  { symbol: 'Ⅱ', name: 'Capacitor', color: '#a6d8d3' },
];

export const shapes = {
  classic: {
    name: 'Classic',
    rows: ['######', '######', '######', '######', '######', '######'],
    note: 'The original full board. Open your own routes.',
  },
  ring: {
    name: 'Ring',
    rows: ['######', '######', '##..##', '##..##', '######', '######'],
    note: 'An open center gives wires a second way around.',
  },
  cross: {
    name: 'Cross',
    rows: ['..##..', '..##..', '######', '######', '..##..', '..##..'],
    note: 'Four arms meet at a crowded center.',
  },
  islands: {
    name: 'Islands',
    rows: ['##..##', '##..##', '......', '......', '##..##', '##..##'],
    note: 'Four chip clusters share wide open wire lanes.',
  },
  bridge: {
    name: 'Bridge',
    rows: ['##..##', '##..##', '######', '######', '##..##', '##..##'],
    note: 'Two banks joined by a dense central bridge.',
  },
  steps: {
    name: 'Staircase',
    rows: ['####..', '####..', '.####.', '.####.', '..####', '..####'],
    note: 'Offset edges create a different set of corners.',
  },
};

export const lessons = [
  {
    name: 'Meet your first pair',
    tip: 'Tap either glowing resistor Chip’um, then its twin. The spark will travel between them.',
    chips: [
      [26, 1],
      [29, 1],
    ],
    walls: [],
    shields: [],
  },
  {
    name: 'A little bend',
    tip: 'These batteries are on different rows. Match them and watch the wire turn a corner. A wire can bend up to twice.',
    chips: [
      [18, 2],
      [36, 2],
    ],
    walls: [],
    shields: [],
  },
  {
    name: 'Free a friend',
    tip: 'Gold stripes mean a chip is shielded. First match the two crystals directly beside it to break the shield. Then match the freed logic chips.',
    chips: [
      [18, 4],
      [19, 4],
      [26, 3],
      [29, 3],
    ],
    walls: [],
    shields: [26],
  },
  {
    name: 'Go around the wall',
    tip: 'This metal wall blocks the straight route. Match the signal Chip’ums: the wire can go around the wall with two bends.',
    chips: [
      [26, 5],
      [29, 5],
    ],
    walls: [27],
    shields: [],
  },
];

export const levels = [
  {
    name: 'First spark',
    shape: 'islands',
    pairs: 4,
    shields: 0,
    walls: 0,
    tip: 'Match two identical Chip’ums. Wires can turn up to twice.',
  },
  {
    name: 'Island hopping',
    shape: 'islands',
    pairs: 8,
    shields: 0,
    walls: 0,
    tip: 'Use the open lanes between the four islands.',
  },
  {
    name: 'Around the bend',
    shape: 'ring',
    pairs: 12,
    shields: 0,
    walls: 0,
    tip: 'Use the center opening. Cables must stay inside the board boundary.',
  },
  {
    name: 'Full house',
    shape: 'classic',
    pairs: 18,
    shields: 0,
    walls: 0,
    tip: 'Start at the edges and make room in the middle.',
  },
  {
    name: 'Under cover',
    shape: 'cross',
    pairs: 10,
    shields: 2,
    walls: 0,
    tip: 'Clear a pair beside a gold-striped chip to break its shield.',
  },
  {
    name: 'Bridge crew',
    shape: 'bridge',
    pairs: 14,
    shields: 4,
    walls: 0,
    tip: 'Free shielded chips while opening routes across the bridge.',
  },
  {
    name: 'Step by step',
    shape: 'steps',
    pairs: 12,
    shields: 6,
    walls: 0,
    tip: 'Choose nearby matches to free the shielded Chip’ums.',
  },
  {
    name: 'Roadblocks',
    shape: 'ring',
    pairs: 16,
    shields: 0,
    walls: 2,
    tip: 'Hazard-striped walls block wires. Find a route around them.',
  },
  {
    name: 'Narrow passage',
    shape: 'bridge',
    pairs: 14,
    shields: 0,
    walls: 4,
    tip: 'The walls stay put. Empty chip sockets become new routes.',
  },
  {
    name: 'Crossed wires',
    shape: 'cross',
    pairs: 10,
    shields: 4,
    walls: 4,
    tip: 'Open a route and free a shield. Plan which pair to clear first.',
  },
  {
    name: 'Up the circuit',
    shape: 'steps',
    pairs: 12,
    shields: 6,
    walls: 4,
    tip: 'Put your routing and shield-breaking skills together.',
  },
  {
    name: 'Power restored',
    shape: 'classic',
    pairs: 14,
    shields: 6,
    walls: 4,
    tip: 'One final full board. Bring the whole machine back online.',
  },
].map((spec, index) => {
  const authored = authoredLevels[index + 1];
  return authored ? { ...spec, name: authored.name, tip: authored.tip } : spec;
});
// Additional authored stages must be contiguous (13, then 14, and so on).
for (let stage = levels.length + 1; authoredLevels[stage]; stage++) {
  const level = authoredLevels[stage];
  levels.push({
    name: level.name,
    tip: level.tip,
    shape: 'classic',
    pairs: level.board.filter(Boolean).length / 2,
    shields: level.shields.filter(Boolean).length,
    walls: level.walls.filter(Boolean).length,
  });
}
