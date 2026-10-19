# BANKSHOT — Blitz vs. V21 Flow (iPhone Playtest)

**Experiment date:** October 19, 2026. **Status:** local-beta research prototypes, not App Store releases.

## Open and play
- [Five-Shot Blitz](./blitz.html) — five-shot solo score chase (default launch mode: `blitz`).
- [V21 Flow](./flow.html) — untimed five-shot waves; meet a score goal to continue (default launch mode: `flow`).
- [Mode chooser](./index.html)

Both HTML pages are stand-alone and intentionally share the **same V21 scoring and physics code** from `BANKSHOT_V21_Flow_Experiment.html`; only their starting mode and browser tab title differ. This isolates *gameplay mode* as the independent variable rather than confounding mechanics with code-version changes. Other in-game modes remain accessible from the menu. Scores and records use local browser storage. Flow is not verified/ranked. This is **not** an exact separate V20 build and should not be represented as one. A previous V20 package remains in the creator's original archive outside this repository.

## Hosting
Source files alone on GitHub do not make a playable web app. For iPhone Safari, enable **GitHub Pages** in repository Settings → Pages → Deploy from a branch → `main` / `/ (root)`. After the site deploys, open the Pages URL ending in `/blitz.html`, `/flow.html`, or `/`. This setting is not automatically configured by this commit.

## Testing protocol
1. On the same iPhone, play Blitz for 10 minutes, then Flow for 10 minutes. Record voluntary replays, session time, scoring clarity (1–10), enjoyment (1–10), and mode preference.
2. Repeat with at least five fresh players if available. Alternate which mode they try first; avoid coaching.
3. Specifically ask if a miss/wave failure felt deserved and what scored points.
4. Avoid claiming a winner from a tiny sample: use it to identify friction and prioritize another iteration.

**Limitations:** No validated difficulty tuning, real iPhone field-testing, server-verified friend duels or guaranteed online leaderboard. GitHub Pages is public if enabled on this public repository.
