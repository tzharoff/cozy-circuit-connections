/** Save shape validation and a plain-data snapshot helper. */
export const clone = (value) => JSON.parse(JSON.stringify(value));
export function valid(s) {
  return (
    s &&
    Number.isFinite(s.seed) &&
    Number.isInteger(s.score) &&
    Array.isArray(s.history) &&
    Array.isArray(s.board) &&
    Array.isArray(s.initial) &&
    s.board.length === 64 &&
    s.initial.length === 64 &&
    s.board.every(
      (v, i) =>
        Number.isInteger(v) &&
        v >= 0 &&
        v <= 6 &&
        (i < 8 || i >= 56 || i % 8 === 0 || i % 8 === 7 ? v === 0 : true),
    )
  );
}
