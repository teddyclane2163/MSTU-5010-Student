---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section {
    font-size: 28px;
  }
---

# Week 03
## Payload as Design Surface

**Thesis:** the request/response payload is our current constraint and our current design surface.

---

## Where we are (Phase I: Boundary-Finding)

- Week 02: learn the *shape* (payload literacy)
- Week 03: use the *shape* (payload agency)

Today’s question:
**If this boundary is the constraint, what can we design by intervening in it?**

---

## The boundary we’re working with

Our “interface” to the model is not magic.

- We send **JSON** → server builds tokens → model generates
- We receive **JSON** → we can inspect, store, transform, route

---

## Key vocabulary (minimal set)

- **Payload**: structured request/response JSON at the boundary
- **`messages[]`**: designed context (“memory”) for this request
- **`system`**: policy/governance + relationship framing
- **`temperature`**: stability vs variation in sampling
- **Post-processing**: what we do with output after we receive it (parse, log, route)

---

## Request payload (anatomy)

```json
{
  "model": "ministral-3-3b-instruct-2512",
  "messages": [
    { "role": "system", "content": "Always answer in rhymes. Today is Thursday" },
    { "role": "user", "content": "What day is it today?" }
  ],
  "temperature": 0.7,
  "max_tokens": -1,
  "stream": false
}
```

---

## What each request field is doing

- `model`: which model to run (routing)
- `messages`: the context the model conditions on
  - `system`: policy / framing
  - `user`: user input
- `temperature`: how “adventurous” selection is
- `max_tokens`: how long generation can go (server/runtime enforced)
- `stream`: transport mode (one response vs chunks)

---

## Response payload (anatomy)

```json
{
  "model": "ministral-3-3b-instruct-2512",
  "choices": [
    { "message": { "role": "assistant", "content": "..." } }
  ]
}
```

The text we usually display lives at:
`choices[0].message.content`

---

## LM Studio hookup (what must be true)

1) Download: `ministral-3-3b-instruct-2512`
2) Load the model
3) Start the server (OpenAI-compatible)
4) Confirm base URL (often `http://localhost:1234`)

---

## Equivalent curl (the “raw boundary”)

```bash
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ministral-3-3b-instruct-2512",
    "messages": [
      { "role": "system", "content": "Always answer in rhymes. Today is Thursday" },
      { "role": "user", "content": "What day is it today?" }
    ],
    "temperature": 0.7,
    "max_tokens": -1,
    "stream": false
  }'
```

---

## Activity: inspect the payload boundary

Goal:
- print request JSON
- print response JSON
- make one deliberate change and observe

Start here:
`Demos/Week 03/Activity 1 - LM Studio Hookup + Payload Inspection/`

---

## Mini-lab: temperature

Run the same request 3× at each temperature:

- `0` (stability)
- `0.2` (slight variation)
- `2.0` (ridiculous)

What changes first?

---

# Take-home
## Challenge packs (Week 03)

Pick one challenge pack and either emulate or extend it.

Bring:
- one payload snippet
- one output snippet
- one code change (optional)
- 1–2 questions

