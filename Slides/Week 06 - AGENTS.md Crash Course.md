---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section { font-size: 27px; }
  pre { font-size: 18px; }
---

# Week 06
## AGENTS.md Crash Course

**15-minute crash course (front half of a 30-minute workshop)**

---

## Why this matters (vignette)

You ask an agent to polish your project docs.
It edits the wrong folder, misses checks, and includes notes you did not want shared.

Same model. Same task.
Different result when clear project rules exist.

---

## How AGENTS.md helps

AGENTS.md gives the agent a local collaboration contract:
- where it can work
- what it must not do
- what "done" requires
- when to stop and ask

Less ambiguity -> fewer surprises.

---

## AGENTS.md in plain terms

- It is a file with repo instructions for agents.
- It can live at:
  - repo root (broad rules)
  - subfolder (local/specialized rules)
  - both root and subfolders
- Effect:
  - root gives default policy
  - local file refines policy for that area

---

## Filename note for student document examples

In the student guide examples, filenames are:
- `AGENTS-DEMO-01-Layperson.md`
- `AGENTS-DEMO-02-Boundary-Loop.md`
- `AGENTS-DEMO-03-Learning-Collaborator.md`

These names are for reference examples.
In class, we will build from a blank `AGENTS.md`.

---

## Keywords to know

- Scope
- Privacy boundary
- Guardrail
- Workflow constraint
- Quality gate
- Escalation rule

---

## Good policy, very simply

A good rule is:
- specific
- observable
- bounded
- actionable

---

## Basic blocks: simple examples

- Scope:
  - "Edit only files under `project/src/` and `project/docs/`."
- Prohibited actions:
  - "Do not run destructive git commands (`reset --hard`, `checkout --`)."
- Workflow steps:
  - "Read related files first, then make the smallest possible change."
- Quality gates:
  - "Run `npm test` before finishing and report pass/fail."
- Escalation rules:
  - "If instructions conflict, stop and ask before editing."
- Output expectations:
  - "At the end, list files changed, tests run, and any remaining risks."

---

## Sentence examples vs anti-examples

- Specific:
  - Good: "Edit only files under `src/interaction/`."
  - Anti: "Only edit relevant files."
- Observable:
  - Good: "List every file changed before finishing."
  - Anti: "Show your work."
- Bounded:
  - Good: "Do not change dependencies unless requested."
  - Anti: "Avoid big changes."
- Actionable:
  - Good: "Run `npm test` and report pass/fail."
  - Anti: "Make sure quality is good."

---

## Workshop 1: Reflect

From mini-project week:
- What did you learn?
- What challenged you most?
- Where do you want better support?

---

## Workshop 1: Do this now

1. Open/create `notes/agents-reflection.md`.
2. Write 3 bullets for each prompt:
   - keep doing
   - recurring struggle
   - support you want from an agent
3. Circle the top 2 high-impact struggles.

Output of this step:
- a short reflection list you can translate into policy.

---

## Workshop 2: Translate

Convert reflections into AGENTS rules:
- repeated errors -> prohibited actions / quality gates
- confusion points -> workflow steps
- growth goals -> reflection / coaching rules

---

## Workshop 2: Do this now

1. Create a 2-column list in `notes/agents-reflection.md`:
   - `Reflection pattern`
   - `Policy rule`
2. Convert at least 6 items into candidate rules.
3. Keep only rules that are:
   - specific
   - observable
   - bounded
   - actionable

Output of this step:
- 6 candidate rules ready for AGENTS.md.

---

## Workshop 3: Build from blank

Co-author one `AGENTS.md` with:
- 3 scope rules
- 3 quality gates
- 2 prohibited actions
- 1 reflection rule

Test one task, then revise one rule.

---

## Workshop 3: Do this now

1. Create `AGENTS.md` at your repo root.
2. Paste this starter scaffold (part 1):

```md
# AGENTS

## Scope
- Edit only files under `src/` and `docs/`.
- Do not edit config/dependencies unless requested.

## Prohibited Actions
- Do not run destructive git commands.
- Do not move private/sensitive content into public files.

## Workflow
- Inspect related files before editing.
- Make minimal, focused changes.

## Quality Gates
- Run required project checks before finishing.
- Report what passed, what failed, and what was not run.
```

---

## Workshop 3: Do this now (continued)

3. Add this scaffold section (part 2):

```md

## Escalation
- If instructions conflict or context is missing, stop and ask.

## Output Expectations
- List files changed and summarize why.
- Note remaining risks or follow-up tasks.
```

4. Replace placeholder lines with your 6 candidate rules.
5. Run one real task with this file and rewrite one weak rule.
