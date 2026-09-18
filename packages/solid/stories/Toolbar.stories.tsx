import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Toolbar } from '../src/toolbar'
import { Toggle } from '../src/toggle'
import { ToggleGroup } from '../src/toggle-group'

const meta = {
  title: 'Components/Toolbar',
  component: Toolbar.Root,
  parameters: { layout: 'centered' },
  argTypes: {
    disabled: { control: 'boolean' },
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
    },
    loopFocus: { control: 'boolean' },
  },
} satisfies Meta<typeof Toolbar.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    disabled: false,
    orientation: 'horizontal',
    loopFocus: true,
  },
  render: args => (
    <Toolbar.Root {...args}>
      <Toolbar.Button>Cut</Toolbar.Button>
      <Toolbar.Button>Copy</Toolbar.Button>
      <Toolbar.Separator />
      <Toolbar.Button>Paste</Toolbar.Button>
      <Toolbar.Link href="https://base-ui.com">Docs</Toolbar.Link>
    </Toolbar.Root>
  ),
}

export const WithGroup: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: args => (
    <Toolbar.Root {...args}>
      <Toolbar.Group>
        <Toolbar.Button>Bold</Toolbar.Button>
        <Toolbar.Button>Italic</Toolbar.Button>
      </Toolbar.Group>
      <Toolbar.Separator />
      <Toolbar.Input placeholder="Search" />
    </Toolbar.Root>
  ),
}

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  render: args => (
    <Toolbar.Root {...args}>
      <Toolbar.Button>One</Toolbar.Button>
      <Toolbar.Button>Two</Toolbar.Button>
      <Toolbar.Button>Three</Toolbar.Button>
    </Toolbar.Root>
  ),
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: args => (
    <Toolbar.Root {...args}>
      <Toolbar.Button>Cut</Toolbar.Button>
      <Toolbar.Button>Copy</Toolbar.Button>
      <Toolbar.Input defaultValue="query" />
    </Toolbar.Root>
  ),
}

export const WithToggleGroup: Story = {
  render: () => (
    <Toolbar.Root>
      <Toolbar.Group>
        <ToggleGroup defaultValue={['bold']}>
          <Toolbar.Button
            render={(props: Record<string, unknown>) => (
              <Toggle {...props} value="bold">
                Bold
              </Toggle>
            )}
          />
          <Toolbar.Button
            render={(props: Record<string, unknown>) => (
              <Toggle {...props} value="italic">
                Italic
              </Toggle>
            )}
          />
        </ToggleGroup>
      </Toolbar.Group>
      <Toolbar.Separator />
      <Toolbar.Button>Save</Toolbar.Button>
    </Toolbar.Root>
  ),
}
