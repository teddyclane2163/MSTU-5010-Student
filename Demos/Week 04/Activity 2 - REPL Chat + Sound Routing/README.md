# Activity 2 — REPL Chat + Sound Routing (Week 04)

## Goal
Use **structured output** to drive a **deterministic behavior**:

- you chat with a model in a simple multi-turn REPL
- the model responds in “loose JSON” (from Activity 1’s system prompt)
- the script **best-effort parses** `do.sound`
- the script tries to play looping background audio based on:
  - `happy.mp3`
  - `sad.mp3`
  - `neutral.mp3`
  - otherwise → `error.mp3`

This is intentionally fragile. Drift and parse failures are part of the lesson.

## Prereqs
- Node.js **18+** (`node -v`)
- LM Studio running in **OpenAI-compatible** mode
- A model loaded in LM Studio

## Audio files
This demo expects these files in:
- `Demos/Week 04/assets/`

Files:
- `happy.mp3`
- `sad.mp3`
- `neutral.mp3`
- `error.mp3`

## Run
From this folder:

### Regular mode
- `node index.js --base-url http://localhost:1234`

### Debug mode (shows raw + parsed)
- `node index.js --base-url http://localhost:1234 --debug`

Optional:
- `node index.js --base-url http://localhost:1234 --model ministral-3-3b-instruct-2512`

Note:
- Your LM Studio server may use a different base URL, and your model id may be different.
- If your base URL already ends with `/v1`, that’s OK (the script normalizes either form).

## Parser strictness (intentionally a Week 04 lever)
Default is strict JSON parsing:
- `--parse strict` (default)

More forgiving modes (useful for observing drift):
- `--parse loose` (strips markdown fences, extracts first `{...}`, removes `//` and `/* */` comments, removes trailing commas)
- `--parse very-loose` (does all of the above, and also best-effort quotes simple unquoted keys like `think:` → `"think":`)

Shorthands:
- `--loose` (same as `--parse loose`)
- `--very-loose` (same as `--parse very-loose`)

## Controls
- Type messages and press Enter
- `/reset` clears the conversation (keeps the same system prompt)
- `/quit` exits

## What we’re watching for (in-class)
- When the JSON is valid vs “JSON-ish”
- How quickly drift appears in multi-turn conversations
- Whether `do.sound` stays inside the allowed set
- What a wrapper can do when output breaks:
  - switch to `error.mp3`
  - keep last known good sound
  - request a “repair” turn (we’ll do that later)

## Troubleshooting audio
This demo tries multiple playback backends:
- `ffplay` (FFmpeg) if installed (works on macOS + Windows)
- macOS fallback: `afplay`
- Windows fallback: PowerShell + Windows Media Player COM

If no backend is found, chat still works; you’ll see an “audio disabled” warning.

Note on fade:
- Windows WMP backend does a short fade-out/fade-in on switches.
- Other backends may hard-switch (still demonstrates deterministic routing).

## Emergency stop (if audio keeps playing after you quit)
If you close a terminal abruptly, an audio process may survive. Use one of these:

macOS:
- `killall afplay 2>/dev/null; pkill -x ffplay 2>/dev/null`

If it restarts, that usually means the demo is still running in another terminal:
- `pkill -f "node .*Activity 2 - REPL Chat \\+ Sound Routing.*index\\.js" 2>/dev/null`

Windows (PowerShell):
- `Stop-Process -Name ffplay -Force`
(If using the PowerShell/WMP backend, end the relevant `powershell.exe` in Task Manager.)
