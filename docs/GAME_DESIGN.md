# Gameplay, economy, and event design

Last updated: November 10, 2026.

This is the working design record for Cozy Circuit Connections. It distinguishes decisions made in discussion from implemented features and unresolved details. Toon Blast was a reference for release/event cadence; this document does not claim to describe that game's exact rules.

## What exists today

The prototype has Level 0, 12 campaign stages played strictly in order, Endless mode (reached after the last stage), six board shapes, single shields, walls, hints, undo, restart, saved local progress, win screens, and a no-moves recovery screen. It has no lives, economy, purchases, timed events, accounts, groups, or race services. Undo and free restarts are still in the code; the decisions below describe changes to make later.

## Characters: the Chip’ums

Decided November 11, 2026. The six component characters are called **Chip’ums**, as in "chip chums". The game itself does not have a final name yet.

The working cast (names are shown in How to play; the type names are used in tips and labels):

| Chip’um             | Look                        | Personality hook                          |
| ------------------- | --------------------------- | ----------------------------------------- |
| Ralph the Resistor  | Orange, striped "comb-over" | Dapper and serious about his job          |
| Bastion the Battery | Green, with + and –         | Sturdy and dependable; stores the energy  |
| Lulo the Logic      | Blue robot with an antenna  | The thinker                               |
| Quinn the Quartz    | Purple cut gem              | Sparkly and a little mysterious           |
| Sherry the Signal   | Pink, with an antenna       | Chatty; always broadcasting               |
| Carly the Capacitor | Teal, with a round cap      | Friendly; keeps a little charge for later |

The Battery and Quartz types were renamed from Power and Crystal so names and types alliterate. Saves store each type's position, not its name, so the renames do not affect progress; never reorder the types.

- **Spelling:** on screen, "Chip’ums" with a curly apostrophe (singular "Chip’um"). In code, filenames, URLs, and asset names, `chipums` with no apostrophe. Store keywords should include Chip’ums, Chip'ums, and Chipums.
- **Merchandise:** the Chip’ums are intended for plush toys and 3D-printed figures later. Keep each design merch-friendly: a simple, readable silhouette, flat color areas, the shared face (dot eyes, small smile, blush), and the fixed palette in `src/data/definitions.js`. Treat silhouette or palette changes as brand changes, not quick tweaks.
- **Before launch or merch:** run a trademark search on "Chip’ums", and consider individual names for each Chip’um.

## Progression and stars

Decided November 11, 2026, following Toon Blast's model.

- **Forward only.** Players never choose or replay old levels. The next level is always the first uncleared stage, so the main screen only needs to show that level and a **Play** button. There is no level select, no replay, and no tutorial replay; the How to play sheet covers the rules.
- **Home screen**, after Toon Blast's: a fun scene (the chip crew on a workbench), challenge columns down the left and right sides, and one big **Play** button showing the next level. The side columns are reserved for challenge icons and stay empty until events exist (and again whenever every challenge is cleared). New players go straight into the tutorial; everyone else opens on home.
- **Continue** on the clear card (and its close button) returns home: the card dips, then flies up off the top of the screen as home appears underneath. Every card (clear, failed, Charges, and confirm) leaves this way when dismissed; with reduced motion they just close; **Play** starts the next uncleared stage, resumes a board left mid-level, or plays Endless once every stage is cleared. The in-game menu's **Home** button returns home without losing the board.
- **Stars are a collectible, not a rating.** Clearing a level earns stars toward collection goals such as "Earn stars" challenges. There is no per-level star grade and no reason to replay for more. The clear card shows three stars as celebration; the number earned per clear is not chosen yet.
- Forward-only progress also protects first-try and collection events from farming easy, already-cleared boards.

Implemented: forward-only progression, the home screen with empty challenge columns, and the Continue/Play flow. Not implemented: earning, storing, or displaying a star total.

## Failed card

