# Week 05 — Archetypes (Idea Menu)

Use these as inspiration, not requirements. Each archetype touches the three parts: input, black box, output.
Start by choosing one **theme word** (learning, trust, attention, emotion, power, fun, boredom, beauty, youth) and let it guide your choices.

---

1) Command Toy
- Input: buttons or a small menu instead of open text
- Black box: compare a small model vs a larger model for command compliance
- Output: `/ding`, `/help`, `/mode` routed to actions

2) Mood-to-Sound
- Input: mood picker + intensity slider
- Black box: compare two models for drift in JSON compliance
- Output: JSON routes to a sound cue

3) Gesture-to-Visual
- Input: mouse gestures or simple drawing (line/shape)
- Black box: inspect raw request/response JSON and note schema drift
- Output: JSON drives a visual animation or color system

4) State Machine Bot
- Input: toggles for state (idle/recording/paused)
- Black box: compare two models across multiple turns for instruction slippage
- Output: only allow actions valid in the current state

5) Micro-Simulation Controller
- Input: control panel (speed, direction, intensity)
- Black box: compare two models for schema adherence
- Output: `{ action: "step", params: { dx, dy } }` drives a simulation step

6) Social Signal Mapper
- Input: a short scenario + a “tone” selector (e.g., formal/informal)
- Black box: compare two models for how they interpret tone into output fields
- Output: JSON maps to a social reaction meter (trust/urgency/affect)

7) Learning Coach (Tiny)
- Input: a quiz answer + confidence slider
- Black box: compare two models for consistency in feedback style
- Output: JSON routes to a feedback type (hint / example / correction)

8) Environment Pulse
- Input: time of day + weather toggle (manual)
- Black box: inspect raw JSON for extra text leakage or missing fields
- Output: JSON controls light/ambient visuals or soundscape
