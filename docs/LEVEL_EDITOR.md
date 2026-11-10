# Level Workshop

The workshop is a developer tool, separate from player progress and currency.

## Open it

Run `npm ci`, then `npm run dev`, and open `/editor.html` on the printed local URL. Production builds include the game and editor.

For an offline copy, run `npm run export` and open `exports/Cozy Circuit Connections - Level Editor.html`.

## Build a puzzle

1. Load a campaign stage, create a blank board, or apply one of the six empty shapes.
2. Select a component brush and paint matching chips in the inner 6×6 area. Each component count must be even.
3. Toggle a single shield on a chip, or paint walls, floor sockets, and open wire lanes inside the 6×6 board. Cables cannot leave its boundary. The former outside cells are neither shown nor editable.
4. Use edit undo/redo while experimenting. Erase removes a chip/shield/wall while preserving the floor underneath.
5. Read **Board check** for placement, pair-count, and opening-move errors. **Check for a solution** attempts a complete legal clear sequence. A search timeout means unknown, not impossible.
6. Press **Test level** to use the real rules, shields, walls, spark, and pop. Test undo, restart, and hints help inspect a puzzle. **Back to editing** restores the unmodified draft.

The solver does not guarantee every move order wins or rate difficulty. Double shields and new hazards must wait until the engine supports them.

## Save and share

- The current draft autosaves separately from game progress.
- **Save to shelf** stores a level in this browser. Saving the same ID asks before replacing it.
- **Download level JSON** is the portable backup/share format. Incomplete but structurally valid drafts can be backed up too.
- Import JSON from a file, or use **Show current JSON**, edit the text, and **Apply JSON below**.
- Shelf/draft storage is local to this browser and origin. It is not a GitHub commit or cloud backup. Download files before changing machines or clearing browser data.

## Use a level in the campaign

Set **Campaign stage** to an existing number, or the next number after the current campaign. Initially that means 1–12 for replacements or 13 for an addition.

Press **Export campaign override**. It downloads `authored-levels.js`, merging this level with overrides bundled into the current editor build. Replace `src/data/authored-levels.js`, then run `npm test` and `npm run build` or `npm run export`. Review and commit the change to publish it. Shelf saves alone never change campaign source.

Added stages must be contiguous: add stage 13 before 14. Generated stages retain their deterministic behavior unless overridden. Authored names, tips, chips, shields, masks, and walls are used exactly as exported.

For several stages, apply the exported project file and reload/rebuild the editor before exporting another. Exports merge project overrides, not unrelated shelf drafts. Review the diff before replacing newer project overrides with a file from an older editor build.

Existing saves may contain an old in-progress stage; replaying it loads its new definition. A broader live-content migration policy remains future work.

## JSON format, version 1

| Field               | Meaning                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| `schemaVersion`     | Must be `1`                                                               |
| `id`, `name`, `tip` | Editor ID, display name, player guidance                                  |
| `campaignStage`     | Optional target stage                                                     |
| `board`             | 64 row-major component IDs; 0 empty, 1–6 use the existing component order |
| `shields`           | 64 single-layer flags, 0 or 1                                             |
| `walls`             | 64 permanent wall flags, 0 or 1                                           |
| `mask`              | 64 booleans for visible chip-floor sockets                                |

The data retains 8×8 indices for save compatibility, but only rows/columns 1–6 are shown or routable. The 28 outside cells are inert padding. Older imported walls in that padding are discarded. Empty cells inside the boundary carry wires regardless of whether their floor is visible. Imported JSON is validated and never executed as code.
