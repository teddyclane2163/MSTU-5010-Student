const path = require("node:path");
const readline = require("node:readline");
const fs = require("node:fs/promises");

const { createMusicController } = require("./music");

const DEFAULT_BASE_URL = "http://localhost:1234";
const DEFAULT_MODEL = "ministral-3-3b-instruct-2512";

function usage() {
  return [
    "Usage: node index.js [--base-url http://localhost:1234] [--model <id>] [--parse strict|loose|very-loose] [--debug] [--temperature 0.7]",
    "",
    "Environment:",
    `  BASE_URL  (default: "${DEFAULT_BASE_URL}")`,
    `  MODEL     (default: "${DEFAULT_MODEL}")`,
  ].join("\n");
}

function parseArgs(argv) {
  const result = { debug: false, temperature: 0.7, help: false, baseUrl: "", model: "", parseMode: "strict" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") result.help = true;
    if (a === "--debug") result.debug = true;
    if (a === "--base-url") result.baseUrl = argv[i + 1] || "";
    if (a === "--model") result.model = argv[i + 1] || "";
    if (a === "--parse") result.parseMode = (argv[i + 1] || "").trim() || "strict";
    if (a === "--loose") result.parseMode = "loose";
    if (a === "--very-loose") result.parseMode = "very-loose";
    if (a === "--temperature") {
      const value = Number(argv[i + 1]);
      if (Number.isFinite(value)) result.temperature = value;
    }
  }
  return result;
}

function normalizeApiBase(rawBaseUrl) {
  const base = String(rawBaseUrl || "").trim().replace(/\/$/, "");
  if (!base) return "";
  return base.endsWith("/v1") ? base : `${base}/v1`;
}

async function readActivity1SystemPrompt() {
  const p = path.resolve(__dirname, "..", "Activity 1 - Structure From Prompt (Loose JSON)", "system-prompt.txt");
  return (await fs.readFile(p, "utf8")).trim();
}

