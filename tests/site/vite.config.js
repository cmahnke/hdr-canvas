import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: "./",
  root: resolve(__dirname),
  build: {
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
      output: {
        assetFileNames: `assets/[name].[ext]`
      }
    }
  },
  resolve: {
    alias: [
      {
        find: /~\/hdr-canvas/,
        replacement: resolve(__dirname, "../../src/index.ts")
      },
      {
        find: /~\/hdr-canvas\/three/,
        replacement: resolve(__dirname, "../../three")
      }
      /*
      {
        find: /three\/examples\/jsm/,
        replacement: resolve(__dirname, "three/examples/jsm")
      },
      {
        find: /three\/addons/,
        replacement: resolve(__dirname, "three/examples/jsm")
      },
      {
        find: /three\/tsl/,
        replacement: resolve(__dirname, "three/webgpu")
      },
      {
        find: /three/,
        replacement: resolve(__dirname, "three/webgpu")
      }
      */
    ]
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    }
  }
});
