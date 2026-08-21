import type { Meta, StoryObj } from "storybook-solidjs-vite"

import {
  DirectionProvider,
  PACKAGE_NAME,
  useDirection,
  version,
} from "../src"

import type { TextDirection } from "../src"

const meta = {
  title: "Core/Primitives",
  parameters: { layout: "centered" },
} satisfies Meta

export default meta
type Story = StoryObj

type DirectionArgs = {
  direction: TextDirection
}

export const PackageInfo: Story = {
  render: () => (
    <div>
      <p>{PACKAGE_NAME}</p>
      <p>version {version}</p>
    </div>
  ),
}

function DirectionProbe() {
  const direction = useDirection()
  return (
    <div dir={direction()} style={{ "text-align": "start", "max-width": "28rem" }}>
      <p data-testid="direction">
        Resolved direction: <strong>{direction()}</strong>
      </p>
      <ol>
        <li>
          Open the Controls panel at the bottom of this canvas.
        </li>
        <li>
          Toggle the <code>direction</code> control between <code>ltr</code>{" "}
          and <code>rtl</code>.
        </li>
        <li>
          Confirm the resolved value updates and start-aligned content flips.
        </li>
      </ol>
      <p>Sample start-aligned text — it flips when you choose rtl.</p>
    </div>
  )
}

export const Direction: StoryObj<DirectionArgs> = {
  args: {
    direction: "ltr",
  },
  argTypes: {
    direction: {
      control: "inline-radio",
      options: ["ltr", "rtl"],
      description: "Writing direction passed to DirectionProvider.",
    },
  },
  render: (args) => (
    <DirectionProvider direction={args.direction}>
      <DirectionProbe />
    </DirectionProvider>
  ),
}
