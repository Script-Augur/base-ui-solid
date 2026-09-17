import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'

import { Field } from '../src/field'
import { Form } from '../src/form'

import type { Errors } from '../src/internals/form-context/FormContext'

const meta = {
  title: 'Components/Form',
  component: Form,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Form>

export default meta
type Story = StoryObj<typeof meta>

const formStyle = {
  display: 'flex',
  'flex-direction': 'column',
  gap: '1rem',
  width: '18rem',
}

const fieldStyle = {
  display: 'flex',
  'flex-direction': 'column',
  'align-items': 'start',
  gap: '0.25rem',
}

const labelStyle = {
  'font-size': '0.875rem',
  'font-weight': '700',
  color: '#111827',
}

const controlStyle = {
  display: 'block',
  width: '100%',
  height: '2rem',
  padding: '0 0.5rem',
  border: '1px solid #111827',
  'font-size': '0.875rem',
}

const errorStyle = {
  'font-size': '0.75rem',
  color: '#dc2626',
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
    <Form
      style={formStyle}
      onFormSubmit={values => {
        console.log(values)
      }}
    >
      <Field.Root name="email" style={fieldStyle}>
        <Field.Label style={labelStyle}>Email</Field.Label>
        <Field.Control
          type="email"
          required
          placeholder="you@example.com"
          style={controlStyle}
        />
        <Field.Error style={errorStyle} />
      </Field.Root>
      <button type="submit" style={buttonStyle}>
        Submit
      </button>
    </Form>
  ),
}

export const ExternalErrors: Story = {
  render: () => {
    const [errors, errorsAssign] = createSignal<Errors>({})

    return (
      <Form
        style={formStyle}
        errors={errors()}
        onSubmit={event => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          const email = String(data.get('email') ?? '')
          errorsAssign(
            email.includes('@') ? {} : { email: 'Enter a valid email address' }
          )
        }}
      >
        <Field.Root name="email" style={fieldStyle}>
          <Field.Label style={labelStyle}>Email</Field.Label>
          <Field.Control type="email" style={controlStyle} />
          <Field.Error style={errorStyle} />
        </Field.Root>
        <button type="submit" style={buttonStyle}>
          Check
        </button>
      </Form>
    )
  },
}
