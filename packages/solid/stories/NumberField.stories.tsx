import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'

import { Field } from '../src/field'
import { NumberField } from '../src/number-field'

const meta = {
  title: 'Components/NumberField',
  component: NumberField.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof NumberField.Root>

export default meta
type Story = StoryObj<typeof meta>

const groupStyle = {
  display: 'flex',
  'align-items': 'center',
  gap: '0.25rem',
}

const inputStyle = {
  width: '6rem',
  height: '2rem',
  padding: '0 0.5rem',
  border: '1px solid #111827',
  'font-size': '0.875rem',
  'text-align': 'center' as const,
}

const buttonStyle = {
  width: '2rem',
  height: '2rem',
  border: '1px solid #111827',
  background: '#fff',
  cursor: 'pointer',
  'font-size': '1rem',
  'line-height': 1,
}

const labelStyle = {
  display: 'block',
  'margin-bottom': '0.375rem',
  'font-size': '0.875rem',
  'font-weight': '500',
}

export const Basic: Story = {
  render: () => (
    <NumberField.Root defaultValue={0}>
      <NumberField.Group style={groupStyle}>
        <NumberField.Decrement style={buttonStyle}>-</NumberField.Decrement>
        <NumberField.Input style={inputStyle} />
        <NumberField.Increment style={buttonStyle}>+</NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, valueAssign] = createSignal<number | null>(5)
    return (
      <div>
        <NumberField.Root
          value={value()}
          onValueChange={next => valueAssign(next)}
        >
          <NumberField.Group style={groupStyle}>
            <NumberField.Decrement style={buttonStyle}>-</NumberField.Decrement>
            <NumberField.Input style={inputStyle} />
            <NumberField.Increment style={buttonStyle}>+</NumberField.Increment>
          </NumberField.Group>
        </NumberField.Root>
        <p style={{ 'margin-top': '0.5rem', 'font-size': '0.75rem' }}>
          Value: {String(value())}
        </p>
      </div>
    )
  },
}

export const WithField: Story = {
  render: () => (
    <Field.Root name="quantity">
      <Field.Label style={labelStyle}>Quantity</Field.Label>
      <NumberField.Root defaultValue={1} min={0} max={99}>
        <NumberField.Group style={groupStyle}>
          <NumberField.Decrement style={buttonStyle}>-</NumberField.Decrement>
          <NumberField.Input style={inputStyle} />
          <NumberField.Increment style={buttonStyle}>+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
      <Field.Error style={{ color: '#dc2626', 'font-size': '0.75rem' }} />
    </Field.Root>
  ),
}

export const WithScrubArea: Story = {
  render: () => (
    <NumberField.Root defaultValue={10}>
      <NumberField.ScrubArea
        style={{
          display: 'inline-flex',
          'align-items': 'center',
          gap: '0.5rem',
          cursor: 'ew-resize',
          padding: '0.25rem 0',
        }}
      >
        <label style={{ 'font-size': '0.875rem', 'user-select': 'none' }}>
          Amount
        </label>
        <NumberField.ScrubAreaCursor
          style={{
            width: '12px',
            height: '12px',
            'border-radius': '50%',
            background: '#111827',
          }}
        />
      </NumberField.ScrubArea>
      <NumberField.Group style={{ ...groupStyle, 'margin-top': '0.5rem' }}>
        <NumberField.Decrement style={buttonStyle}>-</NumberField.Decrement>
        <NumberField.Input style={inputStyle} />
        <NumberField.Increment style={buttonStyle}>+</NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  ),
}
