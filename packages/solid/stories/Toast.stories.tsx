import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { For, createMemo } from 'solid-js'

import { Toast, useToastManager } from '../src/toast'

const meta = {
  title: 'Components/Toast',
  component: Toast.Provider,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Toast.Provider>

export default meta
type Story = StoryObj<typeof meta>

const viewportStyle = {
  position: 'fixed',
  bottom: '1rem',
  right: '1rem',
  width: '20rem',
  'z-index': 50,
  outline: 'none',
} as const

const rootStyle = {
  'background-color': '#0f172a',
  color: '#f8fafc',
  padding: '0.75rem 1rem',
  'border-radius': '0.5rem',
  'margin-bottom': '0.5rem',
  'box-shadow': '0 4px 16px rgb(15 23 42 / 0.25)',
} as const

function ToastList() {
  const { toasts } = useToastManager()
  const ids = createMemo(() => toasts().map(toast => toast.id))
  return (
    <For each={ids()}>
      {id => {
        const toast = createMemo(() => toasts().find(item => item.id === id)!)
        return (
          <Toast.Root toast={toast()} style={rootStyle}>
            <Toast.Content>
              <Toast.Title style={{ 'font-weight': '600', margin: 0 }}>
                {toast().title}
              </Toast.Title>
              <Toast.Description
                style={{ margin: '0.25rem 0 0', opacity: 0.85 }}
              >
                {toast().description}
              </Toast.Description>
              <Toast.Close
                style={{
                  margin: '0.5rem 0 0',
                  'background-color': 'transparent',
                  color: 'inherit',
                  border: '1px solid #64748b',
                  'border-radius': '0.25rem',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </Toast.Close>
            </Toast.Content>
          </Toast.Root>
        )
      }}
    </For>
  )
}

function Demo() {
  const { add, close } = useToastManager()
  return (
    <div style={{ display: 'flex', gap: '0.5rem', 'flex-wrap': 'wrap' }}>
      <button
        type="button"
        onClick={() =>
          add({
            title: 'Saved',
            description: 'Your changes were written.',
          })
        }
      >
        Add toast
      </button>
      <button
        type="button"
        onClick={() =>
          add({
            title: 'Urgent',
            description: 'High priority alert',
            priority: 'high',
            timeout: 0,
          })
        }
      >
        High priority
      </button>
      <button type="button" onClick={() => close()}>
        Close all
      </button>
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <Toast.Provider>
      <Demo />
      <Toast.Portal>
        <Toast.Viewport style={viewportStyle}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  ),
}
