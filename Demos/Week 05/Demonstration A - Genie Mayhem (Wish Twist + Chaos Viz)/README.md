# Demonstration A — Genie Mayhem (Wish Twist + Chaos Viz) (Week 05)

## Goal
Build a playful **input -> model -> structured output -> visualization** demo aligned with mini-project direction.

Framing:
- The model is a genie.
- The user makes a wish.
- The genie grants it with a chaotic twist.
- The app renders chaos magnitude as a p5 visual state.

## Core UX Loop
1. **Set the stage**
   - UI introduces a genie who grants 3 wishes.
   - Prompt: "What is your wish?"
2. **User input**
   - User enters a wish (small, medium, or large ambition).
3. **Model transformation**
   - System behavior: twist the wish into ironic, chaotic fallout.
4. **Dual output**
   - A short narrative response for humans.
   - Structured JSON for deterministic visualization.
5. **Visual companion (p5)**
   - p5 reads JSON and maps it to color, shape, motion, and glitch intensity.
6. **Replay**
   - User tries another wish and compares outcomes across model runs.
   - State is session-based and replaced each turn (with smooth transition), not permanently layered.

## Chaos Function (demo policy)
Chaos is computed as:
- wish magnitude (base intensity)
- modified by wish tone:
  - selfish + mean -> chaos up
  - selfless + kind -> chaos down

Special case:
- simple + selfless + kind wishes may be granted mostly as-is with minimal mutation and low chaos.

Visual effect:
- shape frequency/density is tied to chaos level (calm = sparse, mayhem = dense).

## Prompting Intent (high-level)
System behavior should enforce:
- Whimsical, theatrical tone (not graphic harm).
- "Granted... with a twist" structure.
- Consequence logic: bigger wish -> bigger chaos.
- Always return the required JSON object (optionally with a short narrative field).

## Suggested Output Contract
Use strict JSON when possible.

```json
{
  "wish": "I wish for a billion dollars",
  "wishMagnitude": 9,
  "chaosLevel": 93,
  "chaosType": ["greed", "social-collapse", "irony"],
  "narrative": "Your wish has been granted... but every account on Earth now uses your name, and financial systems lock up in panic.",
  "visual": {
    "palette": ["#2b2d42", "#ef233c", "#d90429"],
    "shapeFamily": "shards",
    "shapeCount": 140,
    "motionSpeed": 0.92,
    "jitter": 0.88,
    "glitchFrequency": 0.8,
    "symmetryBreak": 0.9,
    "calmPockets": 0.05
  }
}
```

## Field Semantics
- `wishMagnitude` (1-10): estimated scale/ambition of the wish.
- `chaosLevel` (0-100): overall severity of side effects.
- `chaosType`: categorical tags for interpretation.
- `narrative`: short story beat for audience-facing reveal.
- `visual.*`: parameters p5 can map directly to rendering behavior.

## Example Mapping to p5
- `chaosLevel` -> camera shake, distortion amount, overall animation amplitude.
- `motionSpeed` -> velocity multiplier.
- `jitter` + `glitchFrequency` -> frame noise, displacement bursts, flicker cadence.
- `shapeCount` + `shapeFamily` -> density and geometry style.
- `symmetryBreak` -> how quickly composition loses order.
- `calmPockets` -> occasional stable zones that reduce visual overload.

## Why this demo works in Week 05
- Keeps input experience central (the wish is the design surface).
- Makes model behavior legible through both story and machine-readable data.
- Supports rapid model comparison in blackbox testing.
- Gives students a concrete pattern for mini-project architecture.

## Stretch Variations
- Add a "Mercy Toggle" that lowers chaos by 20%.
- Compare 2 models side-by-side from the same wish.
- Keep a session log of wishes and chaos trajectories.
- Let users spend wish #2 or #3 to repair consequences (often imperfectly).

## Files
- `index.html`: UI + p5 visual state renderer.
- `server.js`: local Node server (static hosting + `/api/wish` proxy).
- `system-prompt.txt`: genie behavior contract.
- `schema.json`: strict structured output contract.

## Run Locally (Node.js)
Prereqs:
- Node.js 18+.
- LM Studio (or other OpenAI-compatible endpoint) running.

From this folder:

```bash
npm start
```

Then open:
- `http://127.0.0.1:8787`

Optional environment overrides:

```bash
LLM_BASE_URL=http://localhost:1234/v1 \
LLM_MODEL=your-model-id \
LLM_API_KEY=lm-studio \
npm start
```

Notes:
- The page calls your local Node server (`/api/wish`), not the model endpoint directly.
- If upstream returns invalid/failed output, the app falls back to a safe chaos payload.
- Calming wishes (restore/undo/order language) are interpreted as de-escalation and should visibly reduce chaos.
