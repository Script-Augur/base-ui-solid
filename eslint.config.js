// @ts-check

import { createScriptAugurEslintConfig } from "@script-augur/eslint-config"
import { tanstackConfig } from "@tanstack/eslint-config"

export default createScriptAugurEslintConfig({
  tanstackConfig,
  ignores: [
    ".changeset/**",
    ".github/**",
    ".storybook/**",
    "coverage/**",
    "dist/**",
    "eslint.config.js",
    "node_modules/**",
    "packages/*/dist/**",
    "packages/*/stories/**",
    "packages/*/tsup.config.ts",
    "packages/*/vitest.config.ts",
    "packages/*/vitest.setup.ts",
    "storybook-static/**",
    "vitest.config.ts",
  ],
})
