import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

// External configs
import typescriptOptions from "./tsconfig.json" with { type: "json" };

//const tsOptions = Object.assign(typescriptOptions, { rootDir: "src" });
const tsOptions = typescriptOptions;

const config = [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/hdr-canvas.js",
        format: "es",
        sourcemap: true
      }
    ],
    external: ["three" /*, "colorjs.io" */],
    plugins: [typescript(tsOptions), nodeResolve()]
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/hdr-canvas.min.js",
      format: "es",
      sourcemap: true
    },
    external: ["three"],
    plugins: [typescript(tsOptions), nodeResolve(), terser()]
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
