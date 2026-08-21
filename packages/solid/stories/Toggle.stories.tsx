import { createSignal } from 'solid-js'

import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Toggle } from '../src/toggle'

const meta = {
  title: 'Components/Toggle',
  component: Toggle,
  parameters: { layout: 'centered' },
  argTypes: {
    disabled: { control: 'boolean' },
    defaultPressed: { control: 'boolean' },
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Bold',
    defaultPressed: false,
    disabled: false,
  },
}

export const Pressed: Story = {
  args: {
    children: 'Bold',
    defaultPressed: true,
  },
}

export const Disabled: Story = {
  args: {
    children: 'Bold',
    disabled: true,
    defaultPressed: true,
  },
}

export const Controlled: Story = {
  render: () => {
    const [pressed, setPressed] = createSignal(false)
    return (
      <div
        style={{ display: 'flex', 'flex-direction': 'column', gap: '0.75rem' }}
      >
        <Toggle pressed={pressed()} onPressedChange={setPressed}>
          Bold
        </Toggle>
        <p>pressed: {String(pressed())}</p>
      </div>
    )
  },
}
