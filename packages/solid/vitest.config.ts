import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

const packageDir = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  readFileSync(join(packageDir, 'package.json'), 'utf8')
) as { name: string; version: string }

export default defineConfig({
  plugins: [
    solid({
      // Explicit DOM generate — vitest's SSR transform pass otherwise compiles
      // components for the server and solid-js/web resolves to server.js.
      solid: { generate: 'dom', hydratable: false },
      ssr: false,
    }),
  ],
  // Force browser builds of solid-js for jsdom tests.
  resolve: {
    conditions: ['browser', 'development'],
    // Resolve workspace utils from source so tests don't require a prior build.
    alias: {
      '@script-augur/base-ui-utils': join(packageDir, '../utils/src/index.ts'),
    },
  },
  ssr: {
    resolve: {
      conditions: ['browser', 'development'],
    },
  },
  define: {
    __PACKAGE_VERSION__: JSON.stringify(pkg.version),
    __PACKAGE_NAME__: JSON.stringify(pkg.name),
  },
  test: {
    name: 'solid',
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    server: {
      deps: {
        // Ensure solid-js is processed with the browser resolve conditions above.
        inline: [/solid-js/],
      },
    },
  },
})
