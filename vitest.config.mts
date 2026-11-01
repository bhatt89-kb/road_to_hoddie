import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Playwright specs (*.spec.ts) are run by `npm run test:e2e`, not by Vitest
    include: ["__tests__/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "__tests__/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/**", "app/api/**", "hooks/**", "components/**"],
      exclude: ["**/*.module.css", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve("./"),
    },
  },
});
