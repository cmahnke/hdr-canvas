import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

// External configs
import typescriptOptions from "./tsconfig.json" with { type: "json" };

const config = [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/hdr-canvas.js",
        format: "es",
        sourcemap: true
      },
      {
        file: "dist/hdr-canvas.umd.js",
        format: "umd",
        name: "HDRCanvas",
        sourcemap: true
      }
    ],
    external: ["three" /*, "colorjs.io" */],
    plugins: [typescript(typescriptOptions), nodeResolve()]
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
    plugins: [typescript(typescriptOptions), nodeResolve(), terser()]
  },
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/@types/hdr-canvas.d.ts",
        format: "es"
      },
      {
        file: "dist/index.d.ts",
        format: "es"
      }
    ],
    plugins: [dts()]
  }
];

export default config;
