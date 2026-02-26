# AGENTS

## Scope
- Edit only files under `src/` and `docs/`.
- Do not edit config/dependencies unless requested.

## Prohibited Actions
- Do not run destructive git commands.
- Do not move private/sensitive content into public files.

## Workflow
- 

## Quality Gates
- 

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

This helps me learn the CLI so I can eventually run these commands myself.