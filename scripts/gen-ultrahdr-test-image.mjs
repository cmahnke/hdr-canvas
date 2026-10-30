#!/usr/bin/env node
/**
 * Generates a synthetic HDR value-ladder image encoded as UltraHDR JPEG.
 *
 * The image contains 4 vertical bars with raw linear scene values
 * 1.0 / 2.0 / 4.0 / 8.0 (SDR-reference-white relative). It is encoded with
 * `ultrahdr_app` (libultrahdr) using a linear rgbahalffloat input, so the
 * JPEG's gain map carries the full dynamic range up to 8x SDR white.
 *
 * The result is used by the browser test page (`tests/site/hdr-verify.html`)
 * to verify that an HDR canvas pipeline actually outputs values > 1.0.
 *
 * Usage: node scripts/gen-ultrahdr-test-image.mjs [output.jpeg]
 * Requires the `ultrahdr_app` binary on PATH.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const WIDTH = 1024;
const HEIGHT = 256;
const STEPS = [1, 2, 4, 8]; // SDR reference white relative linear values

/** Converts a float to IEEE 754 half precision bits */
function toHalf(value) {
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, value);
  const f32bits = view.getUint32(0);
  const sign = (f32bits >>> 16) & 0x8000;
  const exp = (f32bits >>> 23) & 0xff;
  let mant = f32bits & 0x7fffff;
  if (exp === 0xff) {
    return sign | (mant !== 0 ? 0x7fff : 0x7c00);
  }
  // Subnormal f32 -> inf in f16
  if (exp === 0) {
    return sign;
  }
  // Re-bias from f32 exp (127) to f16 exp (15), clamp to f16 range
  const e = exp - 127 + 15;
  if (e >= 0x1f) {
    return sign | 0x7c00; // overflow -> inf
  }
  if (e <= 0) {
    // Subnormal f16 - small values only, should not happen for the ladder
    if (e < -10) {
      return sign;
    }
    mant = (mant | 0x800000) >> (1 - e);
    return sign | (mant >> 13);
  }
  return sign | (e << 10) | (mant >> 13);
}

function generateRawF16() {
  const bar = Math.floor(WIDTH / STEPS.length);
  const data = new Uint8Array(WIDTH * HEIGHT * 4 * 2);
  const view = new DataView(data.buffer);
  let offset = 0;
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const value = STEPS[Math.min(Math.floor(x / bar), STEPS.length - 1)];
      for (let c = 0; c < 4; c++) {
        view.setUint16(offset, toHalf(value), true);
        offset += 2;
      }
    }
  }
  return data;
}

function encode(raw, output) {
  const tmp = mkdtempSync(join(tmpdir(), "hdr-ladder-"));
  const rawPath = join(tmp, "ladder.rawf16");
  writeFileSync(rawPath, raw);
  execFileSync(
    "ultrahdr_app",
    [
      "-m",
      "0",
      "-a",
      "4", // rgbahalffloat
      "-R",
      "1", // full color range
      "-t",
      "0", // linear transfer
      "-C",
      "1", // p3 hdr color gamut
      "-p",
      rawPath,
      "-w",
      String(WIDTH),
      "-h",
      String(HEIGHT),
      "-q",
      "95",
      "-Q",
      "95",
      "-L",
      "203", // lowest target peak: hdrCapacityMax = 1, so the full gain applies on any HDR display
      "-z",
      output
    ],
    { stdio: "inherit" }
  );
}

const output = resolve(process.argv[2] ?? "tests/site/public/images/hdr-steps-ultrahdr.jpeg");
mkdirSync(join(output, ".."), { recursive: true });
const raw = generateRawF16();
encode(raw, output);

const size = readFileSync(output).byteLength;
console.log(`Generated ${output} (${size} bytes), steps: ${STEPS.join(" / ")}`);