Approved November 11, 2026, to replace the old "No moves left" stuck dialog (whose Restart button text is currently unreadable). It is a broken version of the level clear card, so the two read as a pair:

- **Same structure** as the clear card (`level-card` styles): heading "Level N" (or "Tutorial"/"Endless"), cream body, one big button, round icon buttons below. Keep the existing IDs `stuckDialog`, `stuckRestart`, `stuckUndo`, `stuckReview`, `stuckTitle` so tests and handlers carry over.
- **Body:** a frazzled Chip’um instead of stars (`componentIcon(type, 'fried')` already exists: X eyes, wobbly mouth, soot), grayed slightly with a smoke puff; "Short circuit!" and "No pairs can connect."
- **Buttons:** big **Restart** in warm orange (not the win card's mint); round **Undo** and **Look** (eye) icon buttons. Look closes the card to inspect the board.
- **Burnt corner:** top-right corner scorched (dark radial burn), a jagged charred notch, and small smoke wisps rising.
- **Sputtering spark:** instead of the smooth loop, the edge spark starts at a random point, runs a short way, flickers, dies, sometimes pops a small zigzag zap, then restarts elsewhere after 0.5–2s. Stop when the card closes.
- **Clunk landing:** drops in like the clear card but with no springy squash: it thuds and wobbles side to side, like a dropped toy.
- **Reduced motion:** keep the burn and fried Chip’um; skip the sputter, smoke, and wobble.

Implemented November 11, 2026. The fried Chip’um is a type still on the stuck board. Restart shows its Charge cost as a small battery cell with "−1" when it costs one, and becomes **Recharge** at zero Charges (see Charges below). The sputtering spark lives in `src/ui/sputter.js`; the in-board "No moves left" notice with its Options button is unchanged.

## Lives: Charges

Decided November 11, 2026. Lives are **Charges**, shown as a battery instead of hearts.

- **Counter:** a battery icon whose number is printed on the battery itself, so the count is readable at a glance. The cells inside fill or empty to match how many Charges are left.
- **Refill wording:** the battery "recharges" over time ("Recharging 12:30"; "Full" at the maximum). This fits Bastion the Battery, who stores the energy, and Carly the Capacitor, who keeps a little charge for later; either can appear on refill or out-of-Charges screens.
- **Restart cost:** the failed card's Restart button shows its cost as one battery cell ("−1").
- **Empty battery:** at zero Charges the battery shows the spark graphic in a different color (color not chosen), so it reads as drained rather than broken. The failed card's Restart button becomes **Recharge**, which asks to spend Chip Coins to refill.
- **Numbers:** 5 Charges at most (and to start), refilling one Charge every 30 minutes.
- **Recharge:** offered only at zero Charges, and always refills the battery to full. It costs Chip Coins.
- **Which restarts cost a Charge:** restarting a campaign level after making at least one match, from the failed card or the Restart button. The tutorial, Endless (New board is free anyway), an untouched board, and the one-time layout upgrade for old saves are free.
- Not chosen: the Chip Coin price of a Recharge.

Implemented November 11, 2026: the battery counter and Chip Coin count at the top of home, the Charges card in all three states with the sleepy Bastion, real-time refills, Restart spending a Charge, and Recharge at zero (from the Restart button, the failed card, and Play). Logic is in `src/game/charges.js`; art is in `src/ui/currency.js` and the `'sleepy'` mood in `src/ui/components.js`. **Placeholders** in `src/game/charges.js`: `RECHARGE_PRICE` is 20 and `STARTING_CHIP_COINS` is 60, because there is no shop yet. The failed card's Restart button shows "−1" or becomes Recharge.

### Charges card

Approved November 11, 2026. Same structure as the level clear card: heading **Charges**, cream body, close ✕.

- **Opens** when the player taps the battery on home, automatically when they tap **Play** with zero Charges, and from the failed card's **Recharge** button.
- **Body:** a big battery with the count printed on it and cells filled to match, then one line: "Full" or "+1 in 12:30".
- **Full or recharging:** no button, only the close ✕.
- **Empty:** the battery turns gray with the recolored spark, a sleepy Bastion sits beside it, and a warm orange **Recharge** button shows its Chip Coin price on a gold tag.

## Premium currency: Chip Coins

Decided November 11, 2026. The premium currency is **Chip Coins**: our own small, cute take on bitcoin, a coin stamped like a little chip. On screen, "Chip Coins" (singular "Chip Coin"); in code, files, and URLs, `chipcoins`. Chip Coins pay for Recharges and Shield Breakers, and challenge rewards can award them.

- **Look:** a gold coin with a darker gold edge, an inner ring, a small shine at the top left, and two short bars poking out at the top and at the bottom (the bitcoin nod). In the middle is a plain, rounded, medium-weight **C** in dark gold, with nothing through it.
- **No face.** A face made the coin read as a seventh Chip’um, and spending them felt like giving away friends. Keep the coin an object.
- **Small sizes:** at price-tag size, drop the inner ring and bars and thicken the C so it stays readable.
- Mockup colors: coin `#f6c94a`, edge `#c98a1a`, ring `#e0a92e`, C and bars `#7a4c06`.

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
- A Shield Breaker removes one shield layer from a selected chip. It is bought with Chip Coins, and challenge rewards can also award Shield Breakers.
- Do not use the previously proposed single-chip or row/column clear tools. Removing unmatched pieces can create orphaned partners.

No currency, life, or item balance has been chosen. The current recovery screen has not yet been changed to enforce these new rules.

## Economy and monetization direction

| Item or system  | Decision                                                                                | Still to define                                                                                    |
| --------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Lives (Charges) | Restarting a level spends one Charge; shown as a battery with the count on it           | Recharge price, other ways to earn Charges, confirmation flow                                      |
| Chip Coins      | Buy Recharges and Shield Breakers; can be earned from challenge rewards                 | Prices, purchase packs, balances, caps, and other uses                                             |
| Shield Breakers | Remove one layer from a chosen shield; available through currency and challenge rewards | Shop/inventory flow, whether to buy-and-use or store items, behavior when no helpful target exists |
| Hints           | Part of the monetization plan, including optional rewarded ads for extra hints          | Free allowance, refill rules, prices, and rewards                                                  |
| Cosmetics       | Sell component art, board themes, wire effects, and pop effects                         | Pack contents, unlock requirements, direct purchase versus currency pricing                        |
| Ads             | Optional rewarded ads; no interruptions during a board                                  | Specific placements, rewards, availability, consent and store integration                          |

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

| Challenge                    | Example target             | Counting questions                                                                                              |
| ---------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Collect a component type     | 100 Bastions or 50 Sherrys | Count individual chips, not pairs; decide whether only cleared boards qualify                                   |
| Beat levels on the first try | 10 first-try clears        | Define an attempt and whether using a Shield Breaker disqualifies it                                            |
| Break shields                | 100 shields                | Decide whether the objective counts layers removed, chips fully freed, or provides separate objectives for each |
| Clear levels                 | An event-specific target   | Decide eligibility for Endless, tutorial, and event boards (campaign replays no longer exist)                   |
| Earn stars                   | An event-specific target   | Stars are collected per clear, not graded; choose how many each clear awards                                    |

These are design examples, not final reward tables. Event copy should use the Chip’um names (for example, "Collect 100 Bastions").

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
- First-try definition; stars earned per clear; chip, shield-layer, and freed-chip counting.
- Daily reward qualification/streaks and final reward tables for all events.
- Event/reset timezone, overlap, countdown rules, in-progress attempts, and unclaimed rewards.
- Number and difficulty of new levels each two-week release; seasonal content versioning.
- Group membership limits, race entry, matching, rewards, ties, and anti-farming rules.
- Backend, accounts, syncing, purchases, ads, and platform integration choices.

Update this document as each decision is made, and mark a feature implemented only when its code and checks exist.
