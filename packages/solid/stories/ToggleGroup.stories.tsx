import { createSignal } from 'solid-js'

import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Toggle } from '../src/toggle'
import { ToggleGroup } from '../src/toggle-group'

const meta = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
  parameters: { layout: 'centered' },
  argTypes: {
    disabled: { control: 'boolean' },
    multiple: { control: 'boolean' },
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    disabled: false,
    multiple: false,
    orientation: 'horizontal',
  },
  render: args => (
    <ToggleGroup {...args}>
      <Toggle value="bold">Bold</Toggle>
      <Toggle value="italic">Italic</Toggle>
      <Toggle value="underline">Underline</Toggle>
    </ToggleGroup>
  ),
}

export const Multiple: Story = {
  args: {
    multiple: true,
    defaultValue: ['bold'],
  },
  render: args => (
    <ToggleGroup {...args}>
      <Toggle value="bold">Bold</Toggle>
      <Toggle value="italic">Italic</Toggle>
      <Toggle value="underline">Underline</Toggle>
    </ToggleGroup>
  ),
}

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    defaultValue: ['center'],
  },
  render: args => (
    <ToggleGroup {...args}>
      <Toggle value="left">Left</Toggle>
      <Toggle value="center">Center</Toggle>
      <Toggle value="right">Right</Toggle>
    </ToggleGroup>
  ),
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: ['bold'],
  },
  render: args => (
    <ToggleGroup {...args}>
      <Toggle value="bold">Bold</Toggle>
      <Toggle value="italic">Italic</Toggle>
    </ToggleGroup>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = createSignal<string[]>(['italic'])
    return (
      <div
        style={{ display: 'flex', 'flex-direction': 'column', gap: '0.75rem' }}
      >
        <ToggleGroup value={value()} onValueChange={next => setValue(next)}>
          <Toggle value="bold">Bold</Toggle>
          <Toggle value="italic">Italic</Toggle>
          <Toggle value="underline">Underline</Toggle>
        </ToggleGroup>
        <p>value: {JSON.stringify(value())}</p>
      </div>
    )
  },
}
