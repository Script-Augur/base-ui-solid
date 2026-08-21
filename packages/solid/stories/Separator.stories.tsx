import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Separator } from '../src/separator'

const meta = {
  title: 'Components/Separator',
  component: Separator,
  parameters: { layout: 'centered' },
  argTypes: {
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: args => (
    <div style={{ width: '12rem' }}>
      <p>Above</p>
      <Separator
        {...args}
        style={{
          height: '1px',
          'background-color': 'currentColor',
          margin: '0.75rem 0',
        }}
      />
      <p>Below</p>
    </div>
  ),
}

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  render: args => (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        height: '3rem',
        gap: '0.75rem',
      }}
    >
      <span>Left</span>
      <Separator
        {...args}
        style={{
          width: '1px',
          'align-self': 'stretch',
          'background-color': 'currentColor',
        }}
      />
      <span>Right</span>
    </div>
  ),
}
