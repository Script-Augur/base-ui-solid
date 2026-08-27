import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'

import { Avatar } from '../src/avatar'

const meta = {
  title: 'Components/Avatar',
  component: Avatar.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Avatar.Root>

export default meta
type Story = StoryObj<typeof meta>

const rootStyle = {
  display: 'inline-flex',
  'align-items': 'center',
  'justify-content': 'center',
  width: '3rem',
  height: '3rem',
  'border-radius': '9999px',
  overflow: 'hidden',
  'background-color': '#e5e7eb',
  'font-size': '0.875rem',
  'font-weight': '600',
  color: '#374151',
}

const imageStyle = {
  width: '100%',
  height: '100%',
  'object-fit': 'cover' as const,
}

export const WithImage: Story = {
  render: () => (
    <Avatar.Root style={rootStyle}>
      <Avatar.Image
        style={imageStyle}
        src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?&w=128&h=128&dpr=2&q=80"
        alt="Jane Doe"
      />
      <Avatar.Fallback>JD</Avatar.Fallback>
    </Avatar.Root>
  ),
}

export const FallbackOnly: Story = {
  render: () => (
    <Avatar.Root style={rootStyle}>
      <Avatar.Fallback>AC</Avatar.Fallback>
    </Avatar.Root>
  ),
}

export const BrokenImage: Story = {
  render: () => (
    <Avatar.Root style={rootStyle}>
      <Avatar.Image style={imageStyle} src="/this-will-404.png" alt="" />
      <Avatar.Fallback>NA</Avatar.Fallback>
    </Avatar.Root>
  ),
}

export const DelayedFallback: Story = {
  render: () => (
    <Avatar.Root style={rootStyle}>
      <Avatar.Image style={imageStyle} src="/this-will-404.png" alt="" />
      <Avatar.Fallback delay={600}>…</Avatar.Fallback>
    </Avatar.Root>
  ),
}

/** Browser QA for enter/exit `data-starting-style` / `data-ending-style`. */
export const TransitionQA: Story = {
  name: 'Image transition (manual QA)',
  render: () => {
    const [src, srcAssign] = createSignal<string | undefined>(undefined)

    return (
      <div
        style={{ display: 'grid', gap: '0.75rem', 'justify-items': 'center' }}
      >
        <style>{`
          .avatar-transition-image {
            transition: opacity 300ms ease;
          }
          .avatar-transition-image[data-starting-style],
          .avatar-transition-image[data-ending-style] {
            opacity: 0;
          }
        `}</style>
        <Avatar.Root style={rootStyle}>
          <Avatar.Image
            class="avatar-transition-image"
            style={imageStyle}
            src={src()}
            alt="Jane Doe"
          />
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar.Root>
        <button
          type="button"
          onClick={() =>
            srcAssign(current =>
              current
                ? undefined
                : 'https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?&w=128&h=128&dpr=2&q=80'
            )
          }
        >
          Toggle image
        </button>
      </div>
    )
  },
}
