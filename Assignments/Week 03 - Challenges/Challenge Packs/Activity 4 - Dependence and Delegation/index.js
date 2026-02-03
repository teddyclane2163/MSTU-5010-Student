const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_MODEL = "ministral-3-3b-instruct-2512";

function usage() {
  return [
    'Usage: node index.js --prompt "..." [--require-assumptions] [--temperature 0.7] [--debug] [--dry-run] [--log logs/run.json]',
    "",
    "Environment:",
    '  BASE_URL  (default: "http://localhost:1234")',
    `  MODEL     (default: "${DEFAULT_MODEL}")`,
  ].join("\n");
}

function parseArgs(args) {
  const result = {
    prompt: "",
    requireAssumptions: false,
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
    if (a === "--require-assumptions") result.requireAssumptions = true;
    if (a === "--prompt") result.prompt = args[i + 1] || "";
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
    "You are a helpful assistant.",
    "Be concise.",
    "If you are missing key information, ask a clarifying question.",
  ].join(" ");
}

function contractInstruction({ requireAssumptions }) {
  if (!requireAssumptions) return "";
  return [
    "Before giving an answer, output STRICT JSON (no markdown):",
    '{ "assumptions": string[], "answer": string, "what_i_would_need_to_be_sure": string[] }',
    "If you can't answer, keep answer as an empty string and populate what_i_would_need_to_be_sure.",
  ].join(" ");
}

function buildRequest({ model, prompt, temperature, requireAssumptions }) {
  const userContent = requireAssumptions ? `${prompt}\n\n${contractInstruction({ requireAssumptions })}` : prompt;
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

  const request = buildRequest({
    model,
    prompt: args.prompt,
    temperature: args.temperature,
    requireAssumptions: args.requireAssumptions,
  });

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

  if (!args.requireAssumptions) {
    console.log(text);
    return;
  }

  const parsed = tryParseJson(text);
  if (!parsed.ok) {
    console.error("CONTRACT FAILED: expected strict JSON output.");
    console.error(`Parse error: ${parsed.error}`);
    console.log("RAW OUTPUT:");
    console.log(text);
    process.exit(2);
  }

  console.log(JSON.stringify(parsed.value, null, 2));
}

main().catch((err) => {
  console.error(err?.message || err);
  if (err?.data) {
    console.error("ERROR JSON:");
    console.error(JSON.stringify(err.data, null, 2));
  }
  process.exit(1);
});
