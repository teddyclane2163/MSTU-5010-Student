# Activity 3 — REPL Chat + Structured Output (JSON Schema) (Week 04)

## Goal
Same app idea as Activity 2, but with a **strict output contract**:

- the model must output **valid JSON only**
- the JSON must conform to a **JSON Schema**
- our wrapper can then route behavior deterministically (music selection)

This is the bridge from “prompted structure” → **structured output**.

## Prereqs
- Node.js **18+** (`node -v`)
- LM Studio running in **OpenAI-compatible** mode
- A model loaded in LM Studio

Audio files expected in:
- `Demos/Week 04/assets/` (`happy.mp3`, `sad.mp3`, `neutral.mp3`, `error.mp3`)

## Step 1: Add the JSON Schema to LM Studio
Open LM Studio and look for a setting related to **Structured Output** / **JSON Schema** for the chat/server.

Paste the contents of `schema.json` into that JSON Schema field.

If LM Studio has a toggle like “JSON only” / “strict JSON”, enable it.

## Step 2: Use the system prompt
Use `system-prompt.txt` as the system prompt/instructions.

## Step 3: Run the REPL
From this folder:
- `node index.js --base-url http://127.0.0.1:1234`

Debug mode:
- `node index.js --base-url http://127.0.0.1:1234 --debug`

Optional:
- `node index.js --base-url http://127.0.0.1:1234 --model ministral-3-3b-instruct-2512`

Note:
- Your LM Studio base URL and model id may differ.
- If your base URL already ends with `/v1`, that’s OK (the script normalizes either form).
- If `localhost` gives `fetch failed`, use `127.0.0.1` (some setups resolve `localhost` to IPv6 `::1`).

## What we’ll discuss in class today
- What failure looks like under “strict schema” (refusal, invalid JSON, wrong enum, missing keys)
- Whether strictness reduces drift over multiple turns
- What new deterministic behaviors become possible when structure is reliable
