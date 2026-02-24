/* ── Constants ─────────────────────────────────────────────── */
const BOID_COUNT = 100;
const DEFAULT_PERCEPTION = 60;
const MAX_SPEED = 3;
const MAX_FORCE = 0.15;
const EMOJI_SIZE = 30;

const CRITTER_MAP = {
  bird: "\u{1F426}",
  horse: "\u{1F434}",
  butterfly: "\u{1F98B}",
  monkey: "\u{1F435}",
  shark: "\u{1F988}"
};

/* ── State ─────────────────────────────────────────────────── */
let boids = [];
let heroIndex = 0;
let params = { separation: 5, alignment: 5, cohesion: 5, perception: DEFAULT_PERCEPTION };
let currentEmoji = CRITTER_MAP.bird;
let selectedCritter = null;
let lastResponse = null;
let hasStarted = false;
let isLoading = false;

/* ── Boid helpers ──────────────────────────────────────────── */
function createBoid(w, h) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1 + Math.random() * 2;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed
  };
}

function dist(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function limit(vx, vy, max) {
  const mag = Math.sqrt(vx * vx + vy * vy);
  if (mag > max) {
    const scale = max / mag;
    return [vx * scale, vy * scale];
  }
  return [vx, vy];
}

function setMag(vx, vy, mag) {
  const cur = Math.sqrt(vx * vx + vy * vy);
  if (cur === 0) return [0, 0];
  const scale = mag / cur;
  return [vx * scale, vy * scale];
}

/* ── Boid forces ───────────────────────────────────────────── */
function separation(boid, flock, weight) {
  let sx = 0, sy = 0, count = 0;
  const sepDist = params.perception * 0.5;
  for (const other of flock) {
    if (other === boid) continue;
    const d = dist(boid.x, boid.y, other.x, other.y);
    if (d > 0 && d < sepDist) {
      let dx = boid.x - other.x;
      let dy = boid.y - other.y;
      dx /= d * d;
      dy /= d * d;
      sx += dx;
      sy += dy;
      count++;
    }
  }
  if (count === 0) return [0, 0];
  sx /= count;
  sy /= count;
  [sx, sy] = setMag(sx, sy, MAX_SPEED);
  sx -= boid.vx;
  sy -= boid.vy;
  [sx, sy] = limit(sx, sy, MAX_FORCE);
  return [sx * weight, sy * weight];
}

function alignment(boid, flock, weight) {
  let ax = 0, ay = 0, count = 0;
  for (const other of flock) {
    if (other === boid) continue;
    const d = dist(boid.x, boid.y, other.x, other.y);
    if (d > 0 && d < params.perception) {
      ax += other.vx;
      ay += other.vy;
      count++;
    }
  }
  if (count === 0) return [0, 0];
  ax /= count;
  ay /= count;
  [ax, ay] = setMag(ax, ay, MAX_SPEED);
  ax -= boid.vx;
  ay -= boid.vy;
  [ax, ay] = limit(ax, ay, MAX_FORCE);
  return [ax * weight, ay * weight];
}

function cohesion(boid, flock, weight) {
  let cx = 0, cy = 0, count = 0;
  for (const other of flock) {
    if (other === boid) continue;
    const d = dist(boid.x, boid.y, other.x, other.y);
    if (d > 0 && d < params.perception) {
      cx += other.x;
      cy += other.y;
      count++;
    }
  }
  if (count === 0) return [0, 0];
  cx = cx / count - boid.x;
  cy = cy / count - boid.y;
  [cx, cy] = setMag(cx, cy, MAX_SPEED);
  cx -= boid.vx;
  cy -= boid.vy;
  [cx, cy] = limit(cx, cy, MAX_FORCE);
  return [cx * weight, cy * weight];
}

function updateBoid(boid, flock, p, w, h) {
  const sepWeight = params.separation / 5;
  const aliWeight = params.alignment / 5;
  const cohWeight = params.cohesion / 5;

  const [sepX, sepY] = separation(boid, flock, sepWeight);
  const [aliX, aliY] = alignment(boid, flock, aliWeight);
  const [cohX, cohY] = cohesion(boid, flock, cohWeight);

  boid.vx += sepX + aliX + cohX;
  boid.vy += sepY + aliY + cohY;

  [boid.vx, boid.vy] = limit(boid.vx, boid.vy, MAX_SPEED);

  boid.x += boid.vx;
  boid.y += boid.vy;

  // Wrap edges
  if (boid.x > w) boid.x -= w;
  if (boid.x < 0) boid.x += w;
  if (boid.y > h) boid.y -= h;
  if (boid.y < 0) boid.y += h;
}

/* ── UI logic ──────────────────────────────────────────────── */
function updateStartButton() {
  const feeling = document.getElementById("feeling-input").value.trim();
  const startBtn = document.getElementById("start-btn");
  startBtn.disabled = !feeling || !selectedCritter || isLoading;
}

function initUI() {
  const feelingInput = document.getElementById("feeling-input");
  const startBtn = document.getElementById("start-btn");
  const restartBtn = document.getElementById("restart-btn");
  const jsonBtn = document.getElementById("json-btn");
  const jsonModal = document.getElementById("json-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const critterBtns = document.querySelectorAll(".critter-btn");

  feelingInput.addEventListener("input", updateStartButton);

  critterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (hasStarted) return;
      critterBtns.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedCritter = btn.dataset.critter;
      currentEmoji = CRITTER_MAP[selectedCritter];
      updateStartButton();
    });
  });

  startBtn.addEventListener("click", async () => {
    const feeling = feelingInput.value.trim();
    if (!feeling || !selectedCritter) return;

    isLoading = true;
    startBtn.disabled = true;
    startBtn.textContent = "...";
    document.getElementById("loading-overlay").classList.add("visible");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeling, critter: selectedCritter })
      });

      const data = await res.json();
      lastResponse = data;

      params.separation = data.separation ?? 5;
      params.alignment = data.alignment ?? 5;
      params.cohesion = data.cohesion ?? 5;
      params.perception = data.perception_radius ?? DEFAULT_PERCEPTION;

      hasStarted = true;
      feelingInput.value = "";
      feelingInput.disabled = true;
      critterBtns.forEach((b) => (b.disabled = true));
      startBtn.disabled = true;
      startBtn.textContent = "Start";
      restartBtn.disabled = false;
      jsonBtn.disabled = false;

      document.getElementById("param-sep").textContent = params.separation;
      document.getElementById("param-ali").textContent = params.alignment;
      document.getElementById("param-coh").textContent = params.cohesion;
      document.getElementById("param-per").textContent = params.perception;
      document.getElementById("param-overlay").classList.add("visible");
    } catch (err) {
      console.error("Request failed:", err);
      startBtn.textContent = "Start";
    } finally {
      isLoading = false;
      document.getElementById("loading-overlay").classList.remove("visible");
      if (!hasStarted) updateStartButton();
    }
  });

  restartBtn.addEventListener("click", () => {
    params = { separation: 5, alignment: 5, cohesion: 5, perception: DEFAULT_PERCEPTION };
    selectedCritter = null;
    currentEmoji = CRITTER_MAP.bird;
    lastResponse = null;
    hasStarted = false;

    feelingInput.value = "";
    feelingInput.disabled = false;
    critterBtns.forEach((b) => {
      b.classList.remove("selected");
      b.disabled = false;
    });
    startBtn.disabled = true;
    restartBtn.disabled = true;
    jsonBtn.disabled = true;
    document.getElementById("param-overlay").classList.remove("visible");

    // Re-pick a hero boid
    heroIndex = Math.floor(Math.random() * boids.length);
  });

  jsonBtn.addEventListener("click", () => {
    if (!lastResponse) return;
    document.getElementById("json-content").textContent = JSON.stringify(lastResponse, null, 2);
    const retries = lastResponse._retries ?? 0;
    document.getElementById("retry-info").textContent =
      retries === 0
        ? "LLM returned compliant JSON on the first attempt."
        : `LLM required ${retries} retry${retries > 1 ? "es" : ""} before returning compliant JSON.`;
    jsonModal.classList.add("visible");
  });

  modalCloseBtn.addEventListener("click", () => {
    jsonModal.classList.remove("visible");
  });

  jsonModal.addEventListener("click", (e) => {
    if (e.target === jsonModal) jsonModal.classList.remove("visible");
  });
}

