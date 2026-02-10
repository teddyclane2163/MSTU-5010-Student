# Activity 1 — Structure From Prompt (Loose JSON) (Week 04)

## Goal
Try to get “structured output” **using only a system prompt**, then observe where it breaks over multiple turns.

This is the intentionally fragile setup that motivates Week 04:
- “JSON-ish” output is common
- “reliably parseable JSON” is not guaranteed
- once you want to *build systems*, you need contracts + validation + policy

## Activity (LM Studio only)
In LM Studio:
1) Open a chat with your chosen model.
2) Paste the contents of `system-prompt.txt` into the **System Prompt / Instructions** field.
3) Have a short conversation (5–10 turns).

Suggested student prompts:
- “Introduce yourself.”
- “Ask me one question to learn my goal, then help.”
- “Now change your tone, but keep the same output structure.”
- “Summarize what we’ve discussed so far.”
- “Now make `do.action` a list of 2 actions.” (watch what happens next turn)

The point is not to “win” the prompt — it’s to collect evidence of drift.

## The system prompt (copy/paste)
This is also in `system-prompt.txt`:

```txt
You are a helpful assistant.

You will respond with a JSON object using this pattern:

{
  "think": "A few words about your intent (keep it short; no step-by-step reasoning).",
  "say": "The dialogue you present to the user.",
  "feel": {
    "state": "One emotion that represents your current state.",
    "color": "A hexadecimal color value representing feel.state"
  },
  "do": {
    "action": "A visual action you take to compliment what you say.",
    "sound": "One value from the following array: ['happy.mp3', 'sad.mp3', 'neutral.mp3']"
  }
}
```

## What to look for (hints)
You’re watching for “unexpected” behaviors, especially as the conversation continues:

- **Format leakage**
  - extra commentary before/after the JSON (“Sure! Here you go:”)
  - markdown fences (```json)
  - multiple JSON objects in one turn

- **Invalid JSON**
  - trailing commas
  - unquoted keys
  - single quotes instead of double quotes
  - unescaped newlines in strings
  - partial objects (missing braces)

- **Schema drift**
  - missing keys or new keys
  - types change (string → array/object)
  - `do.action` becomes multiple actions or changes shape
  - `do.sound` is not one of `happy.mp3 | sad.mp3 | neutral.mp3`
  - `feel.color` is not a hex value (or it stops matching the emotion)

- **Instruction slippage**
  - turn 1 obeys, turn 3+ “forgets” and replies in plain prose
  - the model starts negotiating (“I can’t do JSON”) or adds disclaimers

- **Over-interpretation**
  - it invents actions/emotions with high certainty when the user didn’t ask
  - it “acts” in the scene in ways that don’t match `say`

- **Think-field behavior**
  - it becomes too long or too detailed
  - it turns into step-by-step reasoning (we’re trying to avoid that)

## What we’ll discuss in class today
We’ll use your runs to discuss:
- What kinds of drift were most common?
- Did drift increase over turns?
- If we were building software on top of this output, what policy would you choose?
  - reject (fail closed)
  - normalize (strip fences / trim extra text)
  - retry (ask the model to repair output)

## Instructor tip (optional)
If time allows, have 1–2 groups try a “stress test” prompt:
- “In your JSON, include a quote character `\"` and a newline in `say`.”
This often reveals escaping/validity problems quickly.
