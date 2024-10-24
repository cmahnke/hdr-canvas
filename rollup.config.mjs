import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

const config = [
  {
    input: "src/index.ts",
    output: {
      file: "dist/hdr-canvas.cjs",
      format: "cjs",
      sourcemap: true
    },
    external: ["three"],
    plugins: [typescript(), nodeResolve()]
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/hdr-canvas.js",
      format: "es",
      sourcemap: true
    },
    external: ["three"],
    plugins: [typescript(), nodeResolve()]
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/hdr-canvas.min.js",
      format: "iife",
      name: "HDRCanvas",
      sourcemap: true
    },
    external: ["three"],
    plugins: [typescript(), nodeResolve(), terser()]
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/hdr-canvas.d.ts",
      format: "es"
    },
    plugins: [dts()]
  }
];

export default config;
