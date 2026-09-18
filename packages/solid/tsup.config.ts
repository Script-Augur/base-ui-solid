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
    meter: 'src/meter/index.ts',
    avatar: 'src/avatar/index.ts',
    'scroll-area': 'src/scroll-area/index.ts',
    portal: 'src/portal/index.ts',
    field: 'src/field/index.ts',
    dialog: 'src/dialog/index.ts',
    'alert-dialog': 'src/alert-dialog/index.ts',
    popover: 'src/popover/index.ts',
    fieldset: 'src/fieldset/index.ts',
    form: 'src/form/index.ts',
    input: 'src/input/index.ts',
    'number-field': 'src/number-field/index.ts',
    checkbox: 'src/checkbox/index.ts',
    'checkbox-group': 'src/checkbox-group/index.ts',
    switch: 'src/switch/index.ts',
    radio: 'src/radio/index.ts',
    'radio-group': 'src/radio-group/index.ts',
    select: 'src/select/index.ts',
    combobox: 'src/combobox/index.ts',
    autocomplete: 'src/autocomplete/index.ts',
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
