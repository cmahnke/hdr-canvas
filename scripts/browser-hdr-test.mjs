#!/usr/bin/env node
/**
 * Browser test: verifies that the HDR canvas pipeline delivers values > 1.0
 * by running `tests/site/hdr-verify.html` in a real (windowed) Chrome on the
 * actual display and reading back the canvas framebuffer via CDP.
 *
 * Requires:
 * - Google Chrome in the default location (or --chrome flag)
 * - The Vite dev server running (`npm run dev`)
 *
 * Usage: node scripts/browser-hdr-test.mjs [--chrome <path>] [--base <url>]
 *             [--renderer hdr|stock] [--expect pass|none] [--nightly <path>]
 * Exit codes: 0 pass, 1 fail, 2 error
 */
import { spawn } from "node:child_process";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
function getArg(name, fallback = null) {
  const index = args.indexOf(name);
  if (index >= 0 && index + 1 < args.length) return args[index + 1];
  return fallback;
}

const chromePath = getArg("--chrome") ?? getArg("--nightly") ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const renderer = getArg("--renderer", "hdr");
const expectPass = getArg("--expect", "pass") === "pass";
const timeout = parseInt(getArg("--timeout", "60"), 10) * 1000;
const debugPort = 9231;

const candidateBases = getArg("--base") ? [getArg("--base")] : ["http://localhost:5175", "http://localhost:5174", "http://localhost:5173"];
let baseUrl = null;
for (const candidate of candidateBases) {
  try {
    const response = await fetch(candidate.replace("/hdr-canvas/examples", ""));
    if (response.ok || response.status === 404) {
      baseUrl = candidate.replace(/\/$/, "");
      break;
    }
  } catch {
    // Not reachable, try next candidate
  }
}
if (!baseUrl) {
  console.error("No dev server found. Start it with `npm run dev` first.");
  process.exit(2);
}
const pageUrl = `${baseUrl}/hdr-verify.html${renderer === "stock" ? "?renderer=stock" : ""}`;

if (!existsSync(chromePath)) {
  console.error(`Chrome not found at ${chromePath}`);
  process.exit(2);
}

const userDataDir = join(mkdtempSync(join(tmpdir(), "hdr-canvas-hdr-")), "profile");
const chromeArgs = [
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${userDataDir}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--enable-unsafe-webgpu",
  "--enable-experimental-web-platform-features",
  "--window-size=1040,780",
  "--window-position=40,60",
  pageUrl
];
const chrome = spawn(chromePath, chromeArgs, { stdio: "ignore", detached: false });

process.on("exit", () => {
  try {
    chrome.kill("SIGKILL");
  } catch {
    // ignored
  }
});

// Wait for the CDP endpoint
async function waitForEndpoint() {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (response.ok) return await response.json();
    } catch {
      // server not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}
const version = await waitForEndpoint();
if (!version) {
  console.error("CDP endpoint did not come up");
  process.exit(2);
}

const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
const page = targets.find((target) => target.type === "page" && target.url.includes("hdr-verify.html"));
if (!page) {
  console.error(`hdr-verify page target not found. Open targets: ${targets.map((t) => t.url).join(", ")}`);
  process.exit(2);
}

console.log(`Chrome ${version.Browser} → ${pageUrl}`);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let seq = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  } else if (message.method === "Runtime.consoleAPICalled") {
    const text = message.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ");
    console.log(`[page ${message.params.type}] ${text}`);
  } else if (message.method === "Runtime.exceptionThrown") {
    console.log(`[page exception] ${message.params.exceptionDetails.text}`);
  }
};
function send(method, params = {}) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
await send("Runtime.enable");

// Poll for the verdict object
let verdict = null;
const pollStarted = Date.now();
while (Date.now() - pollStarted < timeout) {
  const result = await send("Runtime.evaluate", {
    expression: "JSON.stringify(window.__hdrVerify ?? null)",
    returnByValue: true
  });
  if (result?.result?.value) {
    const candidate = JSON.parse(result.result.value);
    if (candidate?.done) {
      verdict = candidate;
      break;
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

// Take a screenshot for the record
try {
  const shot = await send("Page.captureScreenshot", { format: "png" });
  await import("node:fs").then(({ writeFileSync }) => writeFileSync("/tmp/hdr-canvas-hdr-verify.png", Buffer.from(shot.data, "base64")));
  console.log("Screenshot written to /tmp/hdr-canvas-hdr-verify.png");
} catch {
  console.log("no screenshot");
}

if (!verdict) {
  console.error(`PASS check: TIMEOUT after ${timeout / 1000}s - no verdict reported`);
  process.exit(2);
}

console.log(JSON.stringify(verdict, null, 2));

if (verdict.error) {
  console.error(`VERDICT ERROR: ${verdict.error}`);
  process.exit(2);
}
if (expectPass && !verdict.pass) {
  console.error("VERDICT: FAIL");
  process.exit(1);
}
console.log(`VERDICT: ${verdict.pass ? "PASS" : "FAIL (expected)"}`);
process.exit(0);
