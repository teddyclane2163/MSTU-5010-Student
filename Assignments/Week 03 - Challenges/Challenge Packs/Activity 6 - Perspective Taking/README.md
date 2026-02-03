# Activity 6 — Perspective Taking

## Human idea
Systems can center/erase perspectives depending on framing.

## Boundary mapping (why this demo is built this way)
- **Input move:** encode a “plural perspective” requirement in the system message
- **Output move:** require structured JSON so the two perspectives remain distinct

## Run
Try a real tension:
- `BASE_URL="http://localhost:1234" node index.js --prompt "A student wants to use AI for every assignment. What are the tradeoffs?" --format json --debug`

## What to look for
- Does it produce two distinct views with equal care?
- Are tradeoffs explicit (not implied)?
- In the request payload, find the contract and the system framing.

## Code-reading hints (how to think)
- Start from evidence: in `--debug`, copy a distinctive word like `tradeoffs`.
- `Cmd+F` for it in `index.js` to find the output contract.
- Then `Cmd+F` for `systemMessage` to see the framing.

## Inquiries to pursue
- What gets gained/lost when you force “two perspectives”?
- When is forcing symmetry misleading?
- How does a format contract preserve distinction (vs a blended paragraph)?

## Prompting Codex (example prompts)
- “Add a strict JSON contract with student_view/instructor_view/tradeoffs.”
- “Add a system message that emphasizes equal care and no forced consensus.”

## Extensions
- Add a third perspective (`peer_view` or `institution_view`).
- Add a routing rule: if tradeoffs is empty, ask the model for more constraints.

