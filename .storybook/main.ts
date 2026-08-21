import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { StorybookConfig } from 'storybook-solidjs-vite'

const workspaceRoot = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  readFileSync(join(workspaceRoot, '../packages/solid/package.json'), 'utf8')
) as { name: string; version: string }

const config: StorybookConfig = {
  stories: ['../packages/solid/stories/**/*.stories.@(ts|tsx)'],
  framework: {
    name: 'storybook-solidjs-vite',
    options: {},
  },
  async viteFinal(config) {
    const { default: solid } = await import('vite-plugin-solid')
    config.plugins = [...(config.plugins ?? []), solid()]
    config.define = {
      ...config.define,
      __PACKAGE_VERSION__: JSON.stringify(pkg.version),
      __PACKAGE_NAME__: JSON.stringify(pkg.name),
    }
    return config
  },
}

export default config
