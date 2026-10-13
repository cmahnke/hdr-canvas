// HDR gain kernel.
//
// Operates in place on raw f16 bits laid out as RGBA quads (4x u16 = 8 bytes
// per pixel). WebAssembly has no f16 arithmetic, so values are decoded to f32,
// multiplied, and encoded back with round-to-nearest-even.
//
// Memory is a simple call-scoped arena owned by JS:
//   arena_reset() -> arena_alloc(bytes) -> write -> gain_run(...) -> read.
// The arena only ever grows to the largest single call; there is nothing to free.
//
// This file is compiled with `--runtime stub --noAssert`, so the module has
// zero imports and only exports: memory, ABI_VERSION, arena_alloc,
// arena_reset, gain_run.

/** ABI version of the kernel interface, checked by the JS loader. */
export const ABI_VERSION: u32 = 1;

var arenaBase: usize = 0;
var arenaPtr: usize = 0;

/** Resets the arena; the next alloc reuses memory from the arena base. */
export function arena_reset(): void {
  arenaPtr = arenaBase;
}

/**
 * Bump-allocates `size` bytes (8-byte aligned), growing memory as needed.
 * @returns The pointer, or `0` on failure.
 */
export function arena_alloc(size: usize): usize {
  if (arenaBase == 0) {
    arenaBase = <usize>(memory.size() << 16);
    arenaPtr = arenaBase;
  }
  const p: usize = (arenaPtr + 7) & ~(<usize>7);
  const end: usize = p + size;
  const have: usize = <usize>(memory.size() << 16);
  if (end > have) {
    const pages: i32 = <i32>((end - have + 0xffff) >> 16);
    if (memory.grow(pages) < 0) {
      return 0;
    }
  }
  arenaPtr = end;
  return p;
}

/** Decodes raw f16 bits to f32 (exact). */
function f16ToF32(h: u16): f32 {
  const bits: u32 = h;
  const s: u32 = (bits >> 15) & 1;
  const e: u32 = (bits >> 10) & 0x1f;
  const m: u32 = bits & 0x3ff;
  if (e == 0) {
    if (m == 0) {
      return reinterpret<f32>(s << 31);
    }
    // Subnormal: value = m * 2^-24.
    const f: f32 = <f32>m * 5.960464477539063e-8;
    return s == 0 ? f : -f;
  }
  if (e == 31) {
    // Inf / NaN, payload preserved.
    return reinterpret<f32>((s << 31) | 0x7f800000 | (m << 13));
  }
  return reinterpret<f32>((s << 31) | ((e + 112) << 23) | (m << 13));
}

/** Encodes f32 to raw f16 bits with round-to-nearest-even. */
function f32ToF16(v: f32): u16 {
  const x: u32 = reinterpret<u32>(v);
  const sign: u32 = (x >> 16) & 0x8000;
  const exp: u32 = (x >> 23) & 0xff;
  const mant: u32 = x & 0x7fffff;
  if (exp == 0xff) {
    // Inf / NaN.
    let h: u32 = sign | 0x7c00;
    if (mant != 0) {
      h |= mant >> 13;
      if ((h & 0x3ff) == 0) {
        h |= 1; // Keep NaN a NaN.
      }
    }
    return <u16>h;
  }
  const halfExp: i32 = <i32>exp - 127 + 15;
  if (halfExp >= 31) {
    return <u16>(sign | 0x7c00); // Overflow to infinity.
  }
  if (halfExp <= 0) {
    // Subnormal or underflow.
    if (halfExp < -10) {
      return <u16>sign; // Rounds to signed zero.
    }
    let mm: u32 = mant | 0x800000;
    const shift: u32 = <u32>(14 - halfExp);
    const roundBit: u32 = 1 << (shift - 1);
    let h: u32 = mm >> shift;
    const rem: u32 = mm & ((1 << shift) - 1);
    if (rem > roundBit || (rem == roundBit && (h & 1) != 0)) {
      h++;
    }
    return <u16>(sign | h);
  }
  // Normal range: round mantissa to 10 bits, ties to even.
  let hmant: u32 = mant >> 13;
  const rem: u32 = mant & 0x1fff;
  if (rem > 0x1000 || (rem == 0x1000 && (hmant & 1) != 0)) {
    hmant++;
    if (hmant == 0x400) {
      // Carry into the exponent.
      const he: i32 = halfExp + 1;
      if (he >= 31) {
        return <u16>(sign | 0x7c00);
      }
      return <u16>(sign | ((<u32>he) << 10));
    }
  }
  return <u16>(sign | ((<u32>halfExp) << 10) | hmant);
}

/**
 * Multiplies `quads` RGBA pixels at `ptr` by per-channel gains, in place.
 * Alpha uses `ga` (pass `1` to preserve it).
 */
export function gain_run(ptr: usize, quads: usize, gr: f32, gg: f32, gb: f32, ga: f32): void {
  for (let q: usize = 0; q < quads; q++) {
    const base: usize = ptr + (q << 3);
    store<u16>(base, f32ToF16(f16ToF32(load<u16>(base)) * gr));
    store<u16>(base + 2, f32ToF16(f16ToF32(load<u16>(base + 2)) * gg));
    store<u16>(base + 4, f32ToF16(f16ToF32(load<u16>(base + 4)) * gb));
    store<u16>(base + 6, f32ToF16(f16ToF32(load<u16>(base + 6)) * ga));
  }
}
