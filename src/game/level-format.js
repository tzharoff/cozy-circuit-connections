import { types } from '../data/definitions.js';

export const LEVEL_SCHEMA_VERSION = 1;
const arrayOf = (value, check) => Array.isArray(value) && value.length === 64 && value.every(check);
const interior = (i) => i >= 8 && i < 56 && i % 8 > 0 && i % 8 < 7;

/** Validate imported data before it can enter the editor, solver, or campaign. */
export function parseLevel(value) {
  if (!value || value.schemaVersion !== LEVEL_SCHEMA_VERSION)
    throw Error('Expected level schemaVersion 1.');
  if (typeof value.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value.id))
    throw Error('Level ID must use 1–80 letters, numbers, underscores, or hyphens.');
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 100)
    throw Error('Give the level a name of 1–100 characters.');
  if (typeof value.tip !== 'string' || value.tip.length > 500)
    throw Error('The tip must be at most 500 characters.');
  if (!arrayOf(value.board, (v) => Number.isInteger(v) && v >= 0 && v <= types.length))
    throw Error('board must contain 64 component IDs (0–6).');
  if (!arrayOf(value.shields, (v) => v === 0 || v === 1))
    throw Error(
      'shields must contain 64 values of 0 or 1. Double shields are not implemented yet.',
    );
  if (!arrayOf(value.walls, (v) => v === 0 || v === 1))
    throw Error('walls must contain 64 values of 0 or 1.');
  if (!arrayOf(value.mask, (v) => typeof v === 'boolean'))
    throw Error('mask must contain 64 true/false values.');
  for (let i = 0; i < 64; i++) {
    if (value.board[i] && (!interior(i) || !value.mask[i]))
      throw Error('Chips must be on floor cells inside the 6×6 playable area.');
    if (value.shields[i] && !value.board[i]) throw Error('A shield needs a chip underneath it.');
    if (value.walls[i] && (value.board[i] || value.shields[i]))
      throw Error('A wall cannot overlap a chip or shield.');
    if (value.mask[i] && !interior(i))
      throw Error('The outer border is a wire lane, not chip floor.');
  }
  const result = {
    schemaVersion: LEVEL_SCHEMA_VERSION,
    id: value.id,
    name: value.name.trim(),
    tip: value.tip,
    board: value.board.slice(),
    shields: value.shields.slice(),
    walls: value.walls.slice(),
    mask: value.mask.slice(),
  };
  if (value.campaignStage !== undefined) {
    if (
      !Number.isInteger(value.campaignStage) ||
      value.campaignStage < 1 ||
      value.campaignStage > 9999
    )
      throw Error('campaignStage must be an integer from 1 to 9999.');
    result.campaignStage = value.campaignStage;
  }
  return result;
}

export function levelState(value, stage) {
  const level = parseLevel(value);
  const result = {
    seed: 100000 + (stage || 0),
    shape: 'classic',
    customLevel: true,
    levelId: level.id,
    mask: level.mask.slice(),
    board: level.board.slice(),
    initial: level.board.slice(),
    shields: level.shields.slice(),
    initialShields: level.shields.slice(),
    walls: level.walls.slice(),
    history: [],
    score: 0,
    claimed: false,
  };
  if (stage !== undefined) result.stage = stage;
  return result;
}
