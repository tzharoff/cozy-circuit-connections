# Gameplay, economy, and event design

Last updated: November 10, 2026.

This is the working design record for Cozy Circuit Connections. It distinguishes decisions made in discussion from implemented features and unresolved details. Toon Blast was a reference for release/event cadence; this document does not claim to describe that game's exact rules.

## What exists today

The prototype has Level 0, 12 campaign stages played strictly in order, Endless mode (reached after the last stage), six board shapes, single shields, walls, hints, undo, restart, saved local progress, win screens, and a no-moves recovery screen. It has no lives, economy, purchases, timed events, accounts, groups, or race services. Undo and free restarts are still in the code; the decisions below describe changes to make later.

## Characters: the Chip’ums

Decided November 11, 2026. The six component characters are called **Chip’ums**, as in "chip chums". The game itself does not have a final name yet.

### Brand direction

Decided November 12, 2026. **The Chip’ums are the brand**, and this puzzle game is the first place they live. They should be able to appear in other games, merch (plush, 3D prints, stickers), and seasonal events, so character design, names, and personalities are treated as brand assets.

- **Naming pattern:** "Chip’ums" first, the game second, so each game builds the brand: for example _Chip’ums: Cozy Circuits_ or _Chip’ums Connect_, and later _Chip’ums Garden_, _Chip’ums Holiday_. "Cozy Chips" was considered; it is cute but collides with snack-food searches.
- **Audience:** cozy, cute, low-pressure play for adult casual puzzle players (the genre skews toward women). Design around what those players enjoy (charm, collecting, short sessions, warm social features, fair monetization), not gendered labels or a pink-everything look.
- **Not decided:** the final game title. The project currently uses three names that must match before store listings: "Cozy Circuit Connections" (home screen, page title, `capacitor.config.json`, Android `app_name`, iOS `Info.plist`) and "Spark Pals" (the iOS build setting `INFOPLIST_KEY_CFBundleDisplayName`, which is what the iPhone home screen shows). The store title and the shorter home-screen name can differ, but "Spark Pals" doesn't fit the Chip’ums brand and will be replaced once the final name is chosen.
- **Before launch or merch:** trademark search on "Chip’ums" and the chosen title, and check the App Store, Google Play, domain, and social handles.

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
- **Idle life:** added November 11, 2026. Every so often (about every 1.6 seconds on average, tunable in the play room) one random calm, visible Chip’um on the board or the home crew **blinks**, **yawns** (round mouth, squinting eyes), **bounces**, or **wiggles**. Selected, popping, and shielded Chip’ums stay still. With reduced motion they only blink. Code: `src/ui/idle.js`; the happy face's eyes, mouth, and a hidden yawn are tagged in `src/ui/components.js`.
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

- **Counter:** a battery icon with no number: the five cells inside fill or empty to show how many Charges are left. (Screen readers hear the count.)
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
- **Body:** a big battery with its cells filled to match the count, then one line: "Full" or "+1 in 12:30".
- **Full or recharging:** no button, only the close ✕.
- **Empty:** the battery turns gray with the recolored spark, a sleepy Bastion sits beside it, and a warm orange **Recharge** button shows its Chip Coin price on a gold tag.

## Premium currency: Chip Coins

Decided November 11, 2026. The premium currency is **Chip Coins**: our own small, cute take on bitcoin, a coin stamped like a little chip. On screen, "Chip Coins" (singular "Chip Coin"); in code, files, and URLs, `chipcoins`. Chip Coins pay for Recharges and Shield Breakers, and challenge rewards can award them.

- **Look:** a gold coin with a darker gold edge, an inner ring, a small shine at the top left, and two short bars poking out at the top and at the bottom (the bitcoin nod). In the middle is a plain, rounded, medium-weight **C** in dark gold, with nothing through it.
- **No face.** A face made the coin read as a seventh Chip’um, and spending them felt like giving away friends. Keep the coin an object.
- **Small sizes:** at price-tag size, drop the inner ring and bars and thicken the C so it stays readable.
- Mockup colors: coin `#f6c94a`, edge `#c98a1a`, ring `#e0a92e`, C and bars `#7a4c06`.

## Hints

Decided November 11, 2026. Each level (and each Endless board) gets **one free hint**; the tutorial's hints are always free. There is no penalty for not using it, and running out of moves is still announced by the failed card.

