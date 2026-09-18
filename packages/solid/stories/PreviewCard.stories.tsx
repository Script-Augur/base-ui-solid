import { createSignal } from 'solid-js'

import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { PreviewCard } from '../src/preview-card'

const popupStyle = {
  padding: '0.75rem 1rem',
  'background-color': 'Canvas',
  border: '1px solid currentColor',
  'min-width': '14rem',
  'max-width': '18rem',
  display: 'grid',
  gap: '0.5rem',
} as const

const meta = {
  title: 'Components/Preview Card',
  component: PreviewCard.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof PreviewCard.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PreviewCard.Root>
      <p style={{ 'max-width': '28rem', 'line-height': '1.5' }}>
        The principles of good{' '}
        <PreviewCard.Trigger
          href="https://en.wikipedia.org/wiki/Typography"
          style={{ 'text-decoration': 'underline' }}
        >
          typography
        </PreviewCard.Trigger>{' '}
        remain in the digital age.
      </p>
      <PreviewCard.Portal>
        <PreviewCard.Positioner sideOffset={8}>
          <PreviewCard.Popup style={popupStyle}>
            <PreviewCard.Arrow />
            <strong>Typography</strong>
            <span>
              The art and technique of arranging type to make written language
              legible and appealing.
            </span>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [open, openAssign] = createSignal(false)
    return (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <PreviewCard.Root open={open()} onOpenChange={next => openAssign(next)}>
          <PreviewCard.Trigger
            href="https://en.wikipedia.org/wiki/Typography"
            delay={100}
            closeDelay={50}
          >
            Hover or focus (controlled)
          </PreviewCard.Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner sideOffset={8}>
              <PreviewCard.Popup style={popupStyle}>
                Controlled preview
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>
        <button type="button" onClick={() => openAssign(v => !v)}>
          External toggle ({open() ? 'open' : 'closed'})
        </button>
      </div>
    )
  },
}

export const DefaultOpen: Story = {
  render: () => (
    <PreviewCard.Root defaultOpen>
      <PreviewCard.Trigger href="#preview">Open by default</PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner sideOffset={8}>
          <PreviewCard.Popup style={popupStyle}>
            Initially open preview card
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  ),
}
