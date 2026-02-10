const path = require("node:path");
const readline = require("node:readline");
const fs = require("node:fs/promises");

const { createMusicController } = require("./music");

const DEFAULT_BASE_URL = "http://localhost:1234";
const DEFAULT_MODEL = "ministral-3-3b-instruct-2512";

function usage() {
  return [
    "Usage: node index.js [--base-url http://localhost:1234] [--model <id>] [--debug] [--temperature 0.7]",
    "",
    "Environment:",
    `  BASE_URL  (default: \"${DEFAULT_BASE_URL}\")`,
    `  MODEL     (default: \"${DEFAULT_MODEL}\")`,
  ].join("\n");
}

function parseArgs(argv) {
  const result = { debug: false, temperature: 0.7, help: false, baseUrl: "", model: "" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") result.help = true;
    if (a === "--debug") result.debug = true;
    if (a === "--base-url") result.baseUrl = argv[i + 1] || "";
    if (a === "--model") result.model = argv[i + 1] || "";
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

async function readText(p) {
  return (await fs.readFile(p, "utf8")).trim();
}

async function readSystemPrompt() {
  return readText(path.resolve(__dirname, "system-prompt.txt"));
}

async function readSchemaText() {
  return readText(path.resolve(__dirname, "schema.json"));
}

async function postChatCompletion({ apiBase, request }) {
  const url = `${apiBase}/chat/completions`;
  const opts = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  };

  let res;
  try {
    res = await fetch(url, opts);
  } catch (err) {
    // Common on macOS: `localhost` resolves to IPv6 `::1`, but the server only listens on IPv4 `127.0.0.1`.
    // Retry once on IPv4 to keep the demo friction-free.
    const shouldRetry =
      String(url).includes("://localhost:") &&
      (String(err?.cause?.address || "") === "::1" || String(err?.cause?.message || "").includes("::1"));
    if (shouldRetry) {
      const retryUrl = String(url).replace("://localhost:", "://127.0.0.1:");
      try {
        res = await fetch(retryUrl, opts);
      } catch (err2) {
        const detail = err2?.cause?.code || err2?.cause?.message || err2?.message || String(err2);
        const wrapped = new Error(`fetch failed (${detail}). Try --base-url http://127.0.0.1:1234`);
        wrapped.cause = err2;
        throw wrapped;
      }
    } else {
      const detail = err?.cause?.code || err?.cause?.message || err?.message || String(err);
      const wrapped = new Error(`fetch failed (${detail})`);
      wrapped.cause = err;
      throw wrapped;
    }
  }

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

function tryParseStrictJsonObject(text) {
  const candidate = extractFirstJsonObject(text);
  if (!candidate) return { ok: false, value: null, error: "No JSON object found.", candidate: "" };
  try {
    const value = JSON.parse(candidate);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, value: null, error: "Parsed JSON was not an object.", candidate };
    }
    return { ok: true, value, error: "", candidate };
  } catch (e) {
    return { ok: false, value: null, error: String(e?.message || e), candidate };
  }
}

function pickSoundFilename(parsed) {
  const sound = parsed?.do?.sound;
  if (sound === "happy.mp3" || sound === "sad.mp3" || sound === "neutral.mp3" || sound === "error.mp3") return sound;
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
    console.error('Missing base URL. Example: node index.js --base-url http://localhost:1234');
    process.exit(1);
  }

  const systemPrompt = await readSystemPrompt();
  const schemaText = await readSchemaText();

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

  process.on("SIGINT", () => void shutdown().then(() => process.exit(0)));
  process.on("SIGTERM", () => void shutdown().then(() => process.exit(0)));
  process.on("SIGHUP", () => void shutdown().then(() => process.exit(0)));

  // We keep the schema as a visible artifact for students, but do not depend on API-specific fields.
  // The enforcement is configured in LM Studio via its Structured Output / JSON Schema settings.
  let messages = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `JSON Schema (reference):\n${schemaText}` },
  ];

  console.log("Week 04 — REPL Chat + Structured Output (JSON Schema)");
  console.log("Commands: /reset, /quit");

  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  try {
    while (true) {
      const input = (await ask("> ")).trim();
      if (!input) continue;
      if (input === "/quit") break;
      if (input === "/reset") {
        messages = [
          { role: "system", content: systemPrompt },
          { role: "system", content: `JSON Schema (reference):\n${schemaText}` },
        ];
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

      messages.push({ role: "assistant", content: assistantText });

      const parsed = tryParseStrictJsonObject(assistantText);
      const chosenSound = parsed.ok ? pickSoundFilename(parsed.value) : "error.mp3";

      if (args.debug) {
        console.log("\nRAW ASSISTANT OUTPUT:");
        console.log(assistantText);
        console.log("\nPARSE:");
        console.log(JSON.stringify(parsed.ok ? parsed.value : { error: parsed.error }, null, 2));
        if (!parsed.ok) {
          console.log("\nCANDIDATE (what the parser tried to parse):");
          console.log(parsed.candidate || "(none)");
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