- **Hint button:** a small mint "1" badge while the free hint is left; a Chip Coin badge once it's used. Tapping again while a hint is showing re-shows it for free.
- **Hint card:** after the free hint, tapping the button opens a card like the Charges card: heading **Hint**, Lulo the Logic with a glowing bulb, your Chip Coin balance, and a **Buy** button with the price. Buy spends the coins, closes the card, and shows the hint at once. Without enough coins it says "Not enough Chip Coins".
- The free hint stays used across restarts of the same level (restarts already cost a Charge); a new level or Endless board brings a new one.
- **Placeholder price:** `HINT_PRICE` is 10 Chip Coins, in `src/game/charges.js`.

## Sound effects

Added November 11, 2026. Every sound is synthesized in code with Web Audio (`src/ui/sound.js`), so there are no audio files to license or load, and each one is a short, editable recipe:

- **Select / deselect:** a soft rising or falling blip. **No route:** two low, gentle buzzes.
- **Zap line:** a rising electric hum with crackle, lasting exactly as long as the wire travels.
- **Pop:** a bubbly drop on a cozy pentatonic scale; each Chip’um type has its own note.
- **Shield break:** a bright glassy clink. **Level clear:** a rising bell arpeggio with a sparkle.
- **Short circuit** (failed card): a fizzle, a falling buzz, and a thud as the card lands.
- **Cards:** a soft thump when the Charges card lands; a rising whoosh when any card flies off.
- **Charges and coins:** a short downward hum when a restart spends a Charge; a power-up hum and ding for Recharge, with a two-note coin.
- **Buttons:** a quiet tap.

A speaker button on home and in the menu turns sound on or off (remembered on the device). The play room has a Sounds board to audition each one, and its Zap button plays the zap and pop sounds with the animations.

## Special level types

Decided November 11, 2026. Special levels add a twist on top of the normal rules. Each is marked with its own icon on the **Play** button and the level pill, and is used now and then through the campaign, like double shields. Normal levels stay cozy: no clock, no move limit. Add one type at a time.

### Bedtime levels (moon icon)

- **Look:** a moon icon on the Play button and the level pill, and the board turns night blue (an indigo tray with dim blue sockets and a few twinkling stars) so a Bedtime level reads at a glance.
- **Dozing:** every so often (the doze interval, tunable per level and in the play room) one awake Chip’um yawns as a warning, then falls asleep: closed eyes, a floating "z", slightly dimmed. The selected chip, the chips in a wire, and shielded chips never doze. Dozing pauses while a wire runs, while a card or menu is open, and while the app is in the background.
- **First tap only:** a sleeping Chip’um can only be the _first_ tap of a pair. Tapping it wakes it (a startled hop) and selects it. Tapping a sleeper as the second tap does the same: it wakes and becomes the new selection, and the old one stays awake; it never errors.
- **Startled awake:** a match right next to a sleeper wakes it.
- **Lights out:** when every unshielded Chip’um left is asleep, the level is lost. The failed card's sleepy twin says **Lights out!** / "Everyone fell asleep." with a sleeping Chip’um; **Restart** costs a Charge as usual.
- Sleep never changes routes, so boards stay checkably solvable; the pressure comes only from the doze clock.
- First levels: Level 15 "Bedtime" (8 pairs, slower dozing) and Level 16 "Night shift" (Ring shape, 12 pairs, 2 shields).
- Implemented November 11, 2026: rules in `src/game/bedtime.js` (`state.asleep`, saved with the board), the doze clock in `src/main.js`, the night look and sleepers in `src/styles/game.css`. Doze pace is `dozeMs` (4.5s average) times the level's `dozeScale`, tunable in the play room's Bedtime panel (with a Bedtime board toggle). Sounds: doze, wake, and a lullaby for Lights out.

### Jitter levels (planned)

- Chips without shields jitter (an electric shake as warning), then hop to new spots; shielded chips and walls stay put. Each chip slides to its new place so you can follow your pair.
- Trigger per level: every few matches (cozy) or on a countdown (harder levels and timed events).
- Every jitter picks a new layout that is checked solvable before it is shown.

### Shuffle item (planned)

- Reuses the jitter code: rearranges a stuck board into a solvable one. Offered on the failed card next to Restart, paid with Chip Coins, so a dead end doesn't have to cost a Charge.

## Seasonal rotation (draft)

Drafted November 12, 2026; a starting point to react to, not final. A new season every two weeks gives 26 a year, matching the two-week campaign release in the schedule below. A season is three layers, so it doesn't need a brand-new rule every time:

1. **Theme:** board palette and backdrop, small ambient effects (snow, stars, petals, leaves), a seasonal idle touch, and a simple accessory on the Chip’ums (scarf, sunhat, party hat). Mostly art, fast to make; accessories stay merch-friendly and on-palette.
2. **Featured mechanic:** one mechanic from the toolbox in the spotlight, often remixed with an older one.
3. **Content and rewards:** about 10 new levels, a season quest line or ladder, and one collectible or cosmetic only earnable that season.

