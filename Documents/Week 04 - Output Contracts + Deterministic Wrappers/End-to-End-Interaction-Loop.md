# End-to-End Interaction Loop (Weeks 01–04)

This is a simple, concrete model of the full loop—from a user prompt to a model response and back—based on what we’ve built and learned in Weeks 01–04.

The goal: make the phases visible so students can name **where control lives** at each step.

---

## The Loop (one full turn)

### 1) What the user does
- Writes a prompt (or sends input in a REPL).
- Chooses a task or asks a question.
- Sometimes includes constraints (“reply in JSON”, “ask one question first”).

### 2) What our code does (client/wrapper)
- Builds the request payload:
  - `model`
  - `messages[]` (system + user + prior turns)
  - settings (temperature, etc.)
- Optionally adds an output contract (prompt-only or schema reference).
- Sends the request to the server.

### 3) What the server does (ingress)
- Receives the request.
- Validates that it is well-formed JSON.
- Routes to the active model / runtime.
- Applies server-side constraints (if any):
  - structured output / JSON schema enforcement
  - safety policies
  - max token limits

### 4) What the model does
- Conditions on `messages[]` and settings.
- Generates tokens according to:
  - the prompt context
  - temperature/top-p sampling
  - any server-side constraints on allowed output

### 5) What the server does (egress)
- Assembles tokens into a response payload.
- Returns response JSON:
  - `choices[0].message.content`
  - usage stats (if available)
  - errors (if generation failed)

### 6) What our code does (post-processing)
- Extracts the assistant text.
- Attempts parsing if an output contract is expected.
- Validates fields and types.
- Routes behavior (e.g., play `do.sound`, show error, retry).
- Logs or saves artifacts (optional).

### 7) What the user does next
- Reads/uses the output.
- Adapts their next prompt.
- If output failed, they may:
  - adjust the prompt
  - change the contract
  - switch to stricter or more forgiving parsing

---

## The Loop as a Flow (compact view)

1. User input  
2. Code builds request  
3. Server receives + routes  
4. Model generates  
5. Server returns response JSON  
6. Code parses + routes behavior  
7. User responds (next turn)

Then repeat.

---

## Where control lives (Week 01 → Week 04)

- **Week 01–02:** control is mostly in setup + payload literacy  
  (“What is the request shape? What does the response look like?”)

- **Week 03:** control shifts to **payload design**  
  (“What happens if we change system, memory, temperature?”)

- **Week 04:** control shifts to **output contracts + deterministic wrappers**  
  (“What do we do when the output is wrong, and how strict should we be?”)

---

## Key takeaways

- The model is **one part** of a larger system loop.
- Your **wrapper code** is where deterministic behavior and policy live.
- “Structure” is how you turn model output into software behavior.

---

# Part II — Where Design Choices Live

This section helps you see *where* design decisions can be made in the loop—and what those decisions change.

## Phase-by-phase: what you can design (and what you can’t)

### 1) User input phase
**You can design:**
- The *prompting experience* (questions, framing, tone).
- The *interaction pattern* (single prompt vs REPL / multi-turn).

**You can’t control:**
- Model knowledge or truthfulness.
- What the model “really knows” vs what it guesses.

---

### 2) Code builds the request
**You can design:**
- The system message (policy, role, tone).
- The context (what gets included or excluded).
- The output contract (prompt-only or strict schema reference).

**You can’t control:**
- The model’s hidden behavior beyond the prompt.
- The server’s internal defaults (unless exposed).

---

### 3) Server receives + routes
**You can design:**
- Whether you use structured output (if supported).
- Server policies (rate limits, safety filters).

**You can’t control:**
- Inference speed or queueing.
- Token budget limits once set.

---

### 4) Model generates
**You can design:**
- Sampling settings (temperature/top-p).
- Constraint pressure (schema, strict formats).

**You can’t control:**
- Whether the model will “comply” with ambiguous requests.
- Whether the model will hallucinate or over-confidently guess.

---

### 5) Server returns response
**You can design:**
- Whether you ask for streaming vs single-shot output.
- Whether you log raw responses for auditing.

**You can’t control:**
- Whether output is *meaningful* vs *valid* (valid JSON can still be wrong).

---

### 6) Code post-processes
**You can design:**
- Parsing strategy: strict vs normalize vs retry.
- Routing policy: what output triggers what action.
- Error handling and user feedback.

**You can’t control:**
- What the model already produced.
- How “fixable” a bad response is without changing upstream constraints.

---

### 7) User responds (next turn)
**You can design:**
- How the interface invites a next step.
- How failure is explained (clear + actionable).

**You can’t control:**
- Whether the user trusts the system after a failure.

---

## Levers vs constraints (quick table)

**Levers you can pull**
- system prompt / policy text
- messages[] context
- temperature / top-p
- schema / contract strictness
- parsing policy (reject / normalize / retry)
- routing rules

**Constraints you must work with**
- model limitations / hallucination risk
- server policy / safety filters
- token limits / latency
- user expectations

---

## Example: a human-centered interaction and its boundary decisions

**Interaction design goal:**  
“A calm study companion that asks one gentle clarifying question before giving advice.”

**Where that design shows up in the loop:**

- **User phase**: the prompt template invites reflection  
  (“What’s one thing you’re stuck on?”)

- **Request phase**: system message encodes the role  
  (“Ask exactly one clarifying question before advising.”)

- **Output contract**: require structured response  
  `{ "question": string, "advice": string, "tone": "calm" }`

- **Post-processing**: wrapper enforces interaction  
  - If question missing → reject or retry  
  - If tone not “calm” → normalize or re-ask  

**What students should notice:**  
The “human” experience is created by *boundary decisions*, not just “good prompts”.

---

## Example: a boundary-centered interaction

**Interaction design goal:**  
“A system that never pretends certainty: it must show uncertainty before answers.”

**Boundary decisions:**

- **Output contract**:  
  `{ "answer": string, "confidence": number, "evidence_needed": string[] }`

- **Routing rule**:  
  if `confidence < 0.5` → show questions + evidence needed  
  else → show answer  

**Human impact:**  
Users learn to see uncertainty *as part of the interface*, not hidden behind fluent text.

---

## Reflection prompts (after a run)

- Which phase did you make your most important design decision?
- What did you *not* control that affected the outcome?
- If your system failed, where would you fix it (prompt, schema, parser, UI)?
