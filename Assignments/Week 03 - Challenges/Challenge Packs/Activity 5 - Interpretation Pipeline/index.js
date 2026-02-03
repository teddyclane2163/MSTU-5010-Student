const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_MODEL = "ministral-3-3b-instruct-2512";

function usage() {
  return [
    'Usage: node index.js --prompt "..." [--format text|lines|json] [--temperature 0.7] [--debug] [--dry-run] [--log logs/run.json]',
    "",
    "Environment:",
    '  BASE_URL  (default: "http://localhost:1234")',
    `  MODEL     (default: "${DEFAULT_MODEL}")`,
  ].join("\n");
}

function parseArgs(args) {
  const result = {
    prompt: "",
    format: "lines",
    temperature: 0.7,
    debug: false,
    dryRun: false,
    log: "",
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--help" || a === "-h") result.help = true;
    if (a === "--debug") result.debug = true;
    if (a === "--dry-run") result.dryRun = true;
    if (a === "--prompt") result.prompt = args[i + 1] || "";
    if (a === "--format") result.format = (args[i + 1] || "").trim();
    if (a === "--log") result.log = args[i + 1] || "";
    if (a === "--temperature") {
      const value = Number(args[i + 1]);
      if (Number.isFinite(value)) result.temperature = value;
    }
  }

  return result;
}

function normalizeApiBase(rawBaseUrl) {
  const base = (rawBaseUrl || "").trim().replace(/\/$/, "");
  if (!base) return "";
  return base.endsWith("/v1") ? base : `${base}/v1`;
}

function systemMessage() {
  return [
    "You are a planning assistant.",
    "Be concrete and time-aware.",
    "Do not invent constraints; ask if missing.",
  ].join(" ");
}

function scheduleLineContract() {
  return [
    "Output ONLY a list of steps in this exact single-line format (no markdown code fences, no extra text):",
    "<duration_min> | <task> | <why>",
    "Rules:",
    "- One step per line.",
    "- duration_min must be an integer.",
    "- Do not put newlines inside any field.",
    "- Keep <why> short (one sentence).",
  ].join("\n");
}

function scheduleJsonContract() {
  return [
    "Output STRICT JSON (no markdown, no extra keys):",
    '{ "steps": [{ "task": string, "duration_min": number, "why": string }] }',
    "Rules:",
    "- Use integers for duration_min.",
    "- Keep why to one sentence (no bullet lists, no newlines).",
  ].join("\n");
}

function buildRequest({ model, prompt, temperature, format }) {
  const fmt = (format || "lines").toLowerCase();
  let userContent = prompt;
  if (fmt === "lines") userContent = `${prompt}\n\n${scheduleLineContract()}`;
  if (fmt === "json") userContent = `${prompt}\n\n${scheduleJsonContract()}`;
  return {
    model,
    messages: [
      { role: "system", content: systemMessage() },
      { role: "user", content: userContent },
    ],
    temperature,
    max_tokens: -1,
    stream: false,
  };
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

function tryParseJson(text) {
  const raw = String(text ?? "").trim();
  let cleaned = raw;
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```[\s]*$/i, "").trim();
  }

  try {
    return { ok: true, value: JSON.parse(cleaned), error: "" };
  } catch (e) {
    return { ok: false, value: null, error: String(e?.message || e) };
  }
}

function stripCodeFences(text) {
  const raw = String(text ?? "").trim();
  if (!raw.startsWith("```")) return raw;
  return raw.replace(/^```(?:\w+)?\s*/i, "").replace(/```[\s]*$/i, "").trim();
}

function parseScheduleLines(text) {
  const cleaned = stripCodeFences(text);
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const steps = [];
  for (const line of lines) {
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 3) continue;
    const durationMin = Number(parts[0]);
    const task = parts[1];
    const why = parts.slice(2).join(" | ");
    if (!Number.isFinite(durationMin)) continue;
    if (!task || !why) continue;
    steps.push({ task, duration_min: Math.trunc(durationMin), why });
  }

  if (!steps.length) {
    return { ok: false, value: null, error: "No parsable steps found (expected: <duration_min> | <task> | <why> per line)." };
  }

  return { ok: true, value: { steps }, error: "" };
}

function renderSchedule(steps) {
  const lines = [];
  let total = 0;
  for (const s of steps) {
    const mins = Number(s?.duration_min);
    const task = String(s?.task || "").trim();
    const why = String(s?.why || "").trim();
    if (!task || !Number.isFinite(mins)) continue;
    total += mins;
    lines.push(`- ${task} (${mins} min) — ${why}`);
  }
  lines.push(`\nTotal: ${total} min`);
  return lines.join("\n");
}

async function maybeWriteLog({ outPath, request, response }) {
  if (!outPath) return;
  const resolved = path.resolve(process.cwd(), outPath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, JSON.stringify({ request, response }, null, 2) + "\n", "utf8");
  console.log(`Saved log to: ${resolved}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return void console.log(usage());
  if (!args.prompt) {
    console.log(usage());
    process.exit(1);
  }

  const rawBaseUrl = process.env.BASE_URL || "http://localhost:1234";
  const apiBase = normalizeApiBase(rawBaseUrl);
  const model = process.env.MODEL || DEFAULT_MODEL;

  const request = buildRequest({ model, prompt: args.prompt, temperature: args.temperature, format: args.format });

  if (args.debug || args.dryRun) {
    console.log("REQUEST JSON:");
    console.log(JSON.stringify(request, null, 2));
  }
  if (args.dryRun) return;

  if (!apiBase) {
    console.error("Missing base URL. Set BASE_URL (e.g., http://localhost:1234).");
    process.exit(1);
  }

  const response = await postChatCompletion({ apiBase, request });

  if (args.debug) {
    console.log("RESPONSE JSON:");
    console.log(JSON.stringify(response, null, 2));
  }

  await maybeWriteLog({ outPath: args.log, request, response });

  const text = getAssistantText(response);
  if (!text) {
    console.error("No assistant text found at choices[0].message.content");
    process.exit(1);
  }

  const fmt = (args.format || "lines").toLowerCase();
  if (fmt === "text") {
    console.log(text);
    return;
  }

  if (fmt === "lines") {
    const parsed = parseScheduleLines(text);
    if (!parsed.ok) {
      console.error("CONTRACT FAILED: expected one step per line in the format <duration_min> | <task> | <why>.");
      console.error(`Parse error: ${parsed.error}`);
      console.log("RAW OUTPUT:");
      console.log(text);
      process.exit(2);
    }
    console.log(renderSchedule(parsed.value.steps));
    return;
  }

  if (fmt === "json") {
    const parsed = tryParseJson(text);
    if (!parsed.ok) {
      console.error("CONTRACT FAILED: expected strict JSON output.");
      console.error(`Parse error: ${parsed.error}`);
      console.log("RAW OUTPUT:");
      console.log(text);
      process.exit(2);
    }

    const steps = parsed.value?.steps;
    if (!Array.isArray(steps)) {
      console.error("CONTRACT FAILED: expected key steps: []");
      console.log(JSON.stringify(parsed.value, null, 2));
      process.exit(2);
    }

    console.log(renderSchedule(steps));
    return;
  }

  console.error(`Unknown format: ${args.format}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err?.message || err);
  if (err?.data) {
    console.error("ERROR JSON:");
    console.error(JSON.stringify(err.data, null, 2));
  }
  process.exit(1);
});
