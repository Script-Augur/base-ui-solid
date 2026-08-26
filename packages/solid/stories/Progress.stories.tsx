import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'

import { Progress } from '../src/progress'

const meta = {
  title: 'Components/Progress',
  component: Progress.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Progress.Root>

export default meta
type Story = StoryObj<typeof meta>

const trackStyle = {
  width: '16rem',
  height: '0.5rem',
  'background-color': '#e5e7eb',
  'border-radius': '9999px',
  overflow: 'hidden',
}

const indicatorStyle = {
  height: '100%',
  'background-color': '#2563eb',
  'border-radius': '9999px',
}

export const Determinate: Story = {
  render: () => (
    <Progress.Root value={60}>
      <Progress.Label>Upload progress</Progress.Label>
      <Progress.Value />
      <Progress.Track style={trackStyle}>
        <Progress.Indicator style={indicatorStyle} />
      </Progress.Track>
    </Progress.Root>
  ),
}

export const Indeterminate: Story = {
  render: () => (
    <Progress.Root value={null}>
      <Progress.Label>Processing</Progress.Label>
      <Progress.Track style={trackStyle}>
        <Progress.Indicator style={indicatorStyle} />
      </Progress.Track>
    </Progress.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, valueAssign] = createSignal<number | null>(25)

    return (
      <div style={{ display: 'grid', gap: '0.75rem', width: '16rem' }}>
        <Progress.Root value={value()}>
          <Progress.Label>Download</Progress.Label>
          <Progress.Value />
          <Progress.Track style={trackStyle}>
            <Progress.Indicator style={indicatorStyle} />
          </Progress.Track>
        </Progress.Root>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => valueAssign(v => Math.min(100, (v ?? 0) + 10))}
          >
            +10
          </button>
          <button type="button" onClick={() => valueAssign(null)}>
            Reset
          </button>
        </div>
      </div>
    )
  },
}
