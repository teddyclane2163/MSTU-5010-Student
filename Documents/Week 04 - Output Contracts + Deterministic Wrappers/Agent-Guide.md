# Working With Code Assistants (Codex / Claude / Gemini) — Week 04 Supplement

This guide helps you use an AI coding assistant as a **thinking partner**, not just an answer machine.
The goal is to make your *design choices* explicit: interaction goal → boundary decisions → schema → code.

---

## Cognitive practices (how to think with the agent)

Use these practices as *moves* when you engage the agent. They are more important than any single prompt.

1) **Define the problem**  
   State the goal in one sentence and name one non‑goal.

2) **Compare analogies**  
   Ask: “What is this like?” (routing tables, forms, protocols, contracts).

3) **Establish causal relationships**  
   Ask: “If I change X (schema, temperature, routing), what should happen?”

4) **Inquiry (ask good questions)**  
   Ask for alternatives, failure modes, and hidden assumptions.

5) **Model situations**  
   Request a diagram, a flow, or a step‑by‑step system map.

6) **Argue and reason**  
   Ask the agent to defend a choice and then try to refute it.

7) **Metacognitive reflection**  
   “What am I assuming? What evidence would change my mind?”

---

## Mindset: what the agent is (and isn’t)

**The agent is good at:**
- drafting options and alternatives
- turning design ideas into concrete structures (schemas, prompts, routing logic)
- explaining tradeoffs you might not see yet

**The agent is not:**
- the decision-maker
- a source of truth about your goals
- a substitute for testing or judgment

Your job: **state the goal, ask for options, then decide and justify.**

---

## The process (and how to engage at each phase)

### 1) Clarify the interaction goal
**Your task:** describe the human experience you want.

**Good prompts:**
- “Here’s the interaction I want (1–2 sentences). Give me 3 boundary designs that could create this experience.”
- “What should this system never do? Suggest constraints I could encode in the system prompt or schema.”

**Cognitive practice:** define the problem + compare analogies before choosing a design.

---

### 2) Make boundary decisions (phases + levers)
**Your task:** decide *where* to place control (prompt, schema, wrapper).

**Good prompts:**
- “Given this interaction, which phase should carry the strongest control? Why?”
- “List tradeoffs between enforcing this in the prompt vs schema vs wrapper.”
- “What failure modes should I expect if I only use a prompt?”

**Cognitive practice:** establish cause‑effect (“If I change X, what should happen?”).

---

### 3) Design the output contract
**Your task:** pick a structured output shape and justify it.

**Good prompts:**
- “Draft a JSON Schema for this interaction. Keep it minimal and explain each key.”
- “Suggest 2 alternate schemas: one strict, one flexible.”
- “Which fields should be enums (if any), and why?”

**Cognitive practice:** compare analogies + argue for one design over another.

---

### 4) Plan the wrapper behavior
**Your task:** decide how code will parse, validate, and route.

**Good prompts:**
- “Given this schema, what should the wrapper do on failure: reject, normalize, or retry? Give pros/cons.”
- “Write pseudocode for routing based on `do.sound` (or your chosen field).”

**Cognitive practice:** argue + reason about tradeoffs and consequences.

---

### 5) Implement and test (small loops)
**Your task:** build a small, testable loop.

**Good prompts:**
- “Generate a minimal REPL that sends `messages[]` to my local OpenAI-compatible server.”
- “Add a `--debug` flag that prints raw output, parsed output, and the chosen route.”
- “Add a failure case: if parsing fails, log and continue with a fallback.”

**Cognitive practice:** model the situation + reflect after each test.

---

## Example: from idea → contract → code

**Idea:** “A calm study companion that asks one clarifying question first.”

**Ask the agent:**
- “Propose 2 schema designs for this interaction (strict vs flexible).”
- “Which fields will the wrapper route on? Explain why.”
- “Draft a minimal REPL that enforces the contract and routes behavior.”

**Your decision:**
Pick one schema and explain why it fits the interaction.

---

## Prompts that build cognitive habits

Use these to **make yourself the primary reasoner** and the agent your counter‑partner.

- “I’ll propose 2 designs. You ask me questions until you can choose one, then tell me why you chose it.”
- “I’ll state my assumptions. Challenge the weakest one and ask me to justify it.”
- “I’ll explain why I picked this schema. Try to find a counter‑example and make me revise.”
- “I’ll write the routing rule. Ask me to defend it against one failure case.”
- “I’ll propose a minimal test. Ask me how it would fail and what evidence would change my mind.”

---

## Quick prompt patterns (by practice)

**Define the problem**  
- “I’ll state the goal and one non‑goal. Ask me what would count as success or failure.”

**Compare analogies**  
- “I’ll give an analogy. Push back on it and suggest a better one if it’s weak.”

**Establish causal relationships**  
- “I’ll predict what changes if I tighten the schema. Challenge my causal claim.”

**Inquiry**  
- “Ask me the most important question I’m avoiding about this design.”

**Model situations**  
- “I’ll sketch the loop. Ask me where it’s weakest or ambiguous.”

**Argue and reason**  
- “I’ll argue for this design. Challenge it, then ask me to respond.”

**Metacognitive reflection**  
- “Ask me what I’m assuming that could make this design fail.”

---

## What to submit (if required)
- Your interaction goal (1–2 sentences)
- Your boundary decisions (phase-by-phase)
- Your schema + justification
- Your wrapper policy (reject/normalize/retry)
- One failure case and how you handled it

---

## Reminder
The assistant can help you reason, but **you** own the design.
Good work is not just “getting an answer”—it’s making defensible decisions.

---

## Mini exercise: Teach the agent

**Goal:** use the agent as a learning mirror by explaining your design clearly.

1. **You teach first.**  
   Explain your interaction + schema in 4–6 sentences.

2. **Ask for a mirror.**  
   Prompt:  
   “Paraphrase my design in your own words. If you misunderstood anything, ask me 2 clarifying questions.”

3. **Check for gaps.**  
   Compare the paraphrase to your original intent.  
   If the agent misunderstood, revise your explanation and try again.

4. **Stress test.**  
   Prompt:  
   “Given my design, propose one failure case I didn’t anticipate. I’ll respond with a fix.”

**Why this works:**  
If you can teach it clearly, your design is probably clear. If you can’t, your design still needs work.