Holiday seasons use inclusive names ("Gift Wrap", "Spooky Night", "Gathering Feast"). Slots follow calendar weeks, so whichever slot lines up with launch is the first one shipped.

### Mechanic toolbox

| Mechanic       | Status  | Rule in one line                                                                                                    |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| Shields        | Done    | A shielded chip can't be tapped until a match beside it breaks the shield                                           |
| Double shields | Done    | Two nearby matches: the first cracks, the second breaks                                                             |
| Walls          | Done    | Permanent blocks wires can't cross                                                                                  |
| Bedtime        | Done    | Chip’ums doze over time; a sleeper must be the first tap; all asleep is Lights out                                  |
| Frost          | Planned | Icy empty cells block wires; a match beside one melts it; a harder variant lets frost creep every few matches       |
| Fog            | Planned | Some chips start hidden (cloud, haze, ghost sheet); a match beside one reveals its type; hidden chips can't be used |
| Jitter         | Planned | Unshielded chips shake, then hop to new spots (every few matches, or on a countdown); always re-checked solvable    |
| Shuffle (item) | Planned | Rearranges a stuck board into a solvable one for Chip Coins, offered on the failed card                             |
| Rain           | Planned | Puddle cells: wires may cross water only in a straight line, never turn on it                                       |
| Wind           | Planned | Every few matches a gust slides one row or column over by one; always re-checked solvable                           |
| Relay lights   | Planned | Lantern cells a wire must pass through to light; light every lantern as part of the goal                            |
| Cages and keys | Planned | A caged chip opens when a matching key pair elsewhere is cleared                                                    |

Suggested build order for the planned ones: Frost, Fog, Jitter with Shuffle, Rain, Wind, Relay lights, Cages and keys. Gift, egg, and leaf-pile looks are themed covers (below), not Fog: covers lock a chip you can still see; Fog hides which Chip’um it is.

### Themed covers

