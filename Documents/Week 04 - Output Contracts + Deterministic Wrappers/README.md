# Week 04 — Output Contracts + Deterministic Wrappers

## Where we are
Last week (Week 03) we treated the payload as a design surface (system/context/temperature).

This week we focus on **structured output**:
how to get outputs that programs can reliably interpret to do deterministic things.

## Start here (Week 04 index)
- Demos: `Demos/Week 04/`
- Assignment outline: `Assignments/Week 04 - Boundary Decisions/README.md`
- Slides: `Slides/Week 04 - Output Contracts + Deterministic Wrappers.md`
- Supplement: `Documents/Week 04 - Output Contracts + Deterministic Wrappers/JSON-Schema-Crash-Course.md`
- Supplement: `Documents/Week 04 - Output Contracts + Deterministic Wrappers/End-to-End-Interaction-Loop.md`
- Supplement: `Documents/Week 04 - Output Contracts + Deterministic Wrappers/Agent-Guide.md`

## Week 04 checklist (what you should be able to do)
- Explain what an **output contract** is (in one sentence).
- Show one example of **drift** (and name the failure type).
- Explain the strictness triangle: **reject / normalize / retry**.
- Point to one specific field your code routes on (example: `do.sound`).

## The problem
Text is readable by humans.

Structure is usable by programs.

If you want software behavior, you need:
- an **output contract** (what shape the model must return), and
- a **wrapper** (code that validates and routes the output into actions).

## Key terms (minimal set)
- **Output contract**: a rule for what the model must output (format)
- **Structured output**: machine-readable output (commands / JSON)
- **Validation**: checking the output matches the contract
- **Routing**: “if output looks like X, do Y”
- **Deterministic wrapper**: code around the model that enforces rules/state/actions
- **JSON Schema**: a formal specification for what JSON is allowed (required keys, types, and allowed values)

## Drift taxonomy (what breaks first)
When you ask for structure, watch for these common failure modes:
- **Format leakage**: extra text before/after JSON; markdown fences; multiple JSON objects
- **Invalid JSON**: comments, trailing commas, missing quotes, partial objects
- **Schema drift**: missing keys/new keys; wrong types; nested shapes you didn’t ask for
- **Instruction slippage**: obeys on turn 1, “forgets” on turn 3+
- **Over-interpretation**: invents actions/emotions with certainty you didn’t request

## What we’ll do in class (Week 04)
We’ll work through three demos in order:

### 1) Ask for JSON (prompt-only)
We start by asking the model to respond in a specific JSON shape.

You’ll quickly see “drift” and “breakage”:
- extra text outside JSON
- markdown fences
- invalid JSON (comments, trailing commas)
- missing keys or changed types across turns

The point is not to blame the model. It’s to see the boundary clearly.

### 2) Route behavior from structure
Next, we treat the model output as data and route behavior:
- parse output → find a specific field (example: `do.sound`)
- if it matches allowed values → trigger a deterministic action
- otherwise → trigger an error path

This shows how “structure” enables software behavior.

### 3) Use Structured Output (JSON Schema)
Finally, we use a **JSON Schema** to guide strict adherence:
- valid JSON only
- required keys
- correct types
- constrained values (enums)

This reduces drift and makes parsing reliable.

## The strictness triangle (a design choice)
When output breaks, your wrapper needs a policy. Three common choices:
- **Reject (fail closed):** stop and show a contract error (safest; least magical).
- **Normalize:** strip obvious formatting issues (code fences, extra whitespace) and retry parsing.
- **Retry:** ask the model to re-output *only* valid JSON that matches the contract.

There is no neutral default—each option trades off safety, usability, and complexity.

## What we’ll discuss in class today
- What kinds of drift were most common (and why)?
- What should a wrapper do when output breaks?
  - reject (fail closed)
  - normalize (strip fences / trim extra text)
  - retry (ask for corrected JSON)
- Where does control live now: prompt, schema, or wrapper?

## Tooling notes (LM Studio + local servers)
- Your base URL and model id may differ from examples.
- Some servers accept “JSON Schema structured output” settings; some don’t.
- Even with schema, failures still happen (refusal, wrong enum, missing key). That’s useful evidence.

## REPL (what it is, why we use it)
A **REPL** is a loop that repeatedly:
1) reads your input (a line of text),
2) runs the program (calls the model + parses output),
3) prints a result,
4) repeats.

Why it’s good for Week 04:
- It makes multi-turn drift visible.
- It makes “model output → parser → deterministic behavior” feel concrete.

## Prompting Codex to build your own REPL experiments
Example prompts you can give Codex (adjust as needed):
- “Create a Node.js REPL chat app that sends `messages[]` to my LM Studio OpenAI-compatible endpoint and prints the assistant reply.”
- “Add a `--debug` flag that prints raw assistant output and the parsed JSON.”
- “Require the assistant to output JSON with keys `think`, `say`, `feel`, `do` and parse it with `JSON.parse`.”
- “Route behavior based on a field like `do.sound` (use a small allowed set; otherwise route to `error`).”
- “When parsing fails, show the raw output and explain *why* it failed (no silent failures).”

## Take-home direction
Design a tiny experience that uses:
- one **input move** (policy/context), and
- one **output move** (contract + deterministic behavior).

Deliverable (suggested):
- your contract (prompt + schema if used)
- one failure case you observed
- one routing rule (what your wrapper does)

## Submission template (copy/paste)
- Contract (prompt and/or schema):
- What field you route on:
- One run that succeeded:
- One run that failed:
- Failure type (from drift taxonomy):
- Wrapper policy choice (reject/normalize/retry) + why:
