# Week 04 — Boundary Decisions Outline

This outline turns the Week 04 materials into a **decision map**. Your job is to pick choices at each phase and explain **why**.

Bring the completed outline to class or submit it as a short write‑up.

---

## Part A — Interaction Design (human goal)

1. **Interaction goal (1–2 sentences)**  
   Who is the user and what should the experience feel like?

2. **One non‑goal**  
   What should the system *not* do (e.g., “never pretend certainty”)?

3. **Failure visibility**  
   If it breaks, how should the user notice?

---

## Part B — Phase‑by‑Phase Decisions (phases + levers)

For each phase, pick a design choice and explain **why**.
These are examples, not required fixtures — you can choose different levers as long as you justify the choice.

### 1) User input phase
- **Your choice:** (prompting experience, single turn vs multi‑turn REPL, tone)
- **Why:** (what this choice enables or prevents)

### 2) Code builds the request
- **Your choice:** (system message, context to include, temperature)
- **Why:** (what behavior you’re steering)

### 3) Server receives + routes
- **Your choice:** (structured output on/off, safety mode, max tokens)
- **Why:** (what reliability you want)

### 4) Model generates
- **Your choice:** (sampling settings, strictness pressure)
- **Why:** (tradeoff between creativity and consistency)

### 5) Server returns response
- **Your choice:** (streaming vs single response, logging)
- **Why:** (what you need to inspect or trust)

### 6) Code post‑processes
- **Your choice:** (strictness policy: reject / normalize / retry)
- **Why:** (how you handle failures)

### 7) User responds (next turn)
- **Your choice:** (how you prompt the next step, failure feedback)
- **Why:** (how you maintain trust and clarity)

---

## Part C — Schema Design (required)

Provide your JSON Schema and explain **why** you chose this structure.
All elements below are **options**, not requirements — include what supports your design.

**Schema (paste or link):**

**Key decisions + why (choose what applies):**
- Required keys (if any):
- Routing fields (if you have them): describe how your code uses them.  
  (Enums are optional—use them only if they help your design.)
- `additionalProperties: false` (optional — use only if you want strict keys):
- Constraints (`maxLength`, `pattern`, etc.) where helpful:

---

## Part D — Wrapper / Code Behavior

Explain how your code will **use** the schema output.

1. **Routing field:**  
   Which field controls behavior?

2. **Deterministic action:**  
   What does the system do for each allowed value?

3. **Failure policy:**  
   If parsing or validation fails, what happens?

---

## Submission (suggested format)
- Interaction goal + non‑goal + failure visibility  
- Phase‑by‑phase decisions  
- Schema + rationale  
- Routing + failure policy  