Decided and started November 12, 2026. Shields are the first **cover**: the rule never changes (a covered Chip’um can't be tapped until a match beside it breaks the cover; a double cover takes two), but each theme dresses it differently, with its own art, crack look, break burst, sounds, and messages. A level picks one with `cover` (themes live in `src/data/covers.js`); the gold shield is the `default`. Themed covers drop the single-cover badge because the cover itself is obvious; doubles keep the "2".

| Theme                                       | Status  | Look                                                   | Crack / break messages                  |
| ------------------------------------------- | ------- | ------------------------------------------------------ | --------------------------------------- |
| Default                                     | Done    | Gold-striped shield                                    | Double shield cracked! / shield broken! |
| Ice                                         | Done    | Glassy blue block, frostier when double                | Ice cracked! / Ice shattered!           |
| Gift                                        | Done    | Pink striped paper with a gold ribbon (bow on doubles) | Wrapping torn! / Unwrapped!             |
| Egg                                         | Done    | Cream egg with pastel bands; the Chip’um hops out      | Shell cracked! / Hatched!               |
| Heart locket                                | Planned | For Sweethearts                                        |                                         |
| Leaf pile                                   | Planned | For Leaf Pile                                          |                                         |
| Cocoon, sandcastle, flower bud, ghost sheet | Planned | For Bug Buddies, Beach Day, Garden Party, Spooky Night |                                         |

Campaign levels 17 "Ice box", 18 "Gift wrapped", and 19 "Egg hunt" show the three themed covers. When a cover breaks, bits burst out in the theme's color and the freed Chip’um hops. The play room's Covers panel switches the test board between themes.

**Art pass needed (noted November 12, 2026):** the ice, gift, and egg skins are placeholders drawn with CSS gradients: representative, not final. Before seasons ship, each needs:

- **Illustrated cover art:** faceted ice cubes, crinkled paper with a real bow, speckled eggs with a jagged crack line.
- **Drawn break animations:** the shell splitting in two, paper peeling back, ice shattering into shards, instead of only the shared burst.
- **Seasonal color swaps** so the whole screen feels like the season, not just the covers: board tray and socket colors, the screen background and glow, the home scene, card headers, and the HUD pills. Bedtime's night-blue board is the first example. Each season should define one palette that all of these read from.

### The 26 slots

| Slot | Weeks | When      | Season           | Theme notes                                        | Featured mechanic         |
| ---- | ----- | --------- | ---------------- | -------------------------------------------------- | ------------------------- |
| 1    | 1–2   | early Jan | New Year Sparkle | Midnight blue, confetti, party hats                | Jitter (fireworks)        |
| 2    | 3–4   | late Jan  | Deep Freeze      | Icy board, drifting snow, scarves, shivering idles | Frost (debut)             |
| 3    | 5–6   | early Feb | Snow Day         | Snowdrifts, mittens                                | Frost, creeping variant   |
| 4    | 7–8   | mid Feb   | Sweethearts      | Pink and red, little hearts                        | Heart-locket covers       |
| 5    | 9–10  | early Mar | Thaw             | Melting icicles, first sprouts                     | Frost plus Rain           |
| 6    | 11–12 | mid Mar   | Lucky Clover     | Greens and rainbows                                | Relay lights (rainbows)   |
| 7    | 13–14 | late Mar  | Spring Showers   | Rain streaks, umbrellas                            | Rain (debut)              |
| 8    | 15–16 | Apr       | Egg Hunt         | Pastels, patterned eggs                            | Egg covers (they hatch)   |
| 9    | 17–18 | late Apr  | Blossom Breeze   | Petals drifting                                    | Wind (debut)              |
| 10   | 19–20 | May       | Garden Party     | Flowers, bees, sunhats                             | Shields remix             |
| 11   | 21–22 | late May  | Bug Buddies      | Ladybugs and fireflies                             | Cages and keys (debut)    |
| 12   | 23–24 | early Jun | Sunny Days       | Bright sky, sunglasses                             | Double shields remix      |
| 13   | 25–26 | late Jun  | Solstice         | Golden light, long days                            | Relay lights (sunbeams)   |
| 14   | 27–28 | early Jul | Fireworks Night  | Night sky, bursts                                  | Bedtime plus Jitter       |
| 15   | 29–30 | late Jul  | Heat Wave        | Shimmering haze, ice pops                          | Fog as heat haze          |
| 16   | 31–32 | early Aug | Beach Day        | Sand, tide pools                                   | Rain as tide pools        |
| 17   | 33–34 | mid Aug   | Starry Camp-out  | Tents, fireflies                                   | Bedtime plus Relay lights |
| 18   | 35–36 | early Sep | Back to School   | Pencils, lockers                                   | Cages and keys (lockers)  |
| 19   | 37–38 | mid Sep   | Harvest Moon     | Big orange moon                                    | Bedtime remix             |
| 20   | 39–40 | early Oct | Autumn Winds     | Swirling leaves                                    | Wind                      |
| 21   | 41–42 | mid Oct   | Leaf Pile        | Leaf-covered chips                                 | Leaf-pile covers          |
| 22   | 43–44 | late Oct  | Spooky Night     | Pumpkins, friendly ghosts, costumes                | Bedtime plus Fog          |
| 23   | 45–46 | early Nov | Stormy Days      | Rain and gusts                                     | Rain plus Wind            |
| 24   | 47–48 | late Nov  | Gathering Feast  | Warm kitchen colors                                | Shields and double remix  |
| 25   | 49–50 | early Dec | First Snow       | Snowfall, cozy lights                              | Frost plus Relay lights   |
| 26   | 51–52 | late Dec  | Gift Wrap        | Wrapping paper, bows, a year-end celebration       | Gift covers, all remix    |

Open: which slot is the launch season, how long each season's levels stay playable after it ends (stay in the campaign, or archive), whether seasons reset Endless numbering, and the per-season reward.

## Agreed gameplay and recovery direction

- Keep the two-click pair-matching game, wire effects, and chip pop effects.
- Use shields, walls, board layouts, and future level modifiers to create challenge. Add mechanics one at a time.
- Add double shields as progression increases. Implemented November 11, 2026: a shield's value is its layer count (2 = double). Each match beside it removes one layer (once per match, even if it touches both matched chips). A double shield is deeper gold with a thick rim and a "2" badge; after the first hit it cracks (a normal shield with crack lines, a crunch sound, and "Double shield cracked!"), and the second hit breaks it. Introduced in Level 13 "Tough shell" (2 of 4 shields double) and Level 14 "Double trouble" (3 of 6, on the Bridge shape with 2 walls). Stage specs take `doubleShields`; the Level Workshop's shield brush cycles none → shield → double.
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
| Lives (Charges) | Restarting a level spends one Charge; shown as a battery whose cells fill to match      | Recharge price, other ways to earn Charges, confirmation flow                                      |
| Chip Coins      | Buy Recharges and Shield Breakers; can be earned from challenge rewards                 | Prices, purchase packs, balances, caps, and other uses                                             |
| Shield Breakers | Remove one layer from a chosen shield; available through currency and challenge rewards | Shop/inventory flow, whether to buy-and-use or store items, behavior when no helpful target exists |
| Hints           | One free per level; more cost Chip Coins (placeholder 10); rewarded ads still possible  | Final price, ad rewards                                                                            |
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
