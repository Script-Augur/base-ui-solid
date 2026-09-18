import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal, For } from 'solid-js'

import { Field } from '../src/field'
import { OTPField } from '../src/otp-field'

const meta = {
  title: 'Components/OTPField',
  component: OTPField.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof OTPField.Root>

export default meta
type Story = StoryObj<typeof meta>

const rootStyle = {
  display: 'flex',
  gap: '0.5rem',
  'align-items': 'center',
}

const inputStyle = {
  width: '2.25rem',
  height: '2.5rem',
  'text-align': 'center' as const,
  'font-size': '1.125rem',
  border: '1px solid #111827',
  'border-radius': '0.25rem',
}

const labelStyle = {
  display: 'block',
  'margin-bottom': '0.375rem',
  'font-size': '0.875rem',
  'font-weight': '500',
}

export const Basic: Story = {
  render: () => (
    <OTPField.Root length={6} style={rootStyle}>
      <For each={[0, 1, 2, 3, 4, 5]}>
        {() => <OTPField.Input style={inputStyle} />}
      </For>
    </OTPField.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, valueAssign] = createSignal('')
    return (
      <div>
        <OTPField.Root
          length={4}
          value={value()}
          onValueChange={next => valueAssign(next)}
          style={rootStyle}
        >
          <For each={[0, 1, 2, 3]}>
            {() => <OTPField.Input style={inputStyle} />}
          </For>
        </OTPField.Root>
        <p style={{ 'margin-top': '0.5rem', 'font-size': '0.75rem' }}>
          Value: {value() || '(empty)'}
        </p>
      </div>
    )
  },
}

export const Grouped: Story = {
  render: () => (
    <OTPField.Root length={6} style={rootStyle}>
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <OTPField.Input style={inputStyle} />
        <OTPField.Input style={inputStyle} />
        <OTPField.Input style={inputStyle} />
      </div>
      <OTPField.Separator />
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <OTPField.Input style={inputStyle} />
        <OTPField.Input style={inputStyle} />
        <OTPField.Input style={inputStyle} />
      </div>
    </OTPField.Root>
  ),
}

export const WithField: Story = {
  render: () => (
    <Field.Root name="otp" required>
      <Field.Label style={labelStyle}>Verification code</Field.Label>
      <OTPField.Root length={6} style={rootStyle}>
        <For each={[0, 1, 2, 3, 4, 5]}>
          {() => <OTPField.Input style={inputStyle} />}
        </For>
      </OTPField.Root>
      <Field.Error style={{ color: '#dc2626', 'font-size': '0.75rem' }} />
    </Field.Root>
  ),
}

export const Alphanumeric: Story = {
  render: () => (
    <OTPField.Root length={6} validationType="alphanumeric" style={rootStyle}>
      <For each={[0, 1, 2, 3, 4, 5]}>
        {() => <OTPField.Input style={inputStyle} />}
      </For>
    </OTPField.Root>
  ),
}
