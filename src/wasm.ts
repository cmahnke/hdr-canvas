import { WASM_ABI, WASM_BASE64, WASM_BYTE_LENGTH } from "./wasm/kernel";

/**
 * Experimental WASM acceleration for `Float16Image` pixel loops.
 *
 * Disabled by default: enable explicitly with `setWasmEnabled(true)`.
 * The WASM kernel is inlined as base64 (no `.wasm` asset URL handling), and
 * every accelerated call falls back to plain JS when WebAssembly is
 * unavailable, denied (e.g. CSP without `wasm-unsafe-eval`), or fails for any
 * other reason. The WASM path never throws.
 *
 * Measured reality (Node 24, gain over 12 M values): JS ~12 ms vs WASM ~51 ms
 * with only ~3 ms of that in copies. Engines with native `Float16Array`
 * convert via hardware F16C instructions that this scalar kernel can't beat,
 * so keep the flag off for gain. The loader stays as tested infrastructure
 * for future compute-heavy kernels where arithmetic intensity amortizes the
 * copy cost.
 */

type KernelExports = {
  memory: WebAssembly.Memory;
  ABI_VERSION: WebAssembly.Global;
  arena_reset: () => void;
  arena_alloc: (size: number) => number;
  gain_run: (ptr: number, quads: number, gr: number, gg: number, gb: number, ga: number) => void;
};

function envOptIn(): boolean {
  try {
    const proc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
    return proc?.env?.["HDR_CANVAS_WASM"] === "1";
  } catch {
    return false;
  }
}

let enabled = envOptIn();
let cached: KernelExports | null = null;
let failed = false;

/** Enables or disables the experimental WASM acceleration (default: disabled). */
export function setWasmEnabled(value: boolean): void {
  enabled = value;
  if (value) {
    // Allow a retry after a previous failure.
    failed = false;
  }
}

/** Whether WASM acceleration is enabled (opt-in via `setWasmEnabled(true)`). */
export function isWasmEnabled(): boolean {
  return enabled;
}

/** Whether a WASM kernel instance is currently instantiated and cached. */
export function isWasmReady(): boolean {
  return cached !== null;
}

/**
 * Minimum `Float16Array` length (values, not pixels) for dispatching to WASM.
 * Below this the call + copy overhead outweighs the kernel win.
 */
export const WASM_MIN_VALUES = 1 << 20;

function decodeBase64(b64: string): Uint8Array {
  const g = globalThis as unknown as {
    Buffer?: { from(s: string, enc: string): Uint8Array };
    atob?: (s: string) => string;
  };
  if (typeof g.Buffer?.from === "function") {
    return g.Buffer.from(b64, "base64");
  }
  if (typeof g.atob === "function") {
    const bin = g.atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }
  throw new Error("no base64 decoder available");
}

function ensureInstance(): KernelExports | null {
  if (cached !== null) {
    return cached;
  }
  if (failed || typeof WebAssembly === "undefined") {
    return null;
  }
  try {
    const raw = decodeBase64(WASM_BASE64);
    if (raw.length !== WASM_BYTE_LENGTH) {
      failed = true;
      return null;
    }
    // Copy into a fresh Uint8Array so the type is Uint8Array<ArrayBuffer>,
    // as required by WebAssembly.Module.
    const bytes = Uint8Array.from(raw);
    const mod = new WebAssembly.Module(bytes);
    const instance = new WebAssembly.Instance(mod, {});
    const exports = instance.exports as unknown as KernelExports;
    if (exports.ABI_VERSION?.value !== WASM_ABI || typeof exports.gain_run !== "function") {
      failed = true;
      return null;
    }
    cached = exports;
    return cached;
  } catch {
    failed = true;
    return null;
  }
}

/**
 * Runs the WASM gain kernel in place over `data` (raw f16 bits, RGBA quads).
 * Alpha is multiplied by `ga` (pass `1` to preserve it).
 *
 * @returns `true` if the kernel ran, `false` if the caller should use the JS
 * implementation instead. Never throws.
 */
export function tryApplyGainWasm(data: Float16Array, gr: number, gg: number, gb: number, ga: number): boolean {
  try {
    if (data.length === 0 || data.length % 4 !== 0) {
      return false;
    }
    const kernel = ensureInstance();
    if (kernel === null) {
      return false;
    }
    // Views are (re)created per call because growing memory detaches buffers.
    const source = new Uint16Array(data.buffer, data.byteOffset, data.length);
    kernel.arena_reset();
    const ptr = kernel.arena_alloc(data.length * 2);
    if (ptr === 0) {
      return false;
    }
    new Uint16Array(kernel.memory.buffer, ptr, data.length).set(source);
    kernel.gain_run(ptr, data.length / 4, gr, gg, gb, ga);
    source.set(new Uint16Array(kernel.memory.buffer, ptr, data.length));
    return true;
  } catch {
    return false;
  }
}
