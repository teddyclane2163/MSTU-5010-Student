# Week 06 — AGENTS.md Tutorial Guide

## Who this is for
Students who have already built mini-projects with AI tools and want to collaborate with agents more intentionally.

## What this guide helps you answer
- What is an agent in practical terms?
- How do agents actually work during a task?
- Why should you write AGENTS.md instead of relying on default behavior?
- How do you turn your own project struggles into useful agent rules?

## Quick definition
An AI coding agent is a system that can read your project context, reason about a task, use tools (like terminal commands and file edits), and produce changes.

`AGENTS.md` is a project instruction file that tells the agent how to behave in your workspace.
Think of it as a collaboration contract.

## AGENTS.md in plain terms (what, where, effect)
- What it is:
  - A plain text instruction file for how an agent should work in a project space.
- Where it can live:
  - At the repo root (broad policy for most work).
  - In a subfolder (local policy for that folder and its children).
  - In multiple places (root + one or more subfolder files).
- What effect location has:
  - Root file sets general expectations.
  - Subfolder file specializes behavior for local work.
  - In practice, the most local applicable instructions should guide behavior.

## Important filename note (for this tutorial)
For examples referenced in this guide, we use `AGENTS-DEMO-*.md` files.
We intentionally do **not** name these files `AGENTS.md` so coding tools do not load them as real project policy by accident.

Example files used in this guide:
- `Documents/Week 06 - AGENTS.md Crash Course/Examples/AGENTS-DEMO-01-Layperson.md`
- `Documents/Week 06 - AGENTS.md Crash Course/Examples/AGENTS-DEMO-02-Boundary-Loop.md`
- `Documents/Week 06 - AGENTS.md Crash Course/Examples/AGENTS-DEMO-03-Learning-Collaborator.md`

## How agents work (simple mental model)
A typical agent loop looks like this:
1. You give a task.
2. The agent reads instructions and project context.
3. The agent inspects files and gathers evidence.
4. The agent proposes/executes edits.
5. The agent runs checks where possible.
6. The agent reports what changed and what remains risky.

Where AGENTS.md matters:
- It shapes what context the agent prioritizes.
- It sets boundaries on what the agent may edit.
- It defines what quality checks are required before "done."
- It determines when the agent should stop and ask instead of guessing.

## Why use AGENTS.md
Without a policy file, agents default to general behavior.
That can still work, but it is less aligned with your project and less predictable.

With a good AGENTS.md, you get:
- Better consistency across sessions.
- Fewer risky or off-target edits.
- Clearer boundaries between public and private material.
- Faster collaboration because expectations are explicit.
- Better learning habits if you include reflection rules.

## Key words and definitions
- AGENTS.md: repository instruction file for AI collaboration behavior.
- Scope: where the agent can operate.
- Privacy boundary: explicit rule that blocks private-to-public leakage.
- Guardrail: a safety or risk-reduction rule.
- Workflow constraint: required process steps.
- Quality gate: a measurable completion check.
- Escalation rule: what to do when uncertain or blocked.
- Collaboration contract: shared human-agent working agreement.

## Core conceptual ideas
- Same model, different outcomes: instructions shape results.
- Constraints can increase speed by reducing rework.
- Safety must be designed explicitly.
- Good policies are testable, not vague.
- AGENTS.md can support learning, not only task execution.

## What to put in AGENTS.md (starter structure)
Use six blocks:
1. Scope rules
2. Prohibited actions
3. Workflow expectations
4. Quality gates
5. Escalation behavior
6. Output expectations

### Example (plain-language starter)
```md
# AGENTS

## Scope
- Work only inside this repository.
- Edit files under `src/` and `docs/` only unless asked.

## Do not
- Do not copy content from private notes into public materials.
- Do not run destructive git commands.

## Workflow
- Inspect relevant files before editing.
- Keep changes focused and minimal.

## Quality gates
- Run project checks listed in README before finishing.
- Report what was tested and what was not tested.

## Escalation
- If instructions conflict or context is missing, stop and ask.

## Output Expectations
- List files changed and summarize why.
- Note remaining risks or follow-up tasks.
```

