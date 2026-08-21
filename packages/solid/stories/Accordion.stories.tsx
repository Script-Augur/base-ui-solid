import { createSignal } from 'solid-js'

import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Accordion } from '../src/accordion'

const meta = {
  title: 'Components/Accordion',
  component: Accordion.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Accordion.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Accordion.Root style={{ width: '20rem' }}>
      <Accordion.Item value="a">
        <Accordion.Header>
          <Accordion.Trigger>Section A</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel
          style={{ padding: '0.75rem', border: '1px solid #ccc' }}
        >
          Content for section A.
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Header>
          <Accordion.Trigger>Section B</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel
          style={{ padding: '0.75rem', border: '1px solid #ccc' }}
        >
          Content for section B.
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  ),
}

export const Multiple: Story = {
  render: () => (
    <Accordion.Root multiple defaultValue={['a']} style={{ width: '20rem' }}>
      <Accordion.Item value="a">
        <Accordion.Header>
          <Accordion.Trigger>Section A</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel
          style={{ padding: '0.75rem', border: '1px solid #ccc' }}
        >
          Starts open; other sections can open too.
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Header>
          <Accordion.Trigger>Section B</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel
          style={{ padding: '0.75rem', border: '1px solid #ccc' }}
        >
          Content for section B.
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, valueAssign] = createSignal<Array<string | number>>([])
    return (
      <div
        style={{ display: 'flex', 'flex-direction': 'column', gap: '0.75rem' }}
      >
        <Accordion.Root
          value={value()}
          onValueChange={valueAssign}
          style={{ width: '20rem' }}
        >
          <Accordion.Item value="a">
            <Accordion.Header>
              <Accordion.Trigger>Section A</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel
              style={{ padding: '0.75rem', border: '1px solid #ccc' }}
            >
              Controlled panel.
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="b">
            <Accordion.Header>
              <Accordion.Trigger>Section B</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel
              style={{ padding: '0.75rem', border: '1px solid #ccc' }}
            >
              Another controlled panel.
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
        <p>value: {JSON.stringify(value())}</p>
      </div>
    )
  },
}
