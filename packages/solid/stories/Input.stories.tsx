import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'

import { Field } from '../src/field'
import { Form } from '../src/form'
import { Input } from '../src/input'

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

const labelStyle = {
  display: 'block',
  'margin-bottom': '0.375rem',
  'font-size': '0.875rem',
  'font-weight': '500',
}

const inputStyle = {
  display: 'block',
  width: '16rem',
  height: '2rem',
  padding: '0 0.5rem',
  border: '1px solid #111827',
  'font-size': '0.875rem',
}

const errorStyle = {
  'margin-top': '0.375rem',
  'font-size': '0.75rem',
  color: '#dc2626',
}

const formStyle = {
  display: 'flex',
  'flex-direction': 'column',
  gap: '1rem',
  width: '18rem',
}

const buttonStyle = {
  height: '2.25rem',
  'border-radius': '0.375rem',
  border: '1px solid #111827',
  background: '#111827',
  color: '#fff',
  'font-size': '0.875rem',
  cursor: 'pointer',
}

export const Basic: Story = {
  render: () => (
    <label style={labelStyle}>
      Name
      <Input placeholder="e.g. Colm Tuite" style={inputStyle} />
    </label>
  ),
}

export const WithField: Story = {
  render: () => (
    <Field.Root name="email" validationMode="onBlur">
      <Field.Label style={labelStyle}>Email</Field.Label>
      <Input
        type="email"
        required
        placeholder="you@example.com"
        style={inputStyle}
      />
      <Field.Error style={errorStyle} />
    </Field.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, valueAssign] = createSignal('')

    return (
      <Field.Root name="username" validationMode="onChange">
        <Field.Label style={labelStyle}>Username</Field.Label>
        <Input
          value={value()}
          onValueChange={next => valueAssign(next)}
          style={inputStyle}
        />
        <Field.Description
          style={{
            'margin-top': '0.375rem',
            'font-size': '0.75rem',
            color: '#6b7280',
          }}
        >
          Value: {value() || '(empty)'}
        </Field.Description>
      </Field.Root>
    )
  },
}

export const WithForm: Story = {
  render: () => (
    <Form
      style={formStyle}
      onFormSubmit={values => {
        console.log(values)
      }}
    >
      <Field.Root name="name">
        <Field.Label style={labelStyle}>Name</Field.Label>
        <Input required style={inputStyle} />
        <Field.Error style={errorStyle} />
      </Field.Root>
      <button type="submit" style={buttonStyle}>
        Submit
      </button>
    </Form>
  ),
}
