import type { Meta, StoryObj } from "storybook-solidjs-vite"

import { PACKAGE_NAME, version } from "../src"

const meta = {
  title: "Scaffold/Stub",
  parameters: { layout: "centered" },
} satisfies Meta

export default meta
type Story = StoryObj

export const PackageStub: Story = {
  render: () => (
    <div>
      <p>{PACKAGE_NAME}</p>
      <p>version {version}</p>
    </div>
  ),
}
