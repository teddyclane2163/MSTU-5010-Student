# Activity 3 — Memory is Designed

## Human idea
“Memory” is not inside the model by default. Memory is what we *include* as context.

## Boundary mapping (why this demo is built this way)
- **Input move:** change the `messages[]` array by adding:
  - a “prior exchange” (`--memory prior`), and/or
  - external context from a file (`--context file.md`)
- **Output move:** (optional) log request/response to compare what changed

## Run
- No memory:
  - `BASE_URL="http://localhost:1234" node index.js --prompt "Answer in rhymes: what day is it?" --memory none --debug`
- “Prior conversation” memory:
  - `BASE_URL="http://localhost:1234" node index.js --prompt "What day is it?" --memory prior --debug`

Optional: add context from a file:
- Use the included file `sample-context.md` (or create your own file).
- Run:
  - `BASE_URL="http://localhost:1234" node index.js --prompt "Summarize the context." --context sample-context.md --debug`

Note: `--context` can be a relative path. If you run the script from a different folder, pass a path that matches where your file actually lives.

## What to look for
- In request JSON:
  - How many message objects exist under each mode?
  - Which roles appear (system/user/assistant)?
  - What does the context file become (it’s turned into tokens too)?

## Code-reading hints (how to think)
- Start from the artifact: count the entries in `messages` from `--debug`.
- Then locate where `messages` is built:
  - `Cmd+F` for `buildMessages` or `messages.push`.
- Ask: what’s being treated as “memory” here, and why?

## Inquiries to pursue
- What changes when “prior” is present vs absent?
- What kinds of memory are you simulating: instruction memory, content memory, or identity memory?
- Where are the boundaries of “remembering” in a stateless API?

## Prompting Codex (example prompts)
- “Add `--context <file>` that inserts file contents into messages as reference material.”
- “Add `--memory prior` that includes a tiny prior user+assistant exchange before the final prompt.”
- “Add `--log` to write `{request,response}` so I can diff the messages arrays.”

## Extensions
- Add `--context-truncate N` to show that context size is also a design constraint.
- Add `--memory style|facts|commitment` to experiment with different kinds of remembered content.
