# Activity 7 — Uncertainty as a First-Class Object

## Human idea
Knowing what you don’t know is part of learning. Systems can either hide uncertainty or surface it.

## Boundary mapping (why this demo is built this way)
- **Input move:** require structured output with `confidence` and what evidence is needed
- **Output move:** code routes behavior:
  - low confidence → show follow-up questions/evidence needed
  - higher confidence → show answer

## Run
Try a prompt that invites uncertainty:
- `BASE_URL="http://localhost:1234" node index.js --prompt "What will the weather be in NYC next Tuesday?" --debug`

Notice: the model doesn’t have live data. Good uncertainty design matters.

## What to look for
- Does confidence feel calibrated?
- Are follow-up questions actionable?
- Does routing change the “experience” (questions vs answer)?

### Output-reading hint (important)
This demo does **not** print the whole model output every time.

- The model returns a full JSON object with multiple fields.
- The script then chooses what to print based on `confidence`.

What to do:
- Run once with `--debug` and compare:
  - the full response payload (`RESPONSE JSON`)
  - what the script prints after routing (“LOW CONFIDENCE …” vs “HIGHER CONFIDENCE …”)
- Ask: what fields existed in the model output that did *not* get shown to you? Why?

## Code-reading hints (how to think)
- Start from behavior: why do you see “LOW CONFIDENCE → ask follow-ups”?
- `Cmd+F` for `confidence` and find the routing threshold in code.
- Then trace back to the output contract.

## Inquiries to pursue
- When should a system ask questions vs give answers?
- What happens if you set the threshold to 0.8 vs 0.3?
- Is uncertainty a property of the model, or a design decision in your wrapper?

## Prompting Codex (example prompts)
- “Add a strict JSON contract with confidence and evidence_needed.”
- “Implement routing: if confidence < 0.5 print follow_up_questions else print answer.”
- “Log request/response/parsed output for inspection.”

## Extensions
- Add a second stage: if low confidence, automatically send a follow-up prompt using the questions.
- Add a `--threshold` flag so students can experiment with routing policy.
