import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'

import { Field } from '../src/field'

const meta = {
  title: 'Components/Field',
  component: Field.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Field.Root>

export default meta
type Story = StoryObj<typeof meta>

const controlStyle = {
  display: 'block',
  width: '16rem',
  padding: '0.5rem 0.75rem',
  'border-radius': '0.375rem',
  border: '1px solid #d1d5db',
  'font-size': '0.875rem',
}

const labelStyle = {
  display: 'block',
  'margin-bottom': '0.375rem',
  'font-size': '0.875rem',
  'font-weight': '500',
}

const descriptionStyle = {
  'margin-top': '0.375rem',
  'font-size': '0.75rem',
  color: '#6b7280',
}

const errorStyle = {
  'margin-top': '0.375rem',
  'font-size': '0.75rem',
  color: '#dc2626',
}

export const Basic: Story = {
  render: () => (
    <Field.Root name="email" validationMode="onBlur">
      <Field.Label style={labelStyle}>Email</Field.Label>
      <Field.Control
        type="email"
        required
        placeholder="you@example.com"
        style={controlStyle}
      />
      <Field.Description style={descriptionStyle}>
        We will never share your email.
      </Field.Description>
      <Field.Error style={errorStyle} />
    </Field.Root>
  ),
}

export const ValidateOnChange: Story = {
  render: () => (
    <Field.Root
      name="username"
      validationMode="onChange"
      validate={value => {
        if (typeof value !== 'string' || value.length < 3) {
          return 'Username must be at least 3 characters'
        }
        return null
      }}
    >
      <Field.Label style={labelStyle}>Username</Field.Label>
      <Field.Control style={controlStyle} />
      <Field.Error style={errorStyle} />
    </Field.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, valueAssign] = createSignal('')

    return (
      <Field.Root name="name" validationMode="onChange">
        <Field.Label style={labelStyle}>Name</Field.Label>
        <Field.Control
          value={value()}
          onValueChange={next => valueAssign(next)}
          style={controlStyle}
        />
        <Field.Description style={descriptionStyle}>
          Value: {value() || '(empty)'}
        </Field.Description>
      </Field.Root>
    )
  },
}

export const ValidityRender: Story = {
  render: () => (
    <Field.Root name="code" validationMode="onBlur">
      <Field.Label style={labelStyle}>Code</Field.Label>
      <Field.Control required pattern="[A-Z]{3}" style={controlStyle} />
      <Field.Validity>
        {validity => (
          <p style={descriptionStyle}>
            valid={String(validity.validity.valid)} dirty=
            {String(validity.value !== validity.initialValue)}
          </p>
        )}
      </Field.Validity>
      <Field.Error style={errorStyle} match="valueMissing">
        Required
      </Field.Error>
      <Field.Error style={errorStyle} match="patternMismatch">
        Use 3 uppercase letters
      </Field.Error>
    </Field.Root>
  ),
}
