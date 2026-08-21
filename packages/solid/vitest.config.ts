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
  plugins: [solid()],
  define: {
    __PACKAGE_VERSION__: JSON.stringify(pkg.version),
    __PACKAGE_NAME__: JSON.stringify(pkg.name),
  },
  test: {
    name: 'solid',
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
  },
})
