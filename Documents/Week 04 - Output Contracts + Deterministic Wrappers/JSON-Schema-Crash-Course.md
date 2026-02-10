# JSON Schema Crash Course (Week 04 Supplement)

This is a quick, practical guide to the *few* JSON Schema features that matter most for Week 04:
getting **structured output** that is consistent enough to parse and route in code.

The mental model:
- A **prompt** asks nicely.
- A **schema** draws the lines: what keys exist, what types they are, and what values are allowed.

## What JSON Schema is (one sentence)
**JSON Schema** is a formal specification for what JSON is allowed: required keys, types, shapes, and constrained values.

## Why we use it in this course
When you want deterministic behavior, you need predictable structure.

Schema helps reduce:
- missing keys
- wrong types
- “creative” shapes you didn’t ask for
- values outside an allowed set (critical for routing)

Schema does **not** guarantee truthfulness or good judgment. It guarantees *shape*.

---

## A minimal “Week 04” schema shape
Example (conceptual):
- `think`: short string
- `say`: string
- `feel`: object with `state` and `color`
- `do`: object with `action` and `sound`

This is the pattern used by the Week 04 demos.

---

## The most important features (and how to use them)

### 1) `type` (what kind of thing is this?)
Common types:
- `"string"`
- `"number"` / `"integer"`
- `"boolean"`
- `"object"`
- `"array"`

Why it matters:
- prevents “sometimes a string, sometimes an object” drift
- makes parsing simpler (your code can assume the type)

Example:
```json
{
  "type": "object",
  "properties": {
    "say": { "type": "string" }
  }
}
```

### 2) `required` (what keys must exist?)
`required` is how you say “this key must be present.”

Example:
```json
{
  "type": "object",
  "required": ["say", "do"],
  "properties": {
    "say": { "type": "string" },
    "do": { "type": "object" }
  }
}
```

### 3) `additionalProperties: false` (no surprise keys)
This is one of the biggest “strictness levers”.

- If `additionalProperties` is `true` (or omitted), the model can add extra keys freely.
- If `false`, you’re saying “only the keys listed in `properties` are allowed.”

Example:
```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "say": { "type": "string" }
  }
}
```

### 4) `enum` (choose one from a set)
This is the “routing” feature.

If your code routes on a field (like a sound or an action), use an enum.

Example:
```json
{
  "type": "object",
  "properties": {
    "do": {
      "type": "object",
      "properties": {
        "sound": { "type": "string", "enum": ["happy.mp3", "sad.mp3", "neutral.mp3"] }
      },
      "required": ["sound"],
      "additionalProperties": false
    }
  }
}
```

Why it matters:
- prevents typos (`"neutral.m3p"`)
- prevents invented values (`"suspense.mp3"`)
- makes routing deterministic (`if sound === "happy.mp3" …`)

### 5) `description` (teaching the model what belongs here)
`description` is for humans, but in practice it can also help the model fill fields appropriately.

Example:
```json
{
  "type": "object",
  "properties": {
    "think": {
      "type": "string",
      "description": "A short intent summary. Do not include step-by-step reasoning."
    }
  }
}
```

Use it to:
- clarify intent (what the field *means*)
- set constraints that are hard to express as pure types
- remind the model about safety or boundaries

### 6) Basic string constraints (make outputs “small enough”)
Helpful constraints:
- `minLength`, `maxLength`
- `pattern` (regex)

Example (hex color):
```json
{
  "type": "string",
  "pattern": "^#[0-9a-fA-F]{6}$",
  "description": "Hex color like #ffcccb"
}
```

Example (short `think`):
```json
{
  "type": "string",
  "maxLength": 280
}
```

### 7) Arrays (when you want a list)
Arrays are great when you want multiple items but still keep structure predictable.

Example:
```json
{
  "type": "object",
  "properties": {
    "questions": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1,
      "maxItems": 3
    }
  }
}
```

---

## Common mistakes (and what they teach)

- Forgetting `required` → model sometimes omits keys
- Forgetting `additionalProperties: false` → “bonus keys” creep in
- Not using `enum` for routing fields → wrapper becomes messy and error-prone
- Over-constraining too early → more refusals or brittle failures

---

## A practical workflow for designing a schema

1) Start with your wrapper idea:
   - “What deterministic action will my code take?”
2) Identify the routing fields:
   - fields that decide behavior should usually be enums
3) Lock the shape:
   - `type`, `properties`, `required`, `additionalProperties: false`
4) Add small constraints:
   - max lengths, patterns (only where it helps)
5) Write good `description` text:
   - specify intent and safety constraints

---

## Exploration prompts (for LM Studio / your experiments)
- “Tighten this schema so `do.sound` cannot drift.”
- “Add an enum for `do.action` with only 3 allowed actions.”
- “Make `feel.state` one of 10 allowed emotions.”
- “Add `maxLength` constraints so outputs stay short enough for UI.”
- “Add a `questions` array with 1–3 items and route based on whether it’s empty.”

---

## Reminder: schema is not intelligence
Schema gives you:
- predictability
- parseability
- safer routing

Schema does not give you:
- truth
- calibration
- good decisions

That’s why we still need wrappers, logging, and design judgment.

