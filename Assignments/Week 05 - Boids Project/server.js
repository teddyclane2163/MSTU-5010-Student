const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const DEFAULT_BASE_URL = (process.env.LLM_BASE_URL || "http://localhost:1234/v1").replace(/\/$/, "");
const DEFAULT_MODEL = process.env.LLM_MODEL || "local-model";
const DEFAULT_API_KEY = process.env.LLM_API_KEY || "lm-studio";
const MAX_RETRIES = 3;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8"
};

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    arousal: { type: "integer" },
    valence: { type: "integer" },
    separation: { type: "integer" },
    alignment: { type: "integer" },
    cohesion: { type: "integer" },
    perception_radius: { type: "integer" },
    critter_influence: {
      type: "object",
      properties: {
        separation: { type: "integer" },
        alignment: { type: "integer" },
        cohesion: { type: "integer" },
        perception_radius: { type: "integer" }
      },
      required: ["separation", "alignment", "cohesion", "perception_radius"],
      additionalProperties: false
    }
  },
  required: ["arousal", "valence", "separation", "alignment", "cohesion", "perception_radius", "critter_influence"],
  additionalProperties: false
};

const FALLBACK_RESPONSE = {
  arousal: 0,
  valence: 0,
  separation: 5,
  alignment: 5,
  cohesion: 5,
  perception_radius: 60,
  critter_influence: { separation: 0, alignment: 0, cohesion: 0, perception_radius: 0 }
};

let systemPrompt = "You are an emotionally intelligent listener. Return JSON only.";

async function loadSystemPrompt() {
  const promptPath = path.join(ROOT, "system-prompt.txt");
  systemPrompt = await fs.readFile(promptPath, "utf8");
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const requested = clean === "/" ? "/index.html" : clean;
  const resolved = path.normalize(path.join(ROOT, requested));
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function parseAssistantJson(content) {
  if (typeof content === "string") {
    const trimmed = content.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return JSON.parse(fenced[1].trim());
    return JSON.parse(trimmed);
  }
  if (Array.isArray(content)) {
    const merged = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        if (part && typeof part.content === "string") return part.content;
        return "";
      })
      .join("");
    return JSON.parse(merged || "{}");
  }
  if (content && typeof content === "object") return content;
  return {};
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function validateResponse(data) {
  if (!data || typeof data !== "object") return false;

  const topFields = ["arousal", "valence", "separation", "alignment", "cohesion", "perception_radius"];
  for (const field of topFields) {
    if (typeof data[field] !== "number" || !Number.isFinite(data[field])) return false;
  }

  if (data.arousal < -10 || data.arousal > 10) return false;
  if (data.valence < -10 || data.valence > 10) return false;
  if (data.separation < 1 || data.separation > 10) return false;
  if (data.alignment < 1 || data.alignment > 10) return false;
  if (data.cohesion < 1 || data.cohesion > 10) return false;
  if (data.perception_radius < 30 || data.perception_radius > 120) return false;

  if (!data.critter_influence || typeof data.critter_influence !== "object") return false;
  for (const field of ["separation", "alignment", "cohesion", "perception_radius"]) {
    if (typeof data.critter_influence[field] !== "number" || !Number.isFinite(data.critter_influence[field])) return false;
  }

  return true;
}

function coerceResponse(data) {
  if (!data || typeof data !== "object") return null;
  try {
    const coerced = {
      arousal: clamp(Math.round(Number(data.arousal)), -10, 10),
      valence: clamp(Math.round(Number(data.valence)), -10, 10),
      separation: clamp(Math.round(Number(data.separation)), 1, 10),
      alignment: clamp(Math.round(Number(data.alignment)), 1, 10),
      cohesion: clamp(Math.round(Number(data.cohesion)), 1, 10),
      perception_radius: clamp(Math.round(Number(data.perception_radius)), 30, 120),
      critter_influence: {
        separation: Math.round(Number(data.critter_influence?.separation ?? 0)),
        alignment: Math.round(Number(data.critter_influence?.alignment ?? 0)),
        cohesion: Math.round(Number(data.critter_influence?.cohesion ?? 0)),
        perception_radius: Math.round(Number(data.critter_influence?.perception_radius ?? 0))
      }
    };
    if (Object.values(coerced).some((v) => typeof v === "number" && !Number.isFinite(v))) return null;
    return coerced;
  } catch {
    return null;
  }
}

async function callLLM(feeling, critter, model, baseUrl, apiKey) {
  const payload = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Feeling: ${feeling}\nCritter: ${critter}`
      }
    ],
    temperature: 0.7,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "boid_parameters",
        strict: true,
        schema: OUTPUT_SCHEMA
      }
    }
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upstream ${response.status}: ${text.slice(0, 300)}`);
  }

  const modelJson = await response.json();
  const content = modelJson?.choices?.[0]?.message?.content;
  return parseAssistantJson(content);
}

async function handleGenerate(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON body." });
  }

  const feeling = String(body.feeling || "").trim();
  const critter = String(body.critter || "").trim();
  if (!feeling || !critter) {
    return sendJson(res, 400, { error: "Missing required fields: feeling, critter" });
  }

  const model = String(body.model || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  const baseUrl = String(body.baseUrl || DEFAULT_BASE_URL).trim().replace(/\/$/, "") || DEFAULT_BASE_URL;
  const apiKey = String(body.apiKey || DEFAULT_API_KEY).trim() || "lm-studio";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await callLLM(feeling, critter, model, baseUrl, apiKey);

      if (validateResponse(raw)) {
        return sendJson(res, 200, { ...raw, _retries: attempt - 1 });
      }

      const coerced = coerceResponse(raw);
      if (coerced && validateResponse(coerced)) {
        return sendJson(res, 200, { ...coerced, _retries: attempt - 1 });
      }

      console.log(`Attempt ${attempt}/${MAX_RETRIES}: invalid response, retrying...`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.log(`Attempt ${attempt}/${MAX_RETRIES} error: ${message}`);

      if (attempt === MAX_RETRIES) {
        return sendJson(res, 502, {
          ...FALLBACK_RESPONSE,
          _error: `All ${MAX_RETRIES} attempts failed. Last error: ${message}`,
          _fallback: true
        });
      }
    }
  }

  return sendJson(res, 502, {
    ...FALLBACK_RESPONSE,
    _error: `All ${MAX_RETRIES} attempts returned non-compliant JSON.`,
    _fallback: true
  });
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) return sendJson(res, 400, { error: "Invalid request." });

  if (req.method === "POST" && req.url.startsWith("/api/generate")) {
    return handleGenerate(req, res);
  }

  if (req.method === "GET" && req.url.startsWith("/api/config")) {
    return sendJson(res, 200, {
      defaultBaseUrl: DEFAULT_BASE_URL,
      defaultModel: DEFAULT_MODEL,
      hasApiKey: Boolean(DEFAULT_API_KEY)
    });
  }

  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const filePath = safePath(req.url);
  if (!filePath) return sendJson(res, 403, { error: "Forbidden path." });

  try {
    const ext = path.extname(filePath);
    const contentType = MIME[ext] || "application/octet-stream";
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType, "Content-Length": data.length });
    res.end(data);
  } catch {
    sendJson(res, 404, { error: "Not found." });
  }
});

loadSystemPrompt()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`Boids server running at http://${HOST}:${PORT}`);
      console.log(`LLM upstream: ${DEFAULT_BASE_URL} | model: ${DEFAULT_MODEL}`);
    });
  })
  .catch((err) => {
    console.error("Failed to load system prompt:", err);
    process.exit(1);
  });
