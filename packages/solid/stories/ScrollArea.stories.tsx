import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { DirectionProvider } from '../src/internals/direction'
import { ScrollArea } from '../src/scroll-area'

const meta = {
  title: 'Components/ScrollArea',
  component: ScrollArea.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ScrollArea.Root>

export default meta
type Story = StoryObj<typeof meta>

const rootStyle = {
  width: '240px',
  height: '180px',
  // Clip overflowing content; viewport is the scrollport.
  overflow: 'hidden',
  border: '1px solid #d1d5db',
  'border-radius': '8px',
  // Explicit surface + text so stories stay readable in dark Storybook canvases.
  'background-color': '#ffffff',
  color: '#111827',
}

const viewportStyle = {
  width: '100%',
  height: '100%',
  padding: '12px',
  'box-sizing': 'border-box' as const,
  // Match upstream demos: padding-end leaves room for the overlay scrollbar.
  'padding-right': '16px',
}

// Match upstream demos: flex track so the thumb stretches on the cross-axis
// (horizontal thumbs otherwise collapse to height: 0 as empty blocks).
const scrollbarYStyle = {
  display: 'flex',
  width: '8px',
  margin: '4px',
  'background-color': '#e5e7eb',
  'border-radius': '9999px',
}

const scrollbarXStyle = {
  display: 'flex',
  height: '8px',
  margin: '4px',
  'background-color': '#e5e7eb',
  'border-radius': '9999px',
}

// Cross-axis fill only — along-axis size comes from --scroll-area-thumb-* on
// the component. Putting width/height: 100% on both axes would override those vars.
const thumbYStyle = {
  width: '100%',
  'background-color': '#6b7280',
  'border-radius': '9999px',
}

const thumbXStyle = {
  height: '100%',
  'background-color': '#6b7280',
  'border-radius': '9999px',
}

const cornerStyle = {
  'background-color': '#e5e7eb',
}

function LongContent() {
  return (
    <div>
      {Array.from({ length: 24 }, (_, i) => (
        <p style={{ margin: '0 0 0.75rem' }}>
          Paragraph {i + 1}: Scroll Area vertical overflow content for Storybook
          QA.
        </p>
      ))}
    </div>
  )
}

function WideContent() {
  return (
    <div style={{ width: '720px', display: 'flex', gap: '1rem' }}>
      {Array.from({ length: 12 }, (_, i) => (
        <div
          style={{
            'flex-shrink': 0,
            width: '120px',
            height: '80px',
            'background-color': i % 2 === 0 ? '#f3f4f6' : '#e5e7eb',
            display: 'grid',
            'place-items': 'center',
          }}
        >
          Card {i + 1}
        </div>
      ))}
    </div>
  )
}

export const VerticalOverflow: Story = {
  render: () => (
    <ScrollArea.Root style={rootStyle}>
      <ScrollArea.Viewport style={viewportStyle}>
        <ScrollArea.Content>
          <LongContent />
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical" style={scrollbarYStyle}>
        <ScrollArea.Thumb style={thumbYStyle} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  ),
}

export const BothAxes: Story = {
  render: () => (
    <ScrollArea.Root style={rootStyle}>
      <ScrollArea.Viewport style={viewportStyle}>
        <ScrollArea.Content>
          <div style={{ width: '720px' }}>
            <LongContent />
          </div>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical" style={scrollbarYStyle}>
        <ScrollArea.Thumb style={thumbYStyle} />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar orientation="horizontal" style={scrollbarXStyle}>
        <ScrollArea.Thumb style={thumbXStyle} />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner style={cornerStyle} />
    </ScrollArea.Root>
  ),
}

export const KeepMountedScrollbar: Story = {
  name: 'KeepMounted scrollbar (no overflow)',
  render: () => (
    <ScrollArea.Root style={rootStyle}>
      <ScrollArea.Viewport style={viewportStyle}>
        <ScrollArea.Content>
          <p>Short content — scrollbar stays mounted via keepMounted.</p>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="vertical"
        keepMounted
        style={scrollbarYStyle}
      >
        <ScrollArea.Thumb style={thumbYStyle} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  ),
}

export const HorizontalOverflow: Story = {
  render: () => (
    <ScrollArea.Root style={{ ...rootStyle, height: '120px' }}>
      <ScrollArea.Viewport style={viewportStyle}>
        <ScrollArea.Content>
          <WideContent />
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="horizontal" style={scrollbarXStyle}>
        <ScrollArea.Thumb style={thumbXStyle} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  ),
}

export const Rtl: Story = {
  name: 'RTL (DirectionProvider)',
  render: () => (
    <DirectionProvider direction="rtl">
      <ScrollArea.Root style={{ ...rootStyle, direction: 'rtl' }}>
        <ScrollArea.Viewport style={viewportStyle}>
          <ScrollArea.Content>
            <div style={{ width: '720px' }}>
              <LongContent />
            </div>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" style={scrollbarYStyle}>
          <ScrollArea.Thumb style={thumbYStyle} />
        </ScrollArea.Scrollbar>
        <ScrollArea.Scrollbar orientation="horizontal" style={scrollbarXStyle}>
          <ScrollArea.Thumb style={thumbXStyle} />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner style={cornerStyle} />
      </ScrollArea.Root>
    </DirectionProvider>
  ),
}

/** Manual QA for overflow edge data attributes and CSS vars. */
export const OverflowEdgesQA: Story = {
  name: 'Overflow edges (manual QA)',
  render: () => (
    <ScrollArea.Root
      overflowEdgeThreshold={20}
      style={rootStyle}
      data-testid="root"
    >
      <ScrollArea.Viewport style={viewportStyle} data-testid="viewport">
        <ScrollArea.Content>
          <div style={{ width: '720px' }}>
            <LongContent />
          </div>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical" style={scrollbarYStyle}>
        <ScrollArea.Thumb style={thumbYStyle} />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar orientation="horizontal" style={scrollbarXStyle}>
        <ScrollArea.Thumb style={thumbXStyle} />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner style={cornerStyle} />
    </ScrollArea.Root>
  ),
}
