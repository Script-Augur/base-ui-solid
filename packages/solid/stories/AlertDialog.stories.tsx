import { createSignal } from 'solid-js'

import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { AlertDialog } from '../src/alert-dialog'

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
  title: 'Components/AlertDialog',
  component: AlertDialog.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof AlertDialog.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <AlertDialog.Root>
      <AlertDialog.Trigger>Delete item</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop style={backdropStyle} />
        <AlertDialog.Popup style={popupStyle}>
          <AlertDialog.Title>Delete this item?</AlertDialog.Title>
          <AlertDialog.Description>
            This action cannot be undone. Outside clicks do not dismiss.
          </AlertDialog.Description>
          <div
            style={{ display: 'flex', gap: '0.5rem', 'justify-content': 'end' }}
          >
            <AlertDialog.Close>Cancel</AlertDialog.Close>
            <AlertDialog.Close>Delete</AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [open, openAssign] = createSignal(false)
    return (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <AlertDialog.Root open={open()} onOpenChange={next => openAssign(next)}>
          <AlertDialog.Trigger>Confirm controlled</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Backdrop style={backdropStyle} />
            <AlertDialog.Popup style={popupStyle}>
              <AlertDialog.Title>Controlled alert</AlertDialog.Title>
              <AlertDialog.Close>Close</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
        <p style={{ margin: 0 }}>open: {String(open())}</p>
      </div>
    )
  },
}
