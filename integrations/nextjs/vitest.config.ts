import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["verification/tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 15_000,
  },
});
