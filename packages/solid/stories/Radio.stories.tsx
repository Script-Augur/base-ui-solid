import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'

import { Field } from '../src/field'
import { Form } from '../src/form'
import { Radio } from '../src/radio'
import { RadioGroup } from '../src/radio-group'

const meta = {
  title: 'Components/Radio',
  component: RadioGroup,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

const groupStyle = {
  display: 'flex',
  'flex-direction': 'column',
  gap: '0.5rem',
  'font-family': 'system-ui, sans-serif',
  'font-size': '0.875rem',
}

const itemStyle = {
  display: 'flex',
  'align-items': 'center',
  gap: '0.5rem',
  cursor: 'pointer',
}

const radioStyle = {
  width: '1.125rem',
  height: '1.125rem',
  border: '1px solid #111827',
  display: 'inline-flex',
  'align-items': 'center',
  'justify-content': 'center',
  'flex-shrink': '0',
  'box-sizing': 'border-box',
}

const indicatorStyle = {
  width: '0.5rem',
  height: '0.5rem',
  background: '#111827',
  display: 'block',
}

export const Basic: Story = {
  render: () => (
    <RadioGroup defaultValue="apple" style={groupStyle} name="fruit">
      <label style={itemStyle}>
        <Radio.Root value="apple" style={radioStyle}>
          <Radio.Indicator style={indicatorStyle} />
        </Radio.Root>
        Apple
      </label>
      <label style={itemStyle}>
        <Radio.Root value="banana" style={radioStyle}>
          <Radio.Indicator style={indicatorStyle} />
        </Radio.Root>
        Banana
      </label>
    </RadioGroup>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, valueAssign] = createSignal('a')
    return (
      <div style={groupStyle}>
        <RadioGroup
          value={value()}
          onValueChange={next => valueAssign(String(next))}
          style={groupStyle}
        >
          <label style={itemStyle}>
            <Radio.Root value="a" style={radioStyle}>
              <Radio.Indicator style={indicatorStyle} />
            </Radio.Root>
            Option A
          </label>
          <label style={itemStyle}>
            <Radio.Root value="b" style={radioStyle}>
              <Radio.Indicator style={indicatorStyle} />
            </Radio.Root>
            Option B
          </label>
        </RadioGroup>
        <span>Selected: {value()}</span>
      </div>
    )
  },
}

export const WithField: Story = {
  render: () => (
    <Field.Root
      name="plan"
      style={{ display: 'flex', 'flex-direction': 'column', gap: '0.25rem' }}
    >
      <Field.Label>Plan</Field.Label>
      <RadioGroup required style={groupStyle}>
        <label style={itemStyle}>
          <Radio.Root value="free" style={radioStyle}>
            <Radio.Indicator style={indicatorStyle} />
          </Radio.Root>
          Free
        </label>
        <label style={itemStyle}>
          <Radio.Root value="pro" style={radioStyle}>
            <Radio.Indicator style={indicatorStyle} />
          </Radio.Root>
          Pro
        </label>
      </RadioGroup>
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
      <Field.Root name="size">
        <Field.Label>Size</Field.Label>
        <RadioGroup style={groupStyle}>
          <label style={itemStyle}>
            <Radio.Root value="s" style={radioStyle}>
              <Radio.Indicator style={indicatorStyle} />
            </Radio.Root>
            Small
          </label>
          <label style={itemStyle}>
            <Radio.Root value="m" style={radioStyle}>
              <Radio.Indicator style={indicatorStyle} />
            </Radio.Root>
            Medium
          </label>
        </RadioGroup>
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
