import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { NodePackageImporter } from "sass";

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
        find: /~\/hdr-canvas\/three/,
        replacement: resolve(__dirname, "../../three")
      },
      {
        find: /~\/hdr-canvas/,
        replacement: resolve(__dirname, "../../src/index.ts")
      }
    ]
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        importers: [new NodePackageImporter()]
      }
    }
  }
});
