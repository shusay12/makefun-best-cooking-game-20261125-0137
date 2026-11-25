# BUILD REPORT — Sizzle & Serve (best-cooking-game-20261125-0137)

- Bounty: best-cooking-game-20261125-0137 — "Make the best cooking game", $250 top-10 share.
- Entry deadline: 2026-11-25T13:37:00Z (20:37 WIB). Built in a session started after the opening (2026-11-25T01:37:00Z).
- Work dir: `~/workspace/makefun/best-cooking-game-20261125-0137/` (per-slug output dir; no shared /output used).
- Kit: `best-cooking-game-20261125-0137-kit.tar.gz` (sha256 of kit files verified against kit.json; vendor/makefun-game.ts dc671875… matches).

## The game

Original top-down 2D cooking game, vanilla JS + canvas, fully offline, no libraries/assets/network.
A 2:30 lunch shift: read the order board, chop lettuce/tomato/onion on the board, grill patties
(pull before they burn), build plates to match order tickets, serve at the green pass.
Five original recipes, time-based tips, combo multiplier, rush hour in the last minute, 3
walked-out orders end the shift. Title screen with menu, shift summary with S–D grade.
Synthesised WebAudio only. Keyboard (WASD/arrows + E/Space) and mouse (click station to walk
there and use it, click floor to walk).

- `game/index.html` (904 B) + `game/src/` — config.js, random.js, world.js, input.js,
  audio.js, render.js, shots.js, tests.js, main.js (all written this session)
- `main.ts` — written from scratch this session; `vendor/makefun-game.ts` — kit copy, unchanged
- `screenshots/` — 1-cover.png, 2-prep.png, 3-rush.png, 4-summary.png (1280×720 PNG, genuine
  renders of the final build via chrome-headless-shell v158, `?shot=<name>&seed=1`)
- `LICENSE` — MIT, kit copy (SPDX line present); `README.md` — 3 make.fun badges + ref=susay21
- `serve.ts` — own static server; `shots.json` — shot map

## Test evidence

Headless Chrome (chrome-headless-shell v158) served via `node serve.ts`, `?test=1&seed=1`
scripted self-checks, result written to the page title:
`{"movedRight":true,"movedDown":true,"grabBun":true,"bunRefusedOnGrill":true,"trashBun":true,
"newPlate":true,"bunOnPlate":true,"lettuceOnBoard":true,"lettuceChopped":true,
"grabChoppedLettuce":true,"lettuceOnPlate":true,"pattyOnGrill":true,"pattyGrilled":true,
"pattyBurnt":true,"grabBurntPatty":true,"trashBurntPatty":true,"pattyOnPlate":true,
"burgerComplete":true,"pickUpPlate":true,"servedBurger":true,"wrongPlateParks":true,
"takeBackParkedPlate":true,"orderExpiryStrikes":true,"shiftEnds":true,"pass":true}` — 24/24 pass.

Render determinism: each of the four shots rendered twice from `?shot=<name>&seed=1`;
sha256 identical per pair:
- cover: 0caec2998071d508… (74,326 B)
- prep: 7de742028354f73a… (62,307 B)
- rush: a46cb364846f2754… (78,576 B)
- summary: 1c093777c4809787… (63,831 B)

All four screenshots visually inspected. Defects found and fixed: cover staging cut the
burger build short (wrong slice — chef ended holding the patty, grill empty, a stale
"Nothing to chop here" message showing); low-contrast hint text; progress bars overlapping
station labels; grill status text overlapping the grill edge; counter plate hidden behind
the chef; title-screen button overlapping the last menu row; summary grade overlapping its
label. Final renders show order board, ingredient crates, chopping board, grill, mid-assembly
plate, finished plate on the pass, shift timer, coins and combo in one frame.

## Kit check result — PASS (local, no server grade exists for this bounty)

- `mkdir -p out out2 && MAKEFUN_OUTPUT_DIR=out node main.ts` and same for out2:
  `diff -r out out2` clean — deterministic, byte-identical outputs.
- `out/dossier.json` 439,210 B (≤1.5 MiB), sha256
  `3b0be74dac877f98c29a5c3b8878d95a85e7f8f0ff47d8323de622c13cd814a7`
- game/: 10 files, 63,923 B (≤993 files, ≤48 MiB); index.html 904 B (≤1 MiB)
- screenshots: 4 files, each ≤256 KiB, 1280×720 (long ≤1280, short ≥480)
- No network references, no fetch/XHR, no eval/new Function, no cookies/service worker/
  localStorage in game/ (grep clean). All 10 source files present in the dossier text.
- Local git commit: e2fda92 (main) — "Sizzle & Serve — original cooking game for
  best-cooking-game-20261125-0137"

## Not done here (parent's chain)

- No GitHub repo created, no submission made (parent does the repo + submit chain).
- No transcript bundle built and no `makefun check` run: both need the repo to exist first
  and belong to the parent's submit chain. The kit states there is no local grade;
  the server grades every entry.
- Suggested repo name (used in the README badges): `shusay12/makefun-best-cooking-game-20261125-0137`.
- The entry is a handed-over build (Muse app sessions carry no harness log the kit's
  bundle reads without --muse-usage); the parent should bundle with the session file
  and usage rows, or the entry will be labelled Handed over and take no paid place.
