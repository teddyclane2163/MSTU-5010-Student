const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_MODEL = "ministral-3-3b-instruct-2512";

function usage() {
  return [
    'Usage: node index.js --prompt "..." [--memory none|prior] [--context file.md] [--temperature 0.7] [--debug] [--dry-run] [--log logs/run.json]',
    "",
    "Environment:",
    '  BASE_URL  (default: "http://localhost:1234")',
    `  MODEL     (default: "${DEFAULT_MODEL}")`,
  ].join("\n");
}

function parseArgs(args) {
  const result = {
    prompt: "",
    memory: "none",
    context: "",
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
    if (a === "--memory") result.memory = (args[i + 1] || "").trim();
    if (a === "--context") result.context = args[i + 1] || "";
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

async function readOptionalFile(p) {
  if (!p) return "";
  const candidates = [];
  if (path.isAbsolute(p)) {
    candidates.push(p);
  } else {
    candidates.push(path.resolve(process.cwd(), p));
    candidates.push(path.resolve(__dirname, p));
  }

  for (const candidate of candidates) {
    try {
      const text = await fs.readFile(candidate, "utf8");
      return text.trim();
    } catch {
      // keep trying
    }
  }

  const tried = candidates.map((c) => `- ${c}`).join("\n");
  throw new Error(`Context file not found. Tried:\n${tried}`);
}

function buildMessages({ prompt, memoryMode, contextText }) {
  const messages = [{ role: "system", content: "You are a helpful assistant. Be concise." }];

  if (memoryMode === "prior") {
    messages.push({ role: "user", content: "Earlier you said you would answer in rhymes. Remember that." });
    messages.push({ role: "assistant", content: "Understood. I will answer in rhymes." });
  }

  if (contextText) {
    messages.push({
      role: "user",
      content: `Here is context for this request. Treat it as reference material:\n\n${contextText}`,
    });
  }

  messages.push({ role: "user", content: prompt });
  return messages;
}

function buildRequest({ model, messages, temperature }) {
  return {
    model,
    messages,
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

  const memoryMode = (args.memory || "none").toLowerCase();
  const contextText = await readOptionalFile(args.context);

  const messages = buildMessages({ prompt: args.prompt, memoryMode, contextText });
  const request = buildRequest({ model, messages, temperature: args.temperature });

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
