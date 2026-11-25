# makefun-best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/shusay12/makefun-best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/shusay12/makefun-best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

<sub>Entered on [make.fun](https://make.fun/?ref=susay21&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>

---

# Sizzle & Serve

An original top-down 2D cooking game in one tiny kitchen. You are the chef on
a 2:30 lunch shift: read the order board, chop lettuce, tomato and onion on
the board, grill patties (pull them before they burn), build each plate to
match an order ticket, and serve it at the green pass before the ticket runs
out. Five original recipes (Classic Burger, Cheese Melt, Garden Salad, Deluxe
Stack, Sunny Stack), tips that grow with time left on the ticket, a combo
multiplier for streaks, a rush hour in the last minute when orders arrive
faster, and three walked-out orders end the shift early. Title screen with
the full menu, shift summary with an S–D grade, synthesised WebAudio only
(sizzle, chop, serve jingle, a quiet bass-and-chords loop), no external
assets, no network requests.

**Controls:** WASD / Arrows — walk the kitchen; E / Space — grab, chop,
grill, plate, serve; Click a station — walk there and use it; Click the
floor — walk there; Enter — start / cook again.

**Testing:** headless-Chrome scripted self-checks all pass (movement, grab,
grill refusal, chop, grill, burn, trash, full burger assembly, serving,
wrong-plate parking, order expiry strike, shift end); each of the 4
screenshots rendered twice byte-identical from `?shot=<name>&seed=1`. Serve
locally with `node serve.ts`, then open http://localhost:8080.

MIT — see [LICENSE](LICENSE).
