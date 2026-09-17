import { createSignal } from 'solid-js'

import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Checkbox } from '../src/checkbox'
import { CheckboxGroup } from '../src/checkbox-group'
import { Field } from '../src/field'

const meta = {
  title: 'Components/CheckboxGroup',
  component: CheckboxGroup,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CheckboxGroup>

export default meta
type Story = StoryObj<typeof meta>

const rootStyle = {
  display: 'flex',
  'flex-direction': 'column',
  gap: '0.5rem',
  'font-family': 'system-ui, sans-serif',
  'font-size': '0.875rem',
}

const rowStyle = {
  display: 'flex',
  'align-items': 'center',
  gap: '0.5rem',
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
    <CheckboxGroup defaultValue={['email']} style={rootStyle}>
      <div id="notifications-label" style={{ 'font-weight': '600' }}>
        Notifications
      </div>
      <label style={rowStyle}>
        <Checkbox.Root style={boxStyle} value="email">
          <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
        </Checkbox.Root>
        Email
      </label>
      <label style={rowStyle}>
        <Checkbox.Root style={boxStyle} value="sms">
          <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
        </Checkbox.Root>
        SMS
      </label>
      <label style={rowStyle}>
        <Checkbox.Root style={boxStyle} value="push">
          <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
        </Checkbox.Root>
        Push
      </label>
    </CheckboxGroup>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, valueAssign] = createSignal(['fuji-apple'])
    return (
      <CheckboxGroup
        value={value()}
        onValueChange={next => valueAssign(next)}
        style={rootStyle}
      >
        <div style={{ 'font-weight': '600' }}>
          Apples ({value().join(', ') || 'none'})
        </div>
        <label style={rowStyle}>
          <Checkbox.Root style={boxStyle} value="fuji-apple">
            <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
          </Checkbox.Root>
          Fuji
        </label>
        <label style={rowStyle}>
          <Checkbox.Root style={boxStyle} value="gala-apple">
            <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
          </Checkbox.Root>
          Gala
        </label>
        <label style={rowStyle}>
          <Checkbox.Root style={boxStyle} value="granny-smith">
            <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
          </Checkbox.Root>
          Granny Smith
        </label>
      </CheckboxGroup>
    )
  },
}

export const ParentCheckbox: Story = {
  render: () => {
    const [value, valueAssign] = createSignal<string[]>([])
    const allValues = ['a', 'b', 'c']
    return (
      <CheckboxGroup
        value={value()}
        onValueChange={next => valueAssign(next)}
        allValues={allValues}
        style={rootStyle}
      >
        <label style={rowStyle}>
          <Checkbox.Root style={boxStyle} parent>
            <Checkbox.Indicator style={indicatorStyle}>
              {value().length === allValues.length ? '✓' : '−'}
            </Checkbox.Indicator>
          </Checkbox.Root>
          Select all
        </label>
        <label style={{ ...rowStyle, 'margin-left': '1.25rem' }}>
          <Checkbox.Root style={boxStyle} value="a">
            <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
          </Checkbox.Root>
          Option A
        </label>
        <label style={{ ...rowStyle, 'margin-left': '1.25rem' }}>
          <Checkbox.Root style={boxStyle} value="b">
            <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
          </Checkbox.Root>
          Option B
        </label>
        <label style={{ ...rowStyle, 'margin-left': '1.25rem' }}>
          <Checkbox.Root style={boxStyle} value="c">
            <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
          </Checkbox.Root>
          Option C
        </label>
      </CheckboxGroup>
    )
  },
}

export const WithField: Story = {
  render: () => (
    <Field.Root name="protocols" style={rootStyle}>
      <Field.Label style={{ 'font-weight': '600' }}>
        Allowed network protocols
      </Field.Label>
      <CheckboxGroup defaultValue={['https']}>
        <Field.Item>
          <label style={rowStyle}>
            <Checkbox.Root style={boxStyle} value="http">
              <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
            </Checkbox.Root>
            HTTP
          </label>
        </Field.Item>
        <Field.Item>
          <label style={rowStyle}>
            <Checkbox.Root style={boxStyle} value="https">
              <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
            </Checkbox.Root>
            HTTPS
          </label>
        </Field.Item>
        <Field.Item>
          <label style={rowStyle}>
            <Checkbox.Root style={boxStyle} value="ssh">
              <Checkbox.Indicator style={indicatorStyle}>✓</Checkbox.Indicator>
            </Checkbox.Root>
            SSH
          </label>
        </Field.Item>
      </CheckboxGroup>
      <Field.Description style={{ 'font-size': '0.75rem', color: '#6b7280' }}>
        Choose which protocols are allowed
      </Field.Description>
    </Field.Root>
  ),
}
