const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const DEFAULT_BASE_URL = (process.env.LLM_BASE_URL || "http://localhost:1234/v1").replace(/\/$/, "");
const DEFAULT_MODEL = process.env.LLM_MODEL || "local-model";
const DEFAULT_API_KEY = process.env.LLM_API_KEY || "lm-studio";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8"
};

const fallbackPayload = {
  wish: "",
  wishMagnitude: 3,
  chaosLevel: 25,
  chaosType: ["tech-glitch"],
  narrative: "Your wish has been granted... but the oracle dropped malformed runes.",
  visual: {
    palette: ["#2b2d42", "#ef233c", "#d90429"],
    shapeFamily: "runes",
    shapeCount: 64,
    motionSpeed: 0.45,
    jitter: 0.45,
    glitchFrequency: 0.5,
    symmetryBreak: 0.55,
    calmPockets: 0.2
  }
};

let systemPrompt = "You are MAYHEM GENIE. Return JSON only.";
let outputSchema = null;

async function loadDemoFiles() {
  const promptPath = path.join(ROOT, "system-prompt.txt");
  const schemaPath = path.join(ROOT, "schema.json");
  systemPrompt = await fs.readFile(promptPath, "utf8");
  outputSchema = JSON.parse(await fs.readFile(schemaPath, "utf8"));
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
  if (typeof content === "string") return JSON.parse(content);
  if (Array.isArray(content)) {
    const mergedText = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        if (part && typeof part.content === "string") return part.content;
        return "";
      })
      .join("");
    return JSON.parse(mergedText || "{}");
  }
  if (content && typeof content === "object") return content;
  return {};
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isCalmingWish(wish) {
  return /\b(calm|order|peace|quiet|undo|reverse|fix|repair|restore|stabilize|normal)\b/i.test(wish);
}

function analyzeWish(wish) {
  const lower = wish.toLowerCase();

  const selfishTerms = [
    "i want",
    "for me",
    "mine",
    "myself",
    "famous",
    "power",
    "control",
    "dominate",
    "rich",
    "billion",
    "million"
  ];
  const selflessTerms = [
    "for everyone",
    "for others",
    "for all",
    "everyone",
    "all people",
    "community",
    "our",
    "we",
    "share",
    "help others"
  ];
  const kindTerms = [
    "kind",
    "kindness",
    "care",
    "heal",
    "peace",
    "quiet",
    "safety",
    "safe",
    "well-being",
    "comfort",
    "support",
    "food",
    "shelter",
    "home",
    "health"
  ];
  const meanTerms = ["revenge", "punish", "suffer", "hurt", "ruin", "destroy", "humiliate", "embarrass", "curse"];

  const countHits = (terms) => terms.reduce((acc, term) => acc + (lower.includes(term) ? 1 : 0), 0);
  const selfishHits = countHits(selfishTerms);
  const selflessHits = countHits(selflessTerms);
  const kindHits = countHits(kindTerms);
  const meanHits = countHits(meanTerms);

  const selfishScore = clamp((selfishHits + (/\b(i|me|my)\b/.test(lower) ? 0.4 : 0)) / 3, 0, 1);
  const selflessScore = clamp((selflessHits + (/\b(we|our|everyone|others|community)\b/.test(lower) ? 0.5 : 0)) / 2.5, 0, 1);
  const kindScore = clamp(kindHits / 2, 0, 1);
  const meanScore = clamp(meanHits / 2.5, 0, 1);

  return {
    selfishScore,
    selflessScore,
    kindScore,
    meanScore,
    benevolent:
      selflessScore >= 0.35 &&
      kindScore >= 0.3 &&
      selfishScore <= 0.4 &&
      meanScore <= 0.2
  };
}

function inferMagnitudeFromWish(wish) {
  const lower = wish.toLowerCase();
  let magnitude = 3;

  if (/\b(billion|infinite|immortal|immortality|rule|control the world|world domination)\b/.test(lower)) magnitude = 9;
  else if (/\b(million|fame|famous|power|obey)\b/.test(lower)) magnitude = 7;
  else if (/\b(car|house|promotion|vacation|lottery)\b/.test(lower)) magnitude = 5;
  else if (/\b(snack|candy|coffee|nap|quiet night|small)\b/.test(lower)) magnitude = 2;

  return magnitude;
}

function blend(current, target, factor) {
  return current + (target - current) * factor;
}

