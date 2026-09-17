import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Field } from '../src/field'
import { Fieldset } from '../src/fieldset'

const meta = {
  title: 'Components/Fieldset',
  component: Fieldset.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Fieldset.Root>

export default meta
type Story = StoryObj<typeof meta>

const fieldsetStyle = {
  border: 0,
  margin: 0,
  padding: 0,
  display: 'flex',
  'flex-direction': 'column',
  gap: '1rem',
  width: '16rem',
}

const legendStyle = {
  'border-bottom': '1px solid #111827',
  'font-weight': '700',
  'font-size': '1rem',
  color: '#111827',
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

export const Basic: Story = {
  render: () => (
    <Fieldset.Root style={fieldsetStyle}>
      <Fieldset.Legend style={legendStyle}>Billing details</Fieldset.Legend>

      <Field.Root style={fieldStyle}>
        <Field.Label style={labelStyle}>Company</Field.Label>

        <Field.Control placeholder="Enter company name" style={controlStyle} />
      </Field.Root>

      <Field.Root style={fieldStyle}>
        <Field.Label style={labelStyle}>Tax ID</Field.Label>

        <Field.Control placeholder="Enter fiscal number" style={controlStyle} />
      </Field.Root>
    </Fieldset.Root>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Fieldset.Root disabled style={fieldsetStyle}>
      <Fieldset.Legend style={legendStyle}>Account</Fieldset.Legend>

      <Field.Root style={fieldStyle}>
        <Field.Label style={labelStyle}>Email</Field.Label>

        <Field.Control
          type="email"
          placeholder="you@example.com"
          style={controlStyle}
        />
      </Field.Root>
    </Fieldset.Root>
  ),
}
