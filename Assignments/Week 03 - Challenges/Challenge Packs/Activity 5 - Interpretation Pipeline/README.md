# Activity 5 — Interpretation Pipeline

## Human idea
Meaning emerges when outputs are *used to do things* (not just read).

## Boundary mapping (why this demo is built this way)
- **Input move:** request a structured schedule as strict JSON (`--format json`)
- **Output move:** parse the JSON and render a simple “schedule” artifact in code

This demonstrates: response JSON → parsing → transformation → an artifact.

## Run
Try a concrete prompt:
- `BASE_URL="http://localhost:1234" node index.js --prompt "Make a 45-minute study plan for reading a paper and taking notes." --format lines --debug`

If you want to compare, switch to plain text:
- `BASE_URL="http://localhost:1234" node index.js --prompt "Make a 45-minute study plan for reading a paper and taking notes." --format text --debug`

Optional (Week 04 direction): strict JSON
- `BASE_URL="http://localhost:1234" node index.js --prompt "Make a 45-minute study plan for reading a paper and taking notes." --format json --debug`

## What to look for
- In request JSON: see the contract added to the user message when `--format lines` (a simple line protocol).
- In output: notice how a tiny bit of structure lets the code render a deterministic schedule artifact.
- Compare `--format text` vs `--format lines`: same “idea,” different usability for programs.

## Code-reading hints (how to think)
- Start from the artifact: the printed schedule is produced by `renderSchedule`.
- Trace backward: `renderSchedule` needs `steps[]`, which comes from parsed JSON.
- Then ask: how did `steps[]` get created (the contract in the prompt + parsing)?

## Inquiries to pursue
- What kinds of experiences become possible when output is parseable?
- Where do errors live (prompt, model compliance, parsing)?
- What is “meaning” here: the prose, or the structured plan the system can enact?

## Prompting Codex (example prompts)
- “Add a strict JSON contract for a schedule and parse it into a printed plan.”
- “Validate required keys and show a friendly error when the contract fails.”

## Extensions
- Add `--total-minutes 45` and have the code verify the sum of durations matches.
- Add a second stage: “given the schedule, ask the model to critique it.”
