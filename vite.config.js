import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [vue()],
  base: process.env.ROUTER_BASE || "/",
  publicDir: "static",
  build: {
    rolldownOptions: {
      output: {
        // Existing nginx serves JavaScript modules with the .js MIME mapping.
        assetFileNames: (asset) =>
          asset.names.some((name) => name.endsWith(".mjs"))
            ? "assets/[name]-[hash].js"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "~": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  define: {
    __APP_CONFIG__: JSON.stringify({
      APP_BASE_URL: process.env.ROUTER_BASE || "/",
      APP_BRANCH:
        process.env.GITHUB_REF_NAME || process.env.APP_BRANCH || "dev",
      APP_VERSION:
        process.env.APP_VERSION ||
        new Date().toISOString().slice(2, 16).replace(/[-:T]/g, "."),
    }),
  },
});
