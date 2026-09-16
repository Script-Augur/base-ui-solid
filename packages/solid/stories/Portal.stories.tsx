import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Portal } from '../src/portal'

const meta = {
  title: 'Components/Portal',
  component: Portal,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Portal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '16rem',
        height: '6rem',
        border: '1px solid currentColor',
        padding: '0.75rem',
      }}
    >
      <p style={{ margin: 0 }}>Clipped parent</p>
      <Portal>
        <div
          style={{
            position: 'fixed',
            right: '1.5rem',
            bottom: '1.5rem',
            padding: '0.75rem 1rem',
            border: '1px solid currentColor',
            'background-color': 'Canvas',
          }}
        >
          Portaled outside the clipped box
        </div>
      </Portal>
    </div>
  ),
}

export const CustomContainer: Story = {
  render: () => {
    let container!: HTMLDivElement
    return (
      <div style={{ display: 'grid', gap: '0.75rem', width: '18rem' }}>
        <div
          ref={el => {
            container = el
          }}
          style={{
            minHeight: '4rem',
            border: '1px dashed currentColor',
            padding: '0.5rem',
          }}
        >
          Custom container
        </div>
        <Portal container={() => container}>
          <strong>Rendered into the dashed box</strong>
        </Portal>
      </div>
    )
  },
}
