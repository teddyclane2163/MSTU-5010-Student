const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_MODEL = "ministral-3-3b-instruct-2512";

function usage() {
  return [
    'Usage: node index.js --prompt "..." [--temperature 0.7] [--debug] [--dry-run] [--log logs/run.json]',
    "",
    "Environment:",
    '  BASE_URL  (default: "http://localhost:1234")',
    `  MODEL     (default: "${DEFAULT_MODEL}")`,
  ].join("\n");
}

function parseArgs(args) {
  const result = {
    prompt: "",
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

function uncertaintyContract() {
  return [
    "Output STRICT JSON (no markdown, no extra keys):",
    '{ "answer": string, "confidence": number, "evidence_needed": string[], "follow_up_questions": string[] }',
    "confidence must be a number between 0 and 1.",
  ].join(" ");
}

function buildRequest({ model, userContent, temperature }) {
  return {
    model,
    messages: [
      { role: "system", content: "You are a careful assistant. Be concise and honest about uncertainty." },
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
    const parsed = JSON.parse(cleaned);
    return { ok: true, value: parsed, error: "" };
  } catch (e) {
    return { ok: false, value: null, error: String(e?.message || e) };
  }
}

async function maybeWriteLog({ outPath, request, response, parsed }) {
  if (!outPath) return;
  const resolved = path.resolve(process.cwd(), outPath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, JSON.stringify({ request, response, parsed }, null, 2) + "\n", "utf8");
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

  const userContent = `${args.prompt}\n\n${uncertaintyContract()}`;
  const request = buildRequest({ model, userContent, temperature: args.temperature });

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

  const text = getAssistantText(response);
  if (!text) {
    console.error("No assistant text found at choices[0].message.content");
    process.exit(1);
  }

  const parsed = tryParseJson(text);
  if (!parsed.ok) {
    console.error("CONTRACT FAILED: expected strict JSON output.");
    console.error(`Parse error: ${parsed.error}`);
    console.log("RAW OUTPUT:");
    console.log(text);
    process.exit(2);
  }

  const confidence = Number(parsed.value?.confidence);
  const output = { ...parsed.value, confidence };

  await maybeWriteLog({ outPath: args.log, request, response, parsed: output });

  // Simple routing rule: if confidence is low, highlight follow-ups instead of pretending we're done.
  if (!Number.isFinite(confidence) || confidence < 0.5) {
    console.log("LOW CONFIDENCE → ask follow-ups");
    console.log(JSON.stringify({ follow_up_questions: output.follow_up_questions, evidence_needed: output.evidence_needed }, null, 2));
    return;
  }

  console.log("HIGHER CONFIDENCE → show answer");
  console.log(JSON.stringify({ answer: output.answer, confidence: output.confidence }, null, 2));
}

main().catch((err) => {
  console.error(err?.message || err);
  if (err?.data) {
    console.error("ERROR JSON:");
    console.error(JSON.stringify(err.data, null, 2));
  }
  process.exit(1);
});
