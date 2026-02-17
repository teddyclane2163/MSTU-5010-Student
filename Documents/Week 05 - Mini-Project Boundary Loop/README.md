# Mini-Project: Boundary Loop — Guide

## Goal
Design a tiny experience that shows how a model’s input, internal behavior, and output translation are shaped by the boundary you build.

---

## The 3 Parts (Required)

### Start With a Theme Word
Pick **one word** to guide your project.

Examples: learning, trust, attention, emotion, power, fun, boredom, beauty, youth

Use this word to align your input, black box, and output decisions.

### Part 1 — Input Experience
- Describe how the user interacts (prompt, UI, or rules).
- Choose one boundary lever (role, temperature, stop, structured input, etc.).
- Explain what you expect this lever to do.

**Deliverable evidence:** a short description + one screenshot or snippet of your input design.

### Part 2 — Black Box Understanding
- Show evidence you looked “inside” the model interaction.
- Example evidence: raw JSON, two runs across different models, a drift example, or a debugging trace.
- Briefly state what you learned about the model’s behavior.

**Deliverable evidence:** a short excerpt (request/response JSON, comparison runs, or debug output) + one sentence insight.

### Part 3 — Output + Translation
- Define a contract (command or JSON).
- Translate the output into a deterministic action (sound, visual, state change, simulation).
- Show one failure case and how your wrapper handled it (reject/normalize/retry).

**Deliverable evidence:** contract definition + one success + one failure example with your policy choice.

---

## Major Questions (Use these to guide your design)

### Input (Major Question)
**What boundary are you creating at the point of input, and why does it matter?**

Supporting inquiry:
- What form does the input take (text, form, sliders, buttons, media)?
- What does your input allow the user to do that plain text doesn’t?
- Which lever are you using (role, temperature, stop, structured input), and why?

### Black Box (Major Question)
**What did you learn about model behavior by inspecting or comparing runs?**

Supporting inquiry:
- Which two models did you compare (small vs larger), and what changed?
- Did either model drift from your contract? How?
- Where in the request/response payload did you see evidence?

### Output (Major Question)
**How does your output contract translate model text into deterministic action?**

Supporting inquiry:
- What field does your wrapper route on?
- What does “success” look like in your translation?
- What failure case did you observe, and which policy did you choose (reject/normalize/retry)?

---

## Deliverable (short)
- 3–5 slides **or** a 1‑page README.
- Must include: input design, black box observation, output translation, and one failure case.
- Challenges you ran into + one thing you want to learn next.

## Presentation (next class)
- Mini‑demo (it is okay if it’s broken or incomplete).
- Briefly address: input → black box → output.
- Share one key reflection (see below).
- Aim for 2–3 minutes.

---

## Reflection Question (New)
After building, connect your project to a bigger human or social theme.

**Prompt:**
What might your boundary loop reveal or model about something bigger than the app itself?
Examples: learning, motivation, social behavior, power, emotion, trust, or attention.

Write 3–5 sentences. This is about meaning, not perfection.

---

## Success Criteria (minimal)
- Clear boundary choices (at least one in input, one in output).
- Evidence of inspection/observation (black box).
- Deterministic action triggered by structured output.

---

## Concrete Anchor (Example Project)

**Project name:** Mood-to-Sound

**Idea:** The user selects a mood and intensity. The model must return a command JSON. The wrapper plays a sound deterministically based on the output.

### Part 1 — Input Experience
- Input: a simple form with a mood dropdown (`calm`, `tense`, `joyful`) and intensity slider (1–5).
- Boundary lever: `system` role says “Return JSON only. Choose one action from ["sound"].”
- Expectation: this lever increases compliance and reduces extra text.

### Part 2 — Black Box Understanding
- Evidence: same prompt + contract run on two different models (small vs larger).
- Observation: compare compliance, drift, and style differences across models.

### Part 3 — Output + Translation
- Contract:
  ```json
  { "action": "sound", "params": { "tone": "calm|tense|joyful" }, "message": "..." }
  ```
- Translation: `tone` routes to one of three sound files.
- Failure case: model returns JSON with `tone: "excited"` → wrapper rejects and shows error (fail closed).

---

## Tips (Optional)
- Keep your contract tiny and enforce it strictly.
- Make your translation obvious and deterministic.
- One clean failure case is better than many vague ones.
