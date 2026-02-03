# Activity 4 — Dependence and Delegation

## Human idea
When systems “work,” we stop checking. Delegation shifts responsibility and understanding.

## Boundary mapping (why this demo is built this way)
- **Input move:** optionally require a “metacognitive” output contract (`--require-assumptions`)
- **Output move:** fail closed if the contract is not met (parse JSON; otherwise show raw output)

This demonstrates that your code can force “evidence” instead of letting you accept fluent text by default.

## Run
- Normal:
  - `BASE_URL="http://localhost:1234" node index.js --prompt "Is it a good idea to use AI for studying?" --debug`
- Require assumptions:
  - `BASE_URL="http://localhost:1234" node index.js --prompt "Is it a good idea to use AI for studying?" --require-assumptions --debug`

## What to look for
- Does the model expose assumptions or uncertainty when required?
- Does it ask for missing info (instead of inventing it)?
- What happens when the model fails the contract (you’ll see “CONTRACT FAILED”)?

## Code-reading hints (how to think)
- Start from behavior: when `--require-assumptions` is on, why does the output format change?
- `Cmd+F` for `--require-assumptions`, then follow where it changes the user message.
- `Cmd+F` for `tryParseJson` to see the “fail closed” gate.

## Inquiries to pursue
- What changes when you require assumptions vs when you don’t?
- What kinds of delegation feel safe vs unsafe?
- What new responsibilities does your wrapper take on?

## Prompting Codex (example prompts)
- “Add a flag that requires strict JSON output with assumptions and uncertainty.”
- “If JSON parse fails, exit with code 2 and print the raw output.”

## Extensions
- Add a second gate: require citations to parts of the prompt/context (even if they’re “local citations” like quoting a sentence).
- Add `--score` that asks the model to rate its confidence and route to follow-up questions when low.

