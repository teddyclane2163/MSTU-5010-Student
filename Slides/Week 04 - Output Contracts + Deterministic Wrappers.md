---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section { font-size: 28px; }
  pre { font-size: 20px; }
---

# Week 04
## Output Contracts + Deterministic Wrappers

**Thesis:** structure is the bridge between model behavior and deterministic software behavior.

---

## Where we are (arc)

- Week 02: payload literacy (see the boundary)
- Week 03: payload agency (intervene at the boundary)
- Week 04: output contracts (make outputs usable by programs)

---

## The problem

We can get fluent text.

But we can’t reliably build software behavior from fluent text.

So today: **structured output**.

---

## Key vocabulary (minimal set)

- **Output contract**: a rule for what the model must output (format)
- **Structured output**: machine-readable output (commands / JSON)
- **Validation**: checking output matches contract
- **Routing**: “if output looks like X, do Y”
- **Deterministic wrapper**: code around the model that enforces rules/state/actions

---

## The Week 04 demos (sequence)

1) **Activity 1** — prompt-only “JSON-ish” output (drift happens)
2) **Activity 2** — parse + route (`do.sound` → background track)
3) **Activity 3** — JSON Schema structured output (strict, reliable)

---

## Activity 1 (prompt-only): ask for structure

We give the model a system prompt that asks for JSON with:
- `think`
- `say`
- `feel { state, color }`
- `do { action, sound }`

Then we watch what happens over multiple turns.

---

## What breaks first? (drift taxonomy)

- **Format leakage**: extra text, markdown fences, multiple objects
- **Invalid JSON**: comments, trailing commas, missing quotes
- **Schema drift**: missing keys, new keys, wrong types
- **Instruction slippage**: obeys on turn 1, forgets on turn 3+

---

## Why this matters

Even if the output “looks right” to humans…

**computers need it to be exactly right.**

---

## Activity 2: deterministic wrapper (same idea, now with behavior)

We route:

- parse response → find `do.sound`
- if `happy.mp3 | sad.mp3 | neutral.mp3` → play that track
- else → play `error.mp3`

This is the boundary becoming an “app”.

---

## Observation

The wrapper is a policy.

It decides:
- what counts as valid output
- what happens when output is invalid
- what the user experiences when drift occurs

---

## Design choice: strictness policy

When output breaks, what should the system do?

- **Reject** (fail closed): stop and show error
- **Normalize**: strip fences, trim junk, attempt repair
- **Retry**: ask the model to output only valid JSON

There’s no neutral choice—only tradeoffs.

---

## Activity 3: structured output (JSON Schema)

Now we pair the same response shape with a schema:

- output must be **valid JSON**
- keys must be present
- types must match
- enums constrain values (like `do.sound`)

Result: parsing becomes simple; behavior becomes dependable.

---

## Big idea

We’re not trying to make the model smarter.

We’re making the boundary **usable**.

---

## Discussion prompts (pick 1–2)

- Where does control live now: prompt, schema, or wrapper?
- Does schema reduce drift across turns?
- What failures are still possible even with strict schema?

---

## Take-home direction

Design a tiny experience that:
- shapes input (policy/context), and
- uses structured output (commands or JSON) to drive deterministic behavior.

Bring:
- one contract (prompt/schema)
- one failure case
- one routing rule (what your wrapper does)