/* ── p5.js sketch ──────────────────────────────────────────── */
new p5((p) => {
  p.setup = () => {
    const c = p.createCanvas(p.windowWidth, p.windowHeight);
    c.parent("sketch");

    for (let i = 0; i < BOID_COUNT; i++) {
      boids.push(createBoid(p.width, p.height));
    }
    heroIndex = Math.floor(Math.random() * boids.length);

    initUI();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    // Background
    p.background(43, 58, 66);

    // Update all boids
    for (const boid of boids) {
      updateBoid(boid, boids, p, p.width, p.height);
    }

    // Draw regular boids
    p.textSize(EMOJI_SIZE);
    p.textAlign(p.CENTER, p.CENTER);
    for (let i = 0; i < boids.length; i++) {
      if (i === heroIndex) continue;
      p.text(currentEmoji, boids[i].x, boids[i].y);
    }

    // Draw hero boid
    const hero = boids[heroIndex];
    if (hero) {
      // Perception radius (blurred circle)
      p.push();
      p.noFill();
      p.drawingContext.shadowBlur = 18;
      p.drawingContext.shadowColor = "rgba(160, 190, 220, 0.2)";
      p.stroke(160, 190, 220, 50);
      p.strokeWeight(1.5);
      p.circle(hero.x, hero.y, params.perception * 2);
      p.drawingContext.shadowBlur = 0;
      p.pop();

      // Velocity arrow
      p.push();
      const arrowLen = 22;
      const angle = Math.atan2(hero.vy, hero.vx);
      const tipX = hero.x + Math.cos(angle) * arrowLen;
      const tipY = hero.y + Math.sin(angle) * arrowLen;
      p.stroke(230, 120, 100, 200);
      p.strokeWeight(2);
      p.line(hero.x, hero.y, tipX, tipY);
      // Arrowhead
      const headLen = 6;
      const headAngle = 0.45;
      p.line(
        tipX, tipY,
        tipX - Math.cos(angle - headAngle) * headLen,
        tipY - Math.sin(angle - headAngle) * headLen
      );
      p.line(
        tipX, tipY,
        tipX - Math.cos(angle + headAngle) * headLen,
        tipY - Math.sin(angle + headAngle) * headLen
      );
      p.pop();

      // Hero emoji (drawn last, on top)
      p.textSize(EMOJI_SIZE + 4);
      p.text(currentEmoji, hero.x, hero.y);
      p.textSize(EMOJI_SIZE);
    }

  };
});