function applyIntentAdjustment(payload, wish, previousChaosLevel, calmingIntent) {
  if (!payload || typeof payload !== "object") return payload;

  const wishProfile = analyzeWish(wish);

  const next = {
    ...payload,
    visual: { ...(payload.visual || {}) }
  };

  next.chaosLevel = clamp(Number(next.chaosLevel || 0), 0, 100);
  next.wishMagnitude = clamp(Number(next.wishMagnitude || 1), 1, 10);
  next.wishMagnitude = Math.max(next.wishMagnitude, inferMagnitudeFromWish(wish));
  next.visual.motionSpeed = clamp(Number(next.visual.motionSpeed || 0), 0, 1);
  next.visual.jitter = clamp(Number(next.visual.jitter || 0), 0, 1);
  next.visual.glitchFrequency = clamp(Number(next.visual.glitchFrequency || 0), 0, 1);
  next.visual.symmetryBreak = clamp(Number(next.visual.symmetryBreak || 0), 0, 1);
  next.visual.calmPockets = clamp(Number(next.visual.calmPockets || 0), 0, 1);
  next.visual.shapeCount = clamp(Math.round(Number(next.visual.shapeCount || 8)), 8, 220);

  const baseChaos = next.wishMagnitude * 10;
  const moralOffset =
    wishProfile.selfishScore * 30 +
    wishProfile.meanScore * 35 -
    wishProfile.selflessScore * 24 -
    wishProfile.kindScore * 30;
  let computedChaos = clamp(Math.round(baseChaos + moralOffset), 0, 100);

  if (wishProfile.benevolent && next.wishMagnitude <= 4) {
    computedChaos = Math.min(computedChaos, 10);
    if (typeof next.narrative === "string") {
      next.narrative =
        "Your wish has been granted... exactly as intended. A rare moment of gentle magic leaves the world calmer.";
    }
  }

  next.chaosLevel = computedChaos;

  const chaosNorm = next.chaosLevel / 100;
  const targetShapeCount = clamp(Math.round(8 + chaosNorm * 212), 8, 220);
  const targetMotion = chaosNorm;
  const targetJitter = clamp(chaosNorm * 0.95, 0, 1);
  const targetGlitch = clamp(Math.max(0, chaosNorm - 0.15), 0, 1);
  const targetBreak = clamp(chaosNorm * 0.9, 0, 1);
  const targetCalm = clamp(1 - chaosNorm * 0.95, 0, 1);

  next.visual.shapeCount = Math.round(blend(next.visual.shapeCount, targetShapeCount, 0.7));
  next.visual.motionSpeed = blend(next.visual.motionSpeed, targetMotion, 0.7);
  next.visual.jitter = blend(next.visual.jitter, targetJitter, 0.7);
  next.visual.glitchFrequency = blend(next.visual.glitchFrequency, targetGlitch, 0.7);
  next.visual.symmetryBreak = blend(next.visual.symmetryBreak, targetBreak, 0.7);
  next.visual.calmPockets = blend(next.visual.calmPockets, targetCalm, 0.7);

  if (!calmingIntent) return next;

  const prev = Number(previousChaosLevel);
  if (Number.isFinite(prev)) {
    const reducedCeiling = clamp(prev - 18, 0, 100);
    next.chaosLevel = Math.min(next.chaosLevel, reducedCeiling);
  }

  if (typeof next.visual.motionSpeed === "number") next.visual.motionSpeed = clamp(next.visual.motionSpeed * 0.7, 0, 1);
  if (typeof next.visual.jitter === "number") next.visual.jitter = clamp(next.visual.jitter * 0.65, 0, 1);
  if (typeof next.visual.glitchFrequency === "number") next.visual.glitchFrequency = clamp(next.visual.glitchFrequency * 0.55, 0, 1);
  if (typeof next.visual.symmetryBreak === "number") next.visual.symmetryBreak = clamp(next.visual.symmetryBreak * 0.7, 0, 1);
  if (typeof next.visual.calmPockets === "number") next.visual.calmPockets = clamp(next.visual.calmPockets + 0.25, 0, 1);
  if (typeof next.visual.shapeCount === "number") next.visual.shapeCount = Math.max(8, Math.round(next.visual.shapeCount * 0.65));

  if (
    !wishProfile.benevolent &&
    typeof next.narrative === "string" &&
    !/restored|settled|quieted|stabilized/i.test(next.narrative)
  ) {
    next.narrative = `${next.narrative} The storm settles, and the world regains some order.`;
  }

  return next;
}

async function handleWish(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON body." });
  }

  const wish = String(body.wish || "").trim();
  if (!wish) {
    return sendJson(res, 400, { error: "Missing required field: wish" });
  }
  const previousChaosLevel = Number(body.previousChaosLevel);
  const calmingIntent = isCalmingWish(wish);

  const model = String(body.model || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  const baseUrl = String(body.baseUrl || DEFAULT_BASE_URL).trim().replace(/\/$/, "") || DEFAULT_BASE_URL;
  const apiKey = String(body.apiKey || DEFAULT_API_KEY).trim() || "lm-studio";

  const payload = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          `Wish: ${wish}\n` +
          `Previous chaos level: ${Number.isFinite(previousChaosLevel) ? Math.round(previousChaosLevel) : "unknown"}\n` +
          `Calming intent detected: ${calmingIntent ? "yes" : "no"}`
      }
    ],
    temperature: 0.9,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "genie_mayhem",
        strict: true,
        schema: outputSchema
      }
    }
  };

  try {
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
      return sendJson(res, 502, {
        error: `Upstream model request failed (${response.status}).`,
        upstream: text.slice(0, 500)
      });
    }

    const modelJson = await response.json();
    const content = modelJson?.choices?.[0]?.message?.content;
    const parsed = parseAssistantJson(content);
    const adjusted = applyIntentAdjustment(parsed, wish, previousChaosLevel, calmingIntent);

    return sendJson(res, 200, adjusted);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const fallback = {
      ...fallbackPayload,
      wish,
      narrative: "Your wish has been granted... but the genie gateway failed to connect."
    };
    const adjustedFallback = applyIntentAdjustment(fallback, wish, previousChaosLevel, calmingIntent);
    return sendJson(res, 502, { ...adjustedFallback, _error: message });
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) return sendJson(res, 400, { error: "Invalid request." });

  if (req.method === "POST" && req.url.startsWith("/api/wish")) {
    return handleWish(req, res);
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

loadDemoFiles()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`Genie demo server running at http://${HOST}:${PORT}`);
      console.log(`Default upstream: ${DEFAULT_BASE_URL} | model: ${DEFAULT_MODEL}`);
    });
  })
  .catch((err) => {
    console.error("Failed to load demo files:", err);
    process.exit(1);
  });
