import { createSignal } from 'solid-js'

import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Collapsible } from '../src/collapsible'

const meta = {
  title: 'Components/Collapsible',
  component: Collapsible.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Collapsible.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Collapsible.Root defaultOpen={false}>
      <Collapsible.Trigger>Toggle</Collapsible.Trigger>
      <Collapsible.Panel
        style={{ padding: '0.75rem', border: '1px solid #ccc' }}
      >
        Panel content that can be shown or hidden.
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
}

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible.Root defaultOpen>
      <Collapsible.Trigger>Toggle</Collapsible.Trigger>
      <Collapsible.Panel
        style={{ padding: '0.75rem', border: '1px solid #ccc' }}
      >
        Starts open.
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
}

export const KeepMounted: Story = {
  render: () => (
    <Collapsible.Root>
      <Collapsible.Trigger>Toggle (keepMounted)</Collapsible.Trigger>
      <Collapsible.Panel
        keepMounted
        style={{ padding: '0.75rem', border: '1px solid #ccc' }}
      >
        Remains in the DOM while closed.
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [open, openAssign] = createSignal(false)
    return (
      <div
        style={{ display: 'flex', 'flex-direction': 'column', gap: '0.75rem' }}
      >
        <Collapsible.Root open={open()} onOpenChange={openAssign}>
          <Collapsible.Trigger>Toggle</Collapsible.Trigger>
          <Collapsible.Panel
            style={{ padding: '0.75rem', border: '1px solid #ccc' }}
          >
            Controlled panel.
          </Collapsible.Panel>
        </Collapsible.Root>
        <p>open: {String(open())}</p>
      </div>
    )
  },
}
