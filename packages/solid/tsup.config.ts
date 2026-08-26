import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { solidPlugin } from 'esbuild-plugin-solid'
import { defineConfig } from 'tsup'

const packageDir = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  readFileSync(join(packageDir, 'package.json'), 'utf8')
) as { name: string; version: string }

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    button: 'src/button/index.ts',
    separator: 'src/separator/index.ts',
    toggle: 'src/toggle/index.ts',
    'toggle-group': 'src/toggle-group/index.ts',
    collapsible: 'src/collapsible/index.ts',
    accordion: 'src/accordion/index.ts',
    tabs: 'src/tabs/index.ts',
    progress: 'src/progress/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  define: {
    __PACKAGE_VERSION__: JSON.stringify(pkg.version),
    __PACKAGE_NAME__: JSON.stringify(pkg.name),
  },
  esbuildPlugins: [solidPlugin()],
  esbuildOptions(options) {
    options.jsx = 'preserve'
  },
})
