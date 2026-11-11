# Gameplay, economy, and event design

Last updated: November 10, 2026.

This is the working design record for Cozy Circuit Connections. It distinguishes decisions made in discussion from implemented features and unresolved details. Toon Blast was a reference for release/event cadence; this document does not claim to describe that game's exact rules.

## What exists today

The prototype has Level 0, 12 campaign stages played strictly in order, Endless mode (reached after the last stage), six board shapes, single shields, walls, hints, undo, restart, saved local progress, win screens, and a no-moves recovery screen. It has no lives, economy, purchases, timed events, accounts, groups, or race services. Undo and free restarts are still in the code; the decisions below describe changes to make later.

## Characters: the Chip’ums

Decided November 11, 2026. The six component characters (Resistor, Power, Logic, Crystal, Signal, Capacitor) are called **Chip’ums**, as in "chip chums". The game itself does not have a final name yet.

- **Spelling:** on screen, "Chip’ums" with a curly apostrophe (singular "Chip’um"). In code, filenames, URLs, and asset names, `chipums` with no apostrophe. Store keywords should include Chip’ums, Chip'ums, and Chipums.
- **Merchandise:** the Chip’ums are intended for plush toys and 3D-printed figures later. Keep each design merch-friendly: a simple, readable silhouette, flat color areas, the shared face (dot eyes, small smile, blush), and the fixed palette in `src/data/definitions.js`. Treat silhouette or palette changes as brand changes, not quick tweaks.
- **Before launch or merch:** run a trademark search on "Chip’ums", and consider individual names for each Chip’um.

## Progression and stars

Decided November 11, 2026, following Toon Blast's model.

- **Forward only.** Players never choose or replay old levels. The next level is always the first uncleared stage, so the main screen only needs to show that level and a **Play** button. There is no level select, no replay, and no tutorial replay; the How to play sheet covers the rules.
- **Home screen**, after Toon Blast's: a fun scene (the chip crew on a workbench), challenge columns down the left and right sides, and one big **Play** button showing the next level. The side columns are reserved for challenge icons and stay empty until events exist (and again whenever every challenge is cleared). New players go straight into the tutorial; everyone else opens on home.
- **Continue** on the clear card (and its close button) returns home; **Play** starts the next uncleared stage, resumes a board left mid-level, or plays Endless once every stage is cleared. The in-game menu's **Home** button returns home without losing the board.
- **Stars are a collectible, not a rating.** Clearing a level earns stars toward collection goals such as "Earn stars" challenges. There is no per-level star grade and no reason to replay for more. The clear card shows three stars as celebration; the number earned per clear is not chosen yet.
- Forward-only progress also protects first-try and collection events from farming easy, already-cleared boards.

Implemented: forward-only progression, the home screen with empty challenge columns, and the Continue/Play flow. Not implemented: earning, storing, or displaying a star total.

## Agreed gameplay and recovery direction

- Keep the two-click pair-matching game, wire effects, and chip pop effects.
- Use shields, walls, board layouts, and future level modifiers to create challenge. Add mechanics one at a time.
- Add double shields as progression increases. The proposed visual treatment is cracked armor and a remaining-hit badge.
- No general move limit. Successful moves remove pairs, so a move budget would not provide a meaningful challenge.
- A dead end means chips remain and there is no legal, unshielded matching pair with a valid route.
- Remove undo from normal gameplay. This replaces the earlier unlimited-undo plan.
- The stuck pop-up should offer **Restart**, **Shield Breaker**, and **Cancel**.
- Choosing **Restart** costs one life. Reaching a dead end or choosing **Cancel** does not spend a life.
- Cancel closes the pop-up so the player can inspect the board; the board remains stuck until recovered or restarted.
- A Shield Breaker removes one shield layer from a selected chip. It is bought with premium currency, and challenge rewards can also award Shield Breakers.
- Do not use the previously proposed single-chip or row/column clear tools. Removing unmatched pieces can create orphaned partners.

No currency, life, or item balance has been chosen. The current recovery screen has not yet been changed to enforce these new rules.

## Economy and monetization direction

| Item or system   | Decision                                                                                | Still to define                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Lives            | Restarting a level spends one life                                                      | Starting amount, maximum, refill timing, ways to earn/buy lives, zero-life behavior, confirmation flow |
| Premium currency | Can purchase Shield Breakers; can be earned from challenge rewards                      | Name, prices, purchase packs, balances, caps, and other uses                                           |
| Shield Breakers  | Remove one layer from a chosen shield; available through currency and challenge rewards | Shop/inventory flow, whether to buy-and-use or store items, behavior when no helpful target exists     |
| Hints            | Part of the monetization plan, including optional rewarded ads for extra hints          | Free allowance, refill rules, prices, and rewards                                                      |
| Cosmetics        | Sell component art, board themes, wire effects, and pop effects                         | Pack contents, unlock requirements, direct purchase versus currency pricing                            |
| Ads              | Optional rewarded ads; no interruptions during a board                                  | Specific placements, rewards, availability, consent and store integration                              |

No payment or ad integration is implemented. Premium currency is now an agreed part of the Shield Breaker plan, superseding the earlier idea to begin with direct cosmetic purchases only. Optional tools such as shuffle, demolition, and auto-connect were discussed but are not committed features.

## Reward and release schedules

