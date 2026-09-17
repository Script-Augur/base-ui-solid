import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'

import { Field } from '../src/field'
import { Form } from '../src/form'
import { Switch } from '../src/switch'

const meta = {
  title: 'Components/Switch',
  component: Switch.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Switch.Root>

export default meta
type Story = StoryObj<typeof meta>

const rootStyle = {
  display: 'flex',
  'align-items': 'center',
  gap: '0.75rem',
  'font-family': 'system-ui, sans-serif',
  'font-size': '0.875rem',
}

const trackStyle = {
  width: '2.5rem',
  height: '1.5rem',
  border: '1px solid #111827',
  display: 'inline-flex',
  'align-items': 'center',
  padding: '0.125rem',
  cursor: 'pointer',
  'flex-shrink': '0',
  'box-sizing': 'border-box',
}

const thumbStyle = {
  width: '1.125rem',
  height: '1.125rem',
  background: '#111827',
  display: 'block',
  'flex-shrink': '0',
}

export const Basic: Story = {
  render: () => (
    <label style={rootStyle}>
      <Switch.Root style={trackStyle} defaultChecked>
        <Switch.Thumb style={thumbStyle} />
      </Switch.Root>
      Enable notifications
    </label>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [checked, checkedAssign] = createSignal(false)
    return (
      <label style={rootStyle}>
        <Switch.Root
          style={trackStyle}
          checked={checked()}
          onCheckedChange={next => checkedAssign(next)}
        >
          <Switch.Thumb style={thumbStyle} />
        </Switch.Root>
        Controlled ({checked() ? 'on' : 'off'})
      </label>
    )
  },
}

export const WithField: Story = {
  render: () => (
    <Field.Root
      name="notifications"
      style={{ display: 'flex', 'flex-direction': 'column', gap: '0.25rem' }}
    >
      <label style={rootStyle}>
        <Switch.Root style={trackStyle} required>
          <Switch.Thumb style={thumbStyle} />
        </Switch.Root>
        <Field.Label>Email alerts</Field.Label>
      </label>
      <Field.Description style={{ 'font-size': '0.75rem', color: '#6b7280' }}>
        Required to continue
      </Field.Description>
      <Field.Error style={{ 'font-size': '0.75rem', color: '#dc2626' }} />
    </Field.Root>
  ),
}

export const WithForm: Story = {
  render: () => (
    <Form
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: '1rem',
        width: '16rem',
      }}
      onFormSubmit={values => {
        console.log(values)
      }}
    >
      <Field.Root name="newsletter">
        <label style={rootStyle}>
          <Switch.Root style={trackStyle} value="yes">
            <Switch.Thumb style={thumbStyle} />
          </Switch.Root>
          <Field.Label>Subscribe to newsletter</Field.Label>
        </label>
      </Field.Root>
      <button
        type="submit"
        style={{
          height: '2.25rem',
          border: '1px solid #111827',
          background: '#111827',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        Submit
      </button>
    </Form>
  ),
}
