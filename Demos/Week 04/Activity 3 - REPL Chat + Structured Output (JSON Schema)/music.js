const path = require("node:path");
const { spawn } = require("node:child_process");

function createMusicController({ soundsDir, debug = false }) {
  let backend = null;
  let current = "";

  function log(...args) {
    if (debug) console.log("[music]", ...args);
  }

  function resolveSoundPath(soundFilename) {
    return path.resolve(soundsDir, soundFilename);
  }

  async function pickBackend() {
    if (backend) return backend;
    backend =
      (await createFfplayBackend({ log })) ||
      (await createMacAfplayBackend({ log })) ||
      (await createWindowsWmpBackend({ log })) ||
      createNoAudioBackend({ log });
    return backend;
  }

  async function setBackgroundMusic(soundFilename) {
    const b = await pickBackend();
    if (soundFilename === current) return;
    current = soundFilename;
    const p = resolveSoundPath(soundFilename);
    await b.switchTo(p);
  }

  async function stopBackgroundMusic() {
    const b = await pickBackend();
    await b.stop();
  }

  return { setBackgroundMusic, stopBackgroundMusic };
}

async function commandExists(cmd, args = ["-h"]) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("exit", () => resolve(true));
  });
}

function createNoAudioBackend({ log }) {
  let warned = false;
  return {
    name: "none",
    async switchTo(filePath) {
      if (!warned) {
        warned = true;
        console.warn("[music] Audio disabled (no backend found). Install FFmpeg (ffplay) or use an OS backend.");
      }
      log("would play", filePath);
    },
    async stop() {},
  };
}

async function killProcessTree(proc, { log }) {
  if (!proc || typeof proc.pid !== "number") return;
  const pid = proc.pid;

  if (process.platform === "win32") {
    try {
      await new Promise((resolve) => {
        const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
        killer.on("error", () => resolve());
        killer.on("exit", () => resolve());
      });
    } catch {}
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch (e) {
    log("kill SIGTERM failed", String(e?.message || e));
  }

  await new Promise((r) => setTimeout(r, 200));
  try {
    process.kill(pid, "SIGKILL");
  } catch {}
}

async function createFfplayBackend({ log }) {
  const ok = await commandExists("ffplay", ["-version"]);
  if (!ok) return null;

  let proc = null;
  let playing = "";

  async function stop() {
    if (!proc) return;
    const p = proc;
    proc = null;
    playing = "";
    await killProcessTree(p, { log });
  }

  return {
    name: "ffplay",
    async switchTo(filePath) {
      if (filePath === playing) return;
      await stop();
      playing = filePath;
      log("backend=ffplay switchTo", filePath);
      proc = spawn(
        "ffplay",
        ["-nodisp", "-loglevel", "error", "-hide_banner", "-stream_loop", "-1", filePath],
        { stdio: "ignore" }
      );
      proc.on("exit", () => {
        proc = null;
        playing = "";
      });
    },
    stop,
  };
}

async function createMacAfplayBackend({ log }) {
  if (process.platform !== "darwin") return null;
  const ok = await commandExists("afplay", ["-h"]);
  if (!ok) return null;

  let proc = null;
  let playing = "";
  let shouldLoop = false;

  async function stop() {
    shouldLoop = false;
    if (!proc) {
      playing = "";
      return;
    }
    const p = proc;
    proc = null;
    playing = "";
    await killProcessTree(p, { log });
  }

  return {
    name: "afplay",
    async switchTo(filePath) {
      if (filePath === playing) return;
      await stop();
      playing = filePath;
      log("backend=afplay switchTo", filePath);

      shouldLoop = true;
      const start = () => {
        if (!shouldLoop || !playing) return;
        proc = spawn("afplay", [playing], { stdio: "ignore" });
        proc.on("exit", () => {
          proc = null;
          if (shouldLoop && playing === filePath) start();
        });
      };
      start();
    },
    stop,
  };
}

async function createWindowsWmpBackend({ log }) {
  if (process.platform !== "win32") return null;
  const ok = await commandExists("powershell", ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.Major"]);
  if (!ok) return null;

  const script = `
$ErrorActionPreference = "Stop"
$player = New-Object -ComObject WMPlayer.OCX
$player.settings.setMode("loop", $true) | Out-Null
$player.settings.volume = 60

function FadeTo([int]$target, [int]$ms) {
  $steps = 12
  $start = [int]$player.settings.volume
  for ($i = 1; $i -le $steps; $i++) {
    $v = [int]($start + ($target - $start) * ($i / $steps))
    if ($v -lt 0) { $v = 0 }
    if ($v -gt 100) { $v = 100 }
    $player.settings.volume = $v
    Start-Sleep -Milliseconds ([int]($ms / $steps))
  }
}

while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  if ($line.Trim().Length -eq 0) { continue }
  $msg = $null
  try { $msg = $line | ConvertFrom-Json } catch { continue }

  if ($msg.cmd -eq "play") {
    $path = [string]$msg.path
    FadeTo 0 250
    $player.controls.stop() | Out-Null
    $player.URL = $path
    $player.controls.play() | Out-Null
    FadeTo 60 250
    continue
  }

  if ($msg.cmd -eq "stop") {
    FadeTo 0 250
    $player.controls.stop() | Out-Null
    break
  }
}
`;

  const proc = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], { stdio: ["pipe", "ignore", "ignore"] });
  let playing = "";

  function send(obj) {
    try {
      proc.stdin.write(JSON.stringify(obj) + "\n");
    } catch {}
  }

  return {
    name: "windows-wmp",
    async switchTo(filePath) {
      if (filePath === playing) return;
      playing = filePath;
      log("backend=windows-wmp switchTo", filePath);
      send({ cmd: "play", path: filePath });
    },
    async stop() {
      send({ cmd: "stop" });
      try {
        proc.stdin.end();
      } catch {}
    },
  };
}

module.exports = { createMusicController };

