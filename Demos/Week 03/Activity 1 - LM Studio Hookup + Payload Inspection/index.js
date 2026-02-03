const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_MODEL = "ministral-3-3b-instruct-2512";

function usage() {
  return [
    'Usage: node index.js --prompt "Hello" [--mode tool|companion|auditor] [--temperature 0.7] [--debug] [--dry-run] [--out file.json]',
    "",
    "Environment:",
    '  BASE_URL  (default: "http://localhost:1234")',
    `  MODEL     (default: "${DEFAULT_MODEL}")`,
  ].join("\n");
}

function parseArgs(args) {
  const result = {
    prompt: "",
    debug: false,
    dryRun: false,
    temperature: 0.7,
    mode: "tool",
    out: "",
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--help" || a === "-h") result.help = true;
    if (a === "--debug") result.debug = true;
    if (a === "--dry-run") result.dryRun = true;
    if (a === "--prompt") result.prompt = args[i + 1] || "";
    if (a === "--mode") result.mode = (args[i + 1] || "").trim();
    if (a === "--out") result.out = args[i + 1] || "";
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

function systemForMode(mode) {
  const m = (mode || "tool").toLowerCase();
  if (m === "companion") return "You are a companion. Be warm, ask one question first, then help.";
  if (m === "auditor") return "You are a strict compliance auditor. Ask a clarifying question before answering. If unsure, say so.";
  return "You are a tool. Be concise and procedural.";
}

function buildRequest({ model, system, prompt, temperature }) {
  return {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
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

async function maybeWriteJson({ outPath, json }) {
  if (!outPath) return;
  const resolved = path.resolve(process.cwd(), outPath);
  await fs.writeFile(resolved, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`Saved response JSON to: ${resolved}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(usage());
    process.exit(0);
  }

  if (!args.prompt) {
    console.log(usage());
    process.exit(1);
  }

  const rawBaseUrl = process.env.BASE_URL || "http://localhost:1234";
  const apiBase = normalizeApiBase(rawBaseUrl);
  const model = process.env.MODEL || DEFAULT_MODEL;

  const request = buildRequest({
    model,
    system: systemForMode(args.mode),
    prompt: args.prompt,
    temperature: args.temperature,
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

  await maybeWriteJson({ outPath: args.out, json: response });

  const text = getAssistantText(response);
  if (!text) {
    console.error("No assistant text found at choices[0].message.content");
    process.exit(1);
  }

  console.log(text);
}

main().catch((err) => {
  console.error(err?.message || err);
  if (err?.data) {
    console.error("ERROR JSON:");
    console.error(JSON.stringify(err.data, null, 2));
  }
  process.exit(1);
});
