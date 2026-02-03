# Activity 1 — LM Studio Hookup + Payload Inspection (Week 03)

## Goal
Get a real request/response working against a local LLM (LM Studio) and learn to **read the payload boundary**:

- **Request JSON**: what you actually sent (`model`, `messages`, `temperature`)
- **Response JSON**: what you actually got back (`choices[0].message.content`)
- **Error JSON**: what failure looks like (wrong base URL / wrong model / server not running)

This is not about “best prompting.” It’s about **data awareness** and **designed structure**.

---

## Prereqs
- Node.js **18+** (`node -v`)
- LM Studio installed
- The model `ministral-3-3b-instruct-2512` downloaded in LM Studio

---

## LM Studio setup (one-time)
In LM Studio:
1. Search for and download: `ministral-3-3b-instruct-2512`
2. Load the model (so it’s the active model).
3. Open the **Server** / **Local Server** screen.
4. Start the server in **OpenAI-compatible** mode.
5. Confirm:
   - **Base URL** (often `http://localhost:1234`)
   - **Model id** shown by LM Studio is `ministral-3-3b-instruct-2512`

---

## Run (quick start)
From this folder:

1) **Dry run** (no network): prints request payload only
- `MODEL="demo" node index.js --prompt "Hello" --dry-run --debug`

2) **Real run** (calls LM Studio)
- `BASE_URL="http://localhost:1234" node index.js --prompt "Say hello in one sentence." --debug`

If your base URL already includes `/v1`, that’s OK too:
- `BASE_URL="http://localhost:1234/v1" node index.js --prompt "Hello" --debug`

### Equivalent `curl` (same endpoint, same payload shape)
This is the same API call, expressed as a raw HTTP request:

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

## Abstract example: request + response payloads

This is a **representative** example of the payload boundary. Your exact values will differ, but the *shape* is the point.

### Request payload (what you send)

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

What each part is doing (in plain language):
- `model`: which model the server should run
- `messages`: the *designed context* you give the model
  - `system`: policy/role framing (governance)
  - `user`: the user’s input
- `temperature`: how stable vs varied responses tend to be
- `max_tokens`: output limit (`-1` means “let the server decide” in LM Studio)
- `stream`: whether you want one JSON response (`false` here)

### Response payload (what you receive)

```json
{
  "id": "chatcmpl_example",
  "object": "chat.completion",
  "created": 0,
  "model": "ministral-3-3b-instruct-2512",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "In rhymes I say, it’s Thursday today…"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```

Where the answer is:
- Assistant text lives at: `choices[0].message.content`

What each part is doing (in plain language):
- `id`: a unique id for this completion (useful for logging/debugging)
- `object`: the type of response (helps clients distinguish response shapes)
- `created`: timestamp/created marker (server-defined)
- `model`: which model actually produced the output
- `choices`: one or more candidate outputs
  - `index`: which choice this is (0 is the first)
  - `message`: the assistant message object
    - `role`: usually `"assistant"`
    - `content`: the assistant text (the thing you typically display)
  - `finish_reason`: why generation stopped (e.g., `"stop"`, `"length"`)
- `usage`: token counts (may be missing or approximate depending on server)

Note: Fields like `id`, `created`, and token counts may vary by server/model. Focus on the `choices` shape.

---

## What to look for (payload literacy checklist)

### A) Request JSON
When you run with `--debug`, find:
- `model`: the model id you selected
- `messages`: an array of `{ role, content }`
  - `role: "system"` sets policy / relationship framing
  - `role: "user"` is the user’s input
- `temperature`: variability control
- `max_tokens`: output limit (`-1` means “let the server decide” in LM Studio)
- `stream`: whether results come back as one JSON response (`false` for this activity)

### B) Response JSON
Find where the “assistant text” actually lives:
- `choices[0].message.content`

### C) Error JSON (evidence of the boundary)
Try a controlled failure (pick one):

