import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [{ find: /^(\.{1,2}\/.+)\.mjs$/, replacement: "$1.mts" }],
  },
  test: {
    include: ["test/**/*.test.mts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.mts"],
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
