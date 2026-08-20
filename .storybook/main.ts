import type { StorybookConfig } from "storybook-solidjs-vite"

const config: StorybookConfig = {
  stories: ["../packages/solid/stories/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "storybook-solidjs-vite",
    options: {},
  },
  async viteFinal(config) {
    const { default: solid } = await import("vite-plugin-solid")
    config.plugins = [...(config.plugins ?? []), solid()]
    return config
  },
}

export default config
