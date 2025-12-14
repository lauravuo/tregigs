import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/scraper.ts", "src/build.ts"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "vitest.config.ts"],
    },
  },
});
