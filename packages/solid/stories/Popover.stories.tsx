import { createSignal } from 'solid-js'

import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Popover } from '../src/popover'

const popupStyle = {
  padding: '0.75rem 1rem',
  'background-color': 'Canvas',
  border: '1px solid currentColor',
  'min-width': '12rem',
  display: 'grid',
  gap: '0.5rem',
} as const

const meta = {
  title: 'Components/Popover',
  component: Popover.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Popover.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger>Open popover</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup style={popupStyle}>
            <Popover.Title>Popover title</Popover.Title>
            <Popover.Description>
              Anchored overlay with positioner and close.
            </Popover.Description>
            <Popover.Close>Close</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
}

export const Modal: Story = {
  render: () => (
    <Popover.Root modal>
      <Popover.Trigger>Open modal</Popover.Trigger>
      <Popover.Portal>
        <Popover.Backdrop
          style={{
            position: 'fixed',
            inset: '0',
            'background-color': 'rgba(0,0,0,0.25)',
          }}
        />
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup style={popupStyle}>
            <Popover.Title>Modal popover</Popover.Title>
            <Popover.Description>
              Scroll lock + internal backdrop when modal.
            </Popover.Description>
            <Popover.Close>Close</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [open, openAssign] = createSignal(false)
    return (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <Popover.Root open={open()} onOpenChange={next => openAssign(next)}>
          <Popover.Trigger>Toggle controlled</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup style={popupStyle}>
                <Popover.Title>Controlled</Popover.Title>
                <Popover.Close>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        <button type="button" onClick={() => openAssign(v => !v)}>
          External toggle ({open() ? 'open' : 'closed'})
        </button>
      </div>
    )
  },
}

export const OpenOnHover: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger openOnHover delay={200}>
        Hover me
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup style={popupStyle}>
            <Popover.Title>Hover popover</Popover.Title>
            <Popover.Description>
              Opens after a short delay.
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
}
