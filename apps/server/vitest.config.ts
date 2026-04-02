import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/prisma/**",
        "src/app.ts",
        "src/config/**",
        "**/*.d.ts",
      ],
    },
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@notcast/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
