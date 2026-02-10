# Week 04 — Demos

Week 04 is about **structured output** and **deterministic wrappers**.

## Quick map
- Activity 1: prompt-only JSON (observe drift)
- Activity 2: REPL + routing (structure → behavior)
- Activity 3: JSON Schema structured output (strictness)
- Audio assets: `Demos/Week 04/assets/`

## Demo 1 (start here): Structure From Prompt (Loose JSON)
This is intentionally “fragile”:
- Use only a system prompt to ask for JSON.
- Observe drift and failure modes.
- Practice noticing what breaks before we try strict contracts.

Folder:
- `Demos/Week 04/Activity 1 - Structure From Prompt (Loose JSON)/`

## Demo 2: REPL Chat + Sound Routing
Multi-turn REPL chat that tries to parse `do.sound` from “loose JSON” and trigger background audio.

Folder:
- `Demos/Week 04/Activity 2 - REPL Chat + Sound Routing/`

## Demo 3: REPL Chat + Structured Output (JSON Schema)
Same app idea as Activity 2, but paired with a strict JSON Schema to reduce drift.

Folder:
- `Demos/Week 04/Activity 3 - REPL Chat + Structured Output (JSON Schema)/`
