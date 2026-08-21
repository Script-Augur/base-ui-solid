import { defineConfig } from "vitest/config"

/**
 * Root Vitest config — `pnpm test` watches all packages with normal Vitest
 * output; `pnpm test:run` is the one-shot CI entrypoint.
 */
export default defineConfig({
  test: {
    projects: ["packages/utils", "packages/solid"],
  },
})
