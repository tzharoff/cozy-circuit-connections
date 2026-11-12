# Direction and next steps

## Product direction

Cozy circuit puzzles with shield/wall-driven difficulty and no general move limit. Timed events add an optional competitive layer. The latest agreed design includes lives for restarting, premium-currency Shield Breakers, and rotating reward systems. These supersede the earlier unlimited-undo and direct-cosmetics-only plans.

The detailed record is [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md), including current implementation, decisions, open questions, and event examples.

## Current milestone

The guided Level 0, 19-stage campaign (13 and 14 add double shields; 15 and 16 are Bedtime levels; 17 to 19 use ice, gift, and egg covers), tutorial completion screen, and Stage Clear screen work. Existing matching, shields, walls, shape selection, hints, undo, wire animation, and pop effects are included.

Dead ends are possible, but uncommon and unevenly distributed across the current campaign. A dead end means chips remain with no legal pair. The implemented recovery dialog still offers undo and free restart, plus a persistent board notice. Saved dead ends are detected on reload. This is the prototype behavior, not the new lives/economy design.

## Held for later

- Define attempts and gameplay-stat counting, then record events consistently.
- Tune layouts and introduce other hazards one at a time (double shields are in).
- Finalize lives and Shield Breaker rules. Planned stuck pop-up: Restart (one Charge), Shield Breaker (Chip Coins or earned item), Cancel. At zero Charges, Restart becomes Recharge, paid in Chip Coins. Remove undo when implementing that system.
- Cosmetic packs and optional rewarded ads for hints/rewards; no interruptions during a board.
- Daily rewards, a timed ladder every three days, weekly challenges/competitions, and new campaign levels every two weeks with Endless numbering reset to 1.
- Groups and 60-minute races, including levels cleared and shields broken, with varying reward tiers.
- Add backend accounts, authoritative event timing, balances, validated progress, reward claims, and leaderboards before real shared competitions or purchases.

Charges (lives), the Charges card, and Recharge for Chip Coins are implemented with placeholder prices. A Chip Coin shop, purchases, Shield Breakers, double shields, events, groups, and race services are not implemented. Reward values, star scoring, Chip Coin prices, event boundaries, and matchmaking are still open; see the design record.

This game is now the next iOS/Android project. The Capacitor wrapper and native `android/` and `ios/` projects exist. Saves now live in native storage (Capacitor Preferences) with a one-time migration from the old localStorage keys; icons, splash, and portrait orientation are in. Next: safe areas, haptics, and Android back handling, then wider testing on real devices before store submission. Doom Scrolling and the other cabinet prototypes are outside this repository.
