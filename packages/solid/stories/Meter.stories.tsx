import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'

import { Meter } from '../src/meter'

const meta = {
  title: 'Components/Meter',
  component: Meter.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Meter.Root>

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
  'background-color': '#16a34a',
  'border-radius': '9999px',
}

export const Default: Story = {
  render: () => (
    <Meter.Root value={72}>
      <Meter.Label>Battery</Meter.Label>
      <Meter.Value />
      <Meter.Track style={trackStyle}>
        <Meter.Indicator style={indicatorStyle} />
      </Meter.Track>
    </Meter.Root>
  ),
}

export const CustomRange: Story = {
  render: () => (
    <Meter.Root value={0.75} min={0} max={1}>
      <Meter.Label>Storage used</Meter.Label>
      <Meter.Value />
      <Meter.Track style={trackStyle}>
        <Meter.Indicator style={indicatorStyle} />
      </Meter.Track>
    </Meter.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, valueAssign] = createSignal(40)

    return (
      <div style={{ display: 'grid', gap: '0.75rem', width: '16rem' }}>
        <Meter.Root value={value()}>
          <Meter.Label>Volume</Meter.Label>
          <Meter.Value />
          <Meter.Track style={trackStyle}>
            <Meter.Indicator style={indicatorStyle} />
          </Meter.Track>
        </Meter.Root>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => valueAssign(v => Math.max(0, v - 10))}
          >
            -10
          </button>
          <button
            type="button"
            onClick={() => valueAssign(v => Math.min(100, v + 10))}
          >
            +10
          </button>
        </div>
      </div>
    )
  },
}

/** Browser-only QA for skipped `internal styles` cases (computed left/width). */
export const IndicatorLayoutQA: Story = {
  name: 'Indicator layout (manual QA)',
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Meter.Root value={33} style={{ width: '100px' }}>
        <Meter.Label>33%</Meter.Label>
        <Meter.Track style={{ ...trackStyle, width: '100px' }}>
          <Meter.Indicator data-testid="indicator-33" style={indicatorStyle} />
        </Meter.Track>
      </Meter.Root>
      <Meter.Root value={0} style={{ width: '100px' }}>
        <Meter.Label>0%</Meter.Label>
        <Meter.Track style={{ ...trackStyle, width: '100px' }}>
          <Meter.Indicator data-testid="indicator-0" style={indicatorStyle} />
        </Meter.Track>
      </Meter.Root>
    </div>
  ),
}