## Rule quality checklist
Before keeping a rule, ask:
- Is it specific?
- Is it observable?
- Is it bounded?
- Is it actionable?
- Is fallback behavior clear?

### Quick sentence examples (good vs anti-example)
- Specific:
  - Good: "Edit only files under `src/interaction/`."
  - Anti-example: "Only edit relevant files."
- Observable:
  - Good: "Before finishing, list every file changed."
  - Anti-example: "Show your work."
- Bounded:
  - Good: "Do not modify dependencies unless explicitly requested."
  - Anti-example: "Avoid large changes."
- Actionable:
  - Good: "Run `npm test` and report pass/fail."
  - Anti-example: "Make sure quality is good."

## Common anti-patterns
- Vague language ("be careful", "do your best").
- Too many rules with no priority.
- Contradictory instructions with no escalation path.
- Copying policy from another repo without adapting to local context.

## Progressive examples (at-home reference set)
These are examples of increasing sophistication for you to review outside class.
In class, we build a simple policy from a blank `AGENTS.md` together.

### Example 1 (layperson starter)
Policy file: `AGENTS-DEMO-01-Layperson.md`
- Shows plain-language rules anyone can understand.
- Good base scaffold for co-writing in class.

### Example 2 (course-context boundary loop)
Policy file: `AGENTS-DEMO-02-Boundary-Loop.md`
- Encodes input decision, behavior observation, output translation, and failure policy.
- Connects AGENTS policy to your mini-project architecture.

### Example 3 (advanced learning collaborator)
Policy file: `AGENTS-DEMO-03-Learning-Collaborator.md`
- Adds reflection, commit rationale, and coaching question behaviors.
- Useful for building long-term learning habits.

## From project reflection to AGENTS rules
You just finished mini-projects. Use that experience as policy input.

### Step 1: Reflection prompts
- What did you learn that you want to keep doing?
- Where did you struggle repeatedly?
- What support from an agent would have helped most?

### Step 2: Translate reflections into policy categories
- Repeated mistakes -> prohibited actions or quality gates.
- Ambiguous process -> explicit workflow steps.
- Learning goals -> reflection/coaching rules.

### Step 3: Co-author a draft
- Start from a blank `AGENTS.md`.
- Add:
  - 3 scope rules
  - 3 quality gates
  - 2 prohibited actions
  - 1 learning reflection rule
- Keep only rules that pass the quality checklist.

### Step 4: Test and revise
- Run one real task with the draft policy.
- Identify one rule that failed in practice.
- Rewrite that rule to be more specific and testable.

## Creative uses beyond basic task control
- Learning log policy after each task.
- Commit rationale template tied to boundary decisions.
- Reviewer-mode policy for self-critique before submit.
- Coaching-question policy that asks one improvement question each cycle.
- Role-based policies (builder, critic, tester) for different folders.

## FAQ (student-facing)
### Is AGENTS.md required to use agents?
No. But it usually makes results safer, clearer, and more consistent.

### If AGENTS.md is in a subfolder, what happens?
It can guide work in that subfolder area. Local policies can specialize behavior for that context.

### Should AGENTS.md be very long?
Usually no. Start short and clear. Expand only when a real failure shows you need another rule.

### Can AGENTS.md help me learn, not just code?
Yes. Add reflection, rationale, and coaching rules to turn each task into a learning cycle.

## 30-minute class run of show (suggested)
Slides note:
- The slide deck is designed as a 15-minute crash-course segment that fronts this 30-minute workshop.

1. 0:00-10:00 Crash course: keywords, concepts, implementation guide.
2. 10:00-16:00 Reflection: what students learned, struggled with, and want support on.
3. 16:00-24:00 Translation: convert reflections into candidate rules.
4. 24:00-30:00 Build: co-author one practical AGENTS draft together.

## Exit challenge
Draft a 12-20 line AGENTS policy for your mini-project with:
- 3 scope rules
- 3 quality gates
- 2 prohibited actions
- 1 learning reflection rule

Then run one real task and revise one rule that failed in practice.
