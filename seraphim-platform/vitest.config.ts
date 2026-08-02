import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "seraphim_desktop_companion/src/**/*.test.ts"],
    testTimeout: 15000,
    // Parallel file runs can hang on Windows when multiple suites import the
    // large routers graph at once; serial collection keeps the suite reliable.
    fileParallelism: false,
  },
});
