import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Tabs } from '../src/tabs'

const meta = {
  title: 'Components/Tabs',
  component: Tabs.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tabs.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs.Root defaultValue={0} style={{ width: '24rem' }}>
      <Tabs.List
        style={{
          display: 'flex',
          gap: '0.25rem',
          'border-bottom': '1px solid #ccc',
        }}
      >
        <Tabs.Trigger value={0}>Tab one</Tabs.Trigger>
        <Tabs.Trigger value={1}>Tab two</Tabs.Trigger>
        <Tabs.Trigger value={2}>Tab three</Tabs.Trigger>
        <Tabs.Indicator
          style={{
            position: 'absolute',
            bottom: 0,
            height: '2px',
            background: '#333',
            transition: 'all 0.2s',
          }}
        />
      </Tabs.List>
      <Tabs.Panel value={0} style={{ padding: '0.75rem' }}>
        Panel one content.
      </Tabs.Panel>
      <Tabs.Panel value={1} style={{ padding: '0.75rem' }}>
        Panel two content.
      </Tabs.Panel>
      <Tabs.Panel value={2} style={{ padding: '0.75rem' }}>
        Panel three content.
      </Tabs.Panel>
    </Tabs.Root>
  ),
}

export const Vertical: Story = {
  render: () => (
    <Tabs.Root
      orientation="vertical"
      defaultValue="a"
      style={{ display: 'flex', gap: '1rem', width: '28rem' }}
    >
      <Tabs.List
        style={{
          display: 'flex',
          'flex-direction': 'column',
          gap: '0.25rem',
          'min-width': '6rem',
        }}
      >
        <Tabs.Trigger value="a">Alpha</Tabs.Trigger>
        <Tabs.Trigger value="b">Beta</Tabs.Trigger>
        <Tabs.Trigger value="c">Gamma</Tabs.Trigger>
      </Tabs.List>
      <div style={{ flex: 1 }}>
        <Tabs.Panel
          value="a"
          style={{ padding: '0.75rem', border: '1px solid #ccc' }}
        >
          Alpha panel.
        </Tabs.Panel>
        <Tabs.Panel
          value="b"
          style={{ padding: '0.75rem', border: '1px solid #ccc' }}
        >
          Beta panel.
        </Tabs.Panel>
        <Tabs.Panel
          value="c"
          style={{ padding: '0.75rem', border: '1px solid #ccc' }}
        >
          Gamma panel.
        </Tabs.Panel>
      </div>
    </Tabs.Root>
  ),
}

export const DisabledTab: Story = {
  render: () => (
    <Tabs.Root defaultValue={0} style={{ width: '24rem' }}>
      <Tabs.List style={{ display: 'flex', gap: '0.5rem' }}>
        <Tabs.Trigger value={0}>Enabled</Tabs.Trigger>
        <Tabs.Trigger value={1} disabled>
          Disabled
        </Tabs.Trigger>
        <Tabs.Trigger value={2}>Also enabled</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value={0} style={{ padding: '0.75rem' }}>
        First panel (disabled middle tab falls back here on mount).
      </Tabs.Panel>
      <Tabs.Panel value={1} style={{ padding: '0.75rem' }}>
        Unreachable while disabled.
      </Tabs.Panel>
      <Tabs.Panel value={2} style={{ padding: '0.75rem' }}>
        Third panel.
      </Tabs.Panel>
    </Tabs.Root>
  ),
}
