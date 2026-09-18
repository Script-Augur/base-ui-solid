import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'

import { Field } from '../src/field'
import { Slider } from '../src/slider'

const meta = {
  title: 'Components/Slider',
  component: Slider.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Slider.Root>

export default meta
type Story = StoryObj<typeof meta>

const rootStyle = {
  width: '16rem',
  display: 'grid',
  gap: '0.5rem',
  'font-family': 'system-ui, sans-serif',
  'font-size': '0.875rem',
}

const controlStyle = {
  display: 'flex',
  'align-items': 'center',
  width: '100%',
  height: '1.25rem',
  'touch-action': 'none',
  'user-select': 'none',
  padding: '0.625rem 0',
  'box-sizing': 'border-box',
}

const trackStyle = {
  width: '100%',
  height: '0.25rem',
  'background-color': '#e5e7eb',
  'border-radius': '9999px',
}

const indicatorStyle = {
  'background-color': '#111827',
  'border-radius': '9999px',
}

const thumbStyle = {
  width: '1rem',
  height: '1rem',
  'background-color': '#fff',
  border: '2px solid #111827',
  'border-radius': '9999px',
  'box-sizing': 'border-box',
}

export const Default: Story = {
  render: () => (
    <Slider.Root defaultValue={40} style={rootStyle}>
      <Slider.Label>Volume</Slider.Label>
      <Slider.Value />
      <Slider.Control style={controlStyle}>
        <Slider.Track style={trackStyle}>
          <Slider.Indicator style={indicatorStyle} />
          <Slider.Thumb style={thumbStyle} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, valueAssign] = createSignal(25)

    return (
      <Slider.Root
        value={value()}
        onValueChange={next => valueAssign(next as number)}
        style={rootStyle}
      >
        <Slider.Label>Brightness</Slider.Label>
        <Slider.Value />
        <Slider.Control style={controlStyle}>
          <Slider.Track style={trackStyle}>
            <Slider.Indicator style={indicatorStyle} />
            <Slider.Thumb style={thumbStyle} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    )
  },
}

export const Range: Story = {
  render: () => (
    <Slider.Root defaultValue={[20, 70]} style={rootStyle}>
      <Slider.Label>Price range</Slider.Label>
      <Slider.Value />
      <Slider.Control style={controlStyle}>
        <Slider.Track style={trackStyle}>
          <Slider.Indicator style={indicatorStyle} />
          <Slider.Thumb index={0} style={thumbStyle} />
          <Slider.Thumb index={1} style={thumbStyle} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
}

export const Vertical: Story = {
  render: () => (
    <Slider.Root
      defaultValue={50}
      orientation="vertical"
      style={{ ...rootStyle, width: 'auto', height: '12rem' }}
    >
      <Slider.Label>Gain</Slider.Label>
      <Slider.Value />
      <Slider.Control
        style={{
          ...controlStyle,
          width: '1.25rem',
          height: '100%',
          padding: '0 0.625rem',
        }}
      >
        <Slider.Track
          style={{
            ...trackStyle,
            width: '0.25rem',
            height: '100%',
          }}
        >
          <Slider.Indicator style={indicatorStyle} />
          <Slider.Thumb style={thumbStyle} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
}

export const WithField: Story = {
  render: () => (
    <Field.Root name="volume" style={rootStyle}>
      <Slider.Root defaultValue={60}>
        <Field.Label>Volume</Field.Label>
        <Slider.Value />
        <Slider.Control style={controlStyle}>
          <Slider.Track style={trackStyle}>
            <Slider.Indicator style={indicatorStyle} />
            <Slider.Thumb style={thumbStyle} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Field.Error style={{ 'font-size': '0.75rem', color: '#dc2626' }} />
    </Field.Root>
  ),
}
