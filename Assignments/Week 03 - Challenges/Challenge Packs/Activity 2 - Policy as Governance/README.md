# Activity 2 — Policy as Governance

## Human idea
Rules shape behavior. “Alignment” and “tone” are not neutral: they are governance.

## Boundary mapping (why this demo is built this way)
- **Input move:** swap `system` policy via `--policy strict|creative`
- **Output move:** optionally require strict JSON via `--format json` and validate it in code

This makes “policy” visible as a designed constraint (not a vibe).

## Run
- Dry run (see request only):
  - `MODEL="demo" node index.js --prompt "Should we allow late assignments?" --dry-run --debug`
- Real run:
  - `BASE_URL="http://localhost:1234" node index.js --prompt "Should we allow late assignments?" --policy strict --debug`
  - `BASE_URL="http://localhost:1234" node index.js --prompt "Should we allow late assignments?" --policy creative --debug`

Try the output contract:
- `BASE_URL="http://localhost:1234" node index.js --prompt "Should we allow late assignments?" --policy strict --format json`

Note: Some models wrap JSON in markdown fences (```json ... ```). The script strips these so you can focus on the idea, not the formatting.

## What to look for
- In request JSON:
  - How does `system` change between policies?
  - Does `messages` ordering stay the same?
- In response:
  - Does the assistant ask questions first (strict)?
  - Does it generate options + assumptions (creative)?

## Code-reading hints (how to think)
- Start from evidence: in `--debug`, copy a distinctive phrase from the `system` message.
- `Cmd+F` that phrase in `index.js` and find the mapping (policy → system string).
- Then `Cmd+F` for `messages:` to see where policy becomes the prompt.

## Inquiries to pursue
- When you encode “strictness,” what do you gain/lose?
- What does the assistant do when information is missing under each policy?
- Is governance coming from your policy text, your temperature, or your interpretation?

## Prompting Codex (example prompts)
- “Add a `--policy strict|creative` flag that changes only the system message.”
- “Add `--format json` that appends a strict JSON contract to the user message and validates it (no libraries).”
- “If JSON parsing fails, print a ‘contract failed’ error and show the raw output.”

## Extensions
- Add a third policy: `policy=careful` (“state uncertainty; ask 1 question; avoid assumptions”).
- Add a logging mode: `--log logs/policy.json` to save `{request,response}` and compare runs.
- Add a “policy diff” section that prints only the system message for quick comparisons.