1) Wrong port (most reliable)
- `BASE_URL="http://localhost:9999" node index.js --prompt "Hello"`

2) Server stopped (most reliable)
- Stop the LM Studio server, then run:
  - `BASE_URL="http://localhost:1234" node index.js --prompt "Hello"`

3) Wrong model id (may or may not fail, depending on server)
- `BASE_URL="http://localhost:1234" MODEL="WRONG_MODEL" node index.js --prompt "Hello"`
- If this *still works*, check the response payload’s `model` field in `--debug`.
  - Some servers ignore unknown `model` values and just run the currently loaded model.
  - In practice: if the server already has a model loaded and ready, it may “default” to that model even when you send `WRONG_MODEL`.
  - If you want `WRONG_MODEL` to fail on purpose, unload/eject the model (or stop the server) first, then run the command.

Observe:
- what error you get (HTTP status vs connection error)
- any `error.message` in the JSON payload (the script prints it when present)

---

## One deliberate intervention: `--mode`
This script supports `--mode` to change **only the `system` message**.

Run the same user prompt 3 times:
- `... node index.js --prompt "Help me plan a study session." --mode tool --debug`
- `... node index.js --prompt "Help me plan a study session." --mode companion --debug`
- `... node index.js --prompt "Help me plan a study session." --mode auditor --debug`

What changed? What stayed the same? Where is that change “coming from”?

### Code-reading hint (how to find where `--mode` affects the payload)
If you want to locate the relevant code (without reading the whole file), try this strategy:
- Start from **evidence** (what you can see):
  - In your printed request JSON (`--debug`), you can see the `system` message text.
- Then “reverse engineer” where it comes from:
  - In `index.js`, `Cmd+F` (or `Ctrl+F`) for a distinctive word from the system text, like `companion` or `auditor`.
  - When you find that string, look for the small mapping logic that chooses between system messages.
- Then connect it back to the payload:
  - Search for `messages:` or `buildRequest` and confirm where that chosen system string gets inserted into `messages[0]`.
- (Alternative path) If you prefer following data flow:
  - Search for `--mode` → see where it’s parsed → follow `args.mode` forward until it influences the system message.

---

## Mini-lab (10–15 min)
Do 3 runs and change **one variable at a time**:

1) Change only `--mode`
2) Change only `--temperature` (e.g., `0.2` vs `1.0`)
3) Change only the **user prompt** (keep everything else fixed)

### Temperature experiment (recommended)
Keep **everything** the same (same prompt, same `--mode`) and run each command **3 times** to see stability vs variation.

Use any prompt you like. Example:
- `--prompt "What day is it today?" --mode tool`

Run three temperature bands:

1) **Temperature = 0** (stability)
- `BASE_URL="http://localhost:1234" node index.js --prompt "What day is it today?" --mode tool --temperature 0 --debug`

2) **Temperature = 0.2** (slight variation)
- `BASE_URL="http://localhost:1234" node index.js --prompt "What day is it today?" --mode tool --temperature 0.2 --debug`

3) **Temperature = ridiculous** (variation / drift)
- `BASE_URL="http://localhost:1234" node index.js --prompt "What day is it today?" --mode tool --temperature 2.0 --debug`

What to notice:
- Does the output stay the same across repeated runs at `0`?
- At what point does it start changing wording, adding assumptions, or drifting?
- In `--debug`, confirm the only thing changing in the request payload is `temperature`.

Write a 5-bullet log:
- what you changed
- what changed in the output
- what changed in the request payload
- what boundary that reveals (control/agency/dependence/creativity)

---

## Optional: save the response payload
Add `--out` to save full response JSON to a file:
- `... node index.js --prompt "Hello" --debug --out response.json`

---

## Troubleshooting
- Server not running → connection refused / fetch fails
- Wrong base URL/port → connection refused / 404
- Wrong model id → may return an error payload, or may be ignored (check response `model`)
- Node < 18 → `fetch` not found
