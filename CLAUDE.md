# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview
This is a student-facing course repository for **MSTU 5010: Boundaries and Theories of Learning with Technological Artifacts** at Teachers College, Columbia University. It contains weekly readings, demos, assignments, and slides — not a traditional software project.

## Git Setup
- **origin** = student's fork (e.g. `teddyclane2163/MSTU-5010-Student`)
- **upstream** = instructor's repo: `jmk2142/MSTU-5010-Student`
- New weekly content arrives via upstream. To sync: `git fetch upstream && git merge upstream/main`
- Do NOT use `git pull` (defaults to origin, which won't have new content)
- Never push to upstream — only push to origin (your fork). Upstream is the instructor's repo and is read-only.

## Repository Structure
- `Documents/` — weekly readings, setup guides, concept notes (Markdown)
- `Slides/` — weekly slide decks (Markdown)
- `Demos/` — instructor demo code, organized by week and activity
- `Assignments/` — weekly assignment prompts and starter code

## Tech Stack
- **Runtime:** Node.js (no build step, no bundler)
- **LLM backend:** LM Studio running locally (OpenAI-compatible API at `http://localhost:1234`)
- **Language:** Plain JavaScript (CommonJS `require`, no TypeScript, no ESM)
- **No package manager lockfiles** — projects use minimal `package.json` with no external dependencies beyond Node built-ins (except where noted per-project)

## Running Code
Demo and assignment scripts are standalone Node.js files. Run from each activity's directory:

```
node index.js
```

Some scripts accept flags: `--base-url`, `--model`, `--debug`, `--temperature`. Web-based projects (Weeks 05+) use `npm start` which runs `node server.js`.

LM Studio must be running locally before executing any script that calls an LLM.

## Web Reference Interpretation
When referencing a webpage to inform implementation:
- Summarize the key concepts and constraints extracted from the page before writing any code.
- For any mathematical or algorithmic components, present each formula in its original notation with a one-line plain-English description of what it computes.
- Ask for confirmation that the interpretation is correct before proceeding with implementation.
- Do not simplify or omit components unless explicitly told to.

## Git Learning Mode
Whenever you perform git or GitHub CLI operations on my behalf, include a summary table of the commands you ran, formatted like this:

| Command | What It Does |
|---------|-------------|
| `git fetch upstream` | Downloads new commits from the instructor's repo |
| `git merge upstream/main` | Merges those commits into your current branch |

Also explain **every** piece of terminal syntax used in the command. Do not omit syntax just because it appeared in a previous response. Always include all of the following that apply:

| Syntax | What It Means |
|--------|--------------|
| `&&` | Run the next command only if the previous one succeeded |
| `-m` | A flag (option) that modifies how a command behaves |
| `"quoted text"` | Wraps a value that contains spaces so the terminal reads it as one argument |

After the tables, show the full command(s) as they would be typed in the terminal, for example:

```
git add AGENTS.md && git commit -m "Add git learning mode" && git push origin main
```

This helps me (the user) learn the CLI so I can eventually run these commands myself.