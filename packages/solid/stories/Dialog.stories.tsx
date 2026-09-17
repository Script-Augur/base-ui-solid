import { createSignal } from 'solid-js'

import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Dialog } from '../src/dialog'

const popupStyle = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  padding: '1.25rem',
  'background-color': 'Canvas',
  border: '1px solid currentColor',
  'min-width': '16rem',
  display: 'grid',
  gap: '0.75rem',
} as const

const backdropStyle = {
  position: 'fixed',
  inset: '0',
  'background-color': 'rgba(0,0,0,0.35)',
} as const

const meta = {
  title: 'Components/Dialog',
  component: Dialog.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Dialog.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdropStyle} />
        <Dialog.Popup style={popupStyle}>
          <Dialog.Title>Dialog title</Dialog.Title>
          <Dialog.Description>
            Modal dialog with backdrop, focus trap, and scroll lock.
          </Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
}

export const NonModal: Story = {
  render: () => (
    <Dialog.Root modal={false}>
      <Dialog.Trigger>Open non-modal</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Popup style={popupStyle}>
          <Dialog.Title>Non-modal</Dialog.Title>
          <Dialog.Description>
            Page remains interactive; focus guards + aria-owns are active.
          </Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [open, openAssign] = createSignal(false)
    return (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <Dialog.Root open={open()} onOpenChange={next => openAssign(next)}>
          <Dialog.Trigger>Toggle controlled</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop style={backdropStyle} />
            <Dialog.Popup style={popupStyle}>
              <Dialog.Title>Controlled</Dialog.Title>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        <p style={{ margin: 0 }}>open: {String(open())}</p>
      </div>
    )
  },
}

export const Nested: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger>Open parent</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdropStyle} />
        <Dialog.Popup style={popupStyle}>
          <Dialog.Title>Parent</Dialog.Title>
          <Dialog.Root>
            <Dialog.Trigger>Open nested</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup
                style={{
                  ...popupStyle,
                  top: '55%',
                  left: '55%',
                }}
              >
                <Dialog.Title>Nested</Dialog.Title>
                <Dialog.Close>Close nested</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Close>Close parent</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
}
