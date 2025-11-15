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
    outDir: resolve(__dirname, "../../site"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html")
      },
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
        replacement: resolve(__dirname, "../../src")
      },
      {
        find: /~\/package/,
        replacement: resolve(__dirname, "../../package.json")
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
  },
  test: {
    include: ["../../tests/*.test.*"],
    exclude: ["../../node_modules/**"]
  }
});
