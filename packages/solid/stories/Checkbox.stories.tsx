import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'

import { Checkbox } from '../src/checkbox'
import { Field } from '../src/field'
import { Form } from '../src/form'

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Checkbox.Root>

export default meta
type Story = StoryObj<typeof meta>

const rootStyle = {
  display: 'flex',
  'align-items': 'center',
  gap: '0.5rem',
  'font-family': 'system-ui, sans-serif',
  'font-size': '0.875rem',
}

const boxStyle = {
  width: '1.125rem',
  height: '1.125rem',
  border: '1px solid #111827',
  display: 'inline-flex',
  'align-items': 'center',
  'justify-content': 'center',
  cursor: 'pointer',
  'flex-shrink': '0',
}

const indicatorStyle = {
  'font-size': '0.75rem',
  'line-height': '1',
}

export const Basic: Story = {
  render: () => (
    <label style={rootStyle}>
      <Checkbox.Root style={boxStyle} defaultChecked>
        <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
      </Checkbox.Root>
      Enable notifications
    </label>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [checked, checkedAssign] = createSignal(false)
    return (
      <label style={rootStyle}>
        <Checkbox.Root
          style={boxStyle}
          checked={checked()}
          onCheckedChange={next => checkedAssign(next)}
        >
          <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
        </Checkbox.Root>
        Controlled ({checked() ? 'on' : 'off'})
      </label>
    )
  },
}

export const Indeterminate: Story = {
  render: () => (
    <label style={rootStyle}>
      <Checkbox.Root style={boxStyle} indeterminate>
        <Checkbox.Indicator style={indicatorStyle}>−</Checkbox.Indicator>
      </Checkbox.Root>
      Partially selected
    </label>
  ),
}

export const WithField: Story = {
  render: () => (
    <Field.Root
      name="terms"
      style={{ display: 'flex', 'flex-direction': 'column', gap: '0.25rem' }}
    >
      <label style={rootStyle}>
        <Checkbox.Root style={boxStyle} required>
          <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
        </Checkbox.Root>
        <Field.Label>Accept terms</Field.Label>
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
          <Checkbox.Root style={boxStyle} value="yes">
            <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
          </Checkbox.Root>
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
