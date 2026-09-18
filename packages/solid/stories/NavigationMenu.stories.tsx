import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { NavigationMenu } from '../src/navigation-menu'

const listStyle = {
  display: 'flex',
  gap: '0.5rem',
  listStyle: 'none',
  margin: '0',
  padding: '0',
} as const

const triggerStyle = {
  padding: '0.5rem 0.75rem',
  border: '1px solid currentColor',
  'background-color': 'Canvas',
  cursor: 'pointer',
} as const

const popupStyle = {
  padding: '0.75rem 1rem',
  'background-color': 'Canvas',
  border: '1px solid currentColor',
  'min-width': '12rem',
} as const

const meta = {
  title: 'Components/NavigationMenu',
  component: NavigationMenu.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof NavigationMenu.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <NavigationMenu.Root>
      <NavigationMenu.List style={listStyle}>
        <NavigationMenu.Item value="overview">
          <NavigationMenu.Trigger style={triggerStyle}>
            Overview
            <NavigationMenu.Icon />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <p>Overview of the product.</p>
            <NavigationMenu.Link href="#docs" closeOnClick>
              Read the docs
            </NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="handbook">
          <NavigationMenu.Trigger style={triggerStyle}>
            Handbook
            <NavigationMenu.Icon />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <p>Guides and references.</p>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Portal>
        <NavigationMenu.Positioner sideOffset={8}>
          <NavigationMenu.Popup style={popupStyle}>
            <NavigationMenu.Arrow />
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  ),
}