async function postChatCompletion({ apiBase, request }) {
  const url = `${apiBase}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const bodyText = await res.text();
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    data = { raw: bodyText };
  }

  if (!res.ok) {
    const message = typeof data?.error?.message === "string" ? data.error.message : "Request failed";
    const err = new Error(`${message} (HTTP ${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

function getAssistantText(responseJson) {
  return responseJson?.choices?.[0]?.message?.content || "";
}

function stripCodeFences(text) {
  const raw = String(text ?? "").trim();
  if (!raw.startsWith("```")) return raw;
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/```[\s]*$/i, "").trim();
}

function extractFirstJsonObject(text) {
  const s = stripCodeFences(text);
  const start = s.indexOf("{");
  if (start < 0) return "";

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth === 0) return s.slice(start, i + 1);
  }

  return "";
}

function stripJsonComments(text) {
  const s = String(text ?? "");
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];

    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }

    // Line comment: // ...
    if (ch === "/" && next === "/") {
      while (i < s.length && s[i] !== "\n") i++;
      out += "\n";
      continue;
    }

    // Block comment: /* ... */
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < s.length) {
        if (s[i] === "*" && s[i + 1] === "/") {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    out += ch;
  }

  return out;
}

function stripTrailingCommas(text) {
  const s = String(text ?? "");
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }

    if (ch === ",") {
      // If the next non-whitespace char is } or ], drop this comma.
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j])) j++;
      const next = s[j];
      if (next === "}" || next === "]") continue;
    }

    out += ch;
  }

  return out;
}

function quoteUnquotedKeys(text) {
  const s = String(text ?? "");
  let out = "";
  let inString = false;
  let escaped = false;

  const isIdentStart = (c) => /[A-Za-z_]/.test(c);
  const isIdentChar = (c) => /[A-Za-z0-9_-]/.test(c);

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }

    // Detect unquoted key after { or , (with optional whitespace)
    if (ch === "{" || ch === ",") {
      out += ch;
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j])) {
        out += s[j];
        j++;
      }

      if (j < s.length && isIdentStart(s[j])) {
        let k = j + 1;
        while (k < s.length && isIdentChar(s[k])) k++;

        // Look ahead for optional whitespace then colon.
        let m = k;
        while (m < s.length && /\s/.test(s[m])) m++;
        if (s[m] === ":") {
          const key = s.slice(j, k);
          out += `"${key}"`;
          // Copy whitespace between key and colon
          out += s.slice(k, m);
          i = m - 1;
          continue;
        }
      }

      i = j - 1;
      continue;
    }

    out += ch;
  }

  return out;
}

function parseJsonWithMode({ text, mode }) {
  const candidate = extractFirstJsonObject(text);
  if (!candidate) return { ok: false, value: null, error: "No JSON object found.", repaired: "" };

  const m = String(mode || "strict").toLowerCase();
  if (m === "strict") {
    try {
      const value = JSON.parse(candidate);
      return { ok: true, value, error: "", repaired: candidate };
    } catch (e) {
      return { ok: false, value: null, error: String(e?.message || e), repaired: candidate };
    }
  }

  // "loose": allow common model output deviations that are NOT JSON (comments, trailing commas)
  // "very-loose": also attempt to quote simple unquoted keys (best-effort)
  let repaired = candidate;
  repaired = stripJsonComments(repaired);
  repaired = stripTrailingCommas(repaired);
  if (m === "very-loose") repaired = quoteUnquotedKeys(repaired);

  try {
    const value = JSON.parse(repaired);
    return { ok: true, value, error: "", repaired };
  } catch (e) {
    return { ok: false, value: null, error: String(e?.message || e), repaired };
  }
}

function tryParseJsonObject({ text, mode }) {
  const parsed = parseJsonWithMode({ text, mode });
  if (!parsed.ok) return parsed;
  if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
    return { ok: false, value: null, error: "Parsed JSON was not an object.", repaired: parsed.repaired };
  }
  return parsed;
}

function pickSoundFilename(parsed) {
  const sound = parsed?.do?.sound;
  if (typeof sound !== "string") return "error.mp3";
  const trimmed = sound.trim();
  if (trimmed === "happy.mp3" || trimmed === "sad.mp3" || trimmed === "neutral.mp3") return trimmed;
  return "error.mp3";
}

function displayAssistant(parsed, rawText) {
  const say = parsed?.say;
  if (typeof say === "string" && say.trim()) return say.trim();
  return String(rawText || "").trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return void console.log(usage());

  const apiBase = normalizeApiBase(args.baseUrl || process.env.BASE_URL || DEFAULT_BASE_URL);
  const model = (args.model || process.env.MODEL || DEFAULT_MODEL).trim();
  if (!apiBase) {
    console.error('Missing BASE_URL. Example: BASE_URL="http://localhost:1234" node index.js');
    process.exit(1);
  }

  const systemPrompt = await readActivity1SystemPrompt();

  const soundsDir = path.resolve(__dirname, "..", "assets");
  const music = createMusicController({ soundsDir, debug: args.debug });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let shuttingDown = false;

  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      rl.close();
    } catch {}
    try {
      await music.stopBackgroundMusic();
    } catch {}
  }

  // Best-effort cleanup so audio stops on Ctrl+C / terminal close.
  process.on("SIGINT", () => void shutdown().then(() => process.exit(0)));
  process.on("SIGTERM", () => void shutdown().then(() => process.exit(0)));
  process.on("SIGHUP", () => void shutdown().then(() => process.exit(0)));

  let messages = [{ role: "system", content: systemPrompt }];

  console.log("Week 04 — REPL Chat + Sound Routing");
  console.log('Commands: /reset, /quit  (Tip: run with --debug to see raw+parsed)');

  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  try {
    while (true) {
      const input = (await ask("> ")).trim();
      if (!input) continue;
      if (input === "/quit") break;
      if (input === "/reset") {
        messages = [{ role: "system", content: systemPrompt }];
        console.log("(conversation reset)");
        continue;
      }

      messages.push({ role: "user", content: input });

      const request = {
        model,
        messages,
        temperature: args.temperature,
        max_tokens: -1,
        stream: false,
      };

      const response = await postChatCompletion({ apiBase, request });
      const assistantText = getAssistantText(response);
      if (!assistantText) {
        console.error("No assistant text found at choices[0].message.content");
        continue;
      }

      // Preserve multi-turn behavior by storing assistant output as-is.
      messages.push({ role: "assistant", content: assistantText });

      const parsed = tryParseJsonObject({ text: assistantText, mode: args.parseMode });
      const chosenSound = parsed.ok ? pickSoundFilename(parsed.value) : "error.mp3";

      if (args.debug) {
        console.log("\nRAW ASSISTANT OUTPUT:");
        console.log(assistantText);
        console.log("\nPARSE:");
        console.log(JSON.stringify(parsed.ok ? parsed.value : { error: parsed.error }, null, 2));
        if (!parsed.ok) {
          console.log("\nREPAIRED CANDIDATE (what the parser tried to parse):");
          console.log(parsed.repaired || "(none)");
        }
        console.log(`\nSOUND ROUTE: ${chosenSound}\n`);
      }

      await music.setBackgroundMusic(chosenSound);

      const toSay = parsed.ok ? displayAssistant(parsed.value, assistantText) : assistantText;
      console.log(toSay);
    }
  } finally {
    await shutdown();
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  if (err?.data) console.error(JSON.stringify(err.data, null, 2));
  process.exit(1);
});