| Cadence       | Planned activity                                   | Reward/progress behavior                                                                 |
| ------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Daily         | Daily rewards                                      | Exact claim requirement and reward table are not chosen                                  |
| Every 3 days  | A rotating timed challenge ladder                  | Reach progressively harder milestones for better rewards                                 |
| Weekly        | Challenge/competition rotation                     | Featured accumulation metric can change: stars, cleared levels, or another stat          |
| Every 2 weeks | New campaign levels and a seasonal content refresh | Reset Endless level numbering to 1; use the release window to add/change level modifiers |

The ladder pattern is **do X → claim reward A → reach a higher target → claim a better reward**, within an event timer. Currency, Shield Breakers, and cosmetics are potential rewards. Amounts and thresholds are not yet balanced.

Permanent campaign progress, owned items, and claimed rewards should remain separate from seasonal/event counters. The exact reset boundaries, timezone, treatment of ongoing boards, and unclaimed rewards still need approval. Daily, three-day, weekly, and two-week periods should not be assumed to reset the same data.

## Challenge examples to support

| Challenge                    | Example target                           | Counting questions                                                                                              |
| ---------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Collect a component type     | 100 Power (POW) or 50 Signal (SIG) chips | Count individual chips, not pairs; decide whether only cleared boards qualify                                   |
| Beat levels on the first try | 10 first-try clears                      | Define an attempt and whether using a Shield Breaker disqualifies it                                            |
| Break shields                | 100 shields                              | Decide whether the objective counts layers removed, chips fully freed, or provides separate objectives for each |
| Clear levels                 | An event-specific target                 | Decide eligibility for Endless, tutorial, and event boards (campaign replays no longer exist)                   |
| Earn stars                   | An event-specific target                 | Stars are collected per clear, not graded; choose how many each clear awards                                    |

These are design examples, not final reward tables. Power is currently labeled **PWR** in the prototype, while the discussion used **POW**; settle the display code before adding event copy.

## Groups and races

Add a social layer in which players join groups and compete for different reward tiers.

- Individual races can place players into a competition pool.
- Groups can contribute toward shared goals or race other groups.
- Race rewards can vary by placement and/or milestones.
- Race objectives use accumulated gameplay stats.

Examples requested:

- Who clears the most levels in **60 minutes**?
- Who breaks the most shields in **60 minutes**?

Other candidates are specific component collections and first-try clears. Shared timing, group size, matchmaking, ties, minimum participation, scoring eligibility, and disconnected/late players remain to be specified.

Use only eligible actions during the race window. Prevent replaying easy boards or duplicate submissions from farming event points. These are proposed integrity rules to finalize when implementing the race service.

## Foundation needed before events

Define and record gameplay events rather than incrementing unrelated counters inside each screen. Suggested events:

| Event                          | Useful fields                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Attempt started                | Player, board/level identity, mode, attempt identity, start time, content version |
| Pair cleared                   | Unique action identity, component type, chips collected, attempt identity         |
| Shield layer removed           | Action identity, layer count, affected chip, source (match or power-up)           |
| Level cleared                  | Attempt identity, first-try status, mode, star result once defined                |
| Level restarted                | Attempt identity, life transaction identity                                       |
| Item/currency awarded or spent | Transaction identity, amount, source, event/reward identity                       |
| Reward claimed                 | Player, event occurrence, milestone identity, transaction identity                |

These are implementation recommendations, not a finalized API. Keep collected chips, removed layers, and fully freed chips as separate raw facts so challenge rules can distinguish them later.

Real shared events and purchases need accounts, authoritative time, durable balances, once-only reward claims, validated results, and leaderboards on a backend. Browser localStorage is fine for the prototype, but cannot securely enforce shared competition or paid balances. No backend vendor is selected.

## Suggested implementation order

1. Preserve the current playable build and continue mobile preparation with Capacitor when ready.
2. Define stat counting and attempts; add gameplay-stat tracking without changing rewards yet.
3. Add and test double shields and additional handcrafted difficulty.
4. Finalize life/refill rules and Shield Breaker purchase/targeting rules; implement the new recovery flow and remove undo.
5. Add account/storage/economy services with validated transactions.
6. Add daily rewards and the three-day ladder, then weekly challenges and two-week rotation.
7. Add groups, 60-minute races, matchmaking, and leaderboards.

This is a dependency-based recommendation, not approval to implement all features at once. The broader project sequence remains: finish Doom Scrolling, return to this game, then make a third game.

## Open decisions checklist

- Life balances, refill/earning/purchase rules, zero-life behavior, and restart confirmation.
- Shield Breaker price, inventory/target selection, and what to offer when no shield can recover the board.
- Whether restarts outside the dead-end pop-up also spend a life and whether tutorials are exempt.
- First-try definition; stars earned per clear; chip, shield-layer, and freed-chip counting.
- Daily reward qualification/streaks and final reward tables for all events.
- Event/reset timezone, overlap, countdown rules, in-progress attempts, and unclaimed rewards.
- Number and difficulty of new levels each two-week release; seasonal content versioning.
- Group membership limits, race entry, matching, rewards, ties, and anti-farming rules.
- Backend, accounts, syncing, purchases, ads, and platform integration choices.

Update this document as each decision is made, and mark a feature implemented only when its code and checks exist.
