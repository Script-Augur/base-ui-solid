import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Button } from '../src/button'

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    disabled: { control: 'boolean' },
    focusableWhenDisabled: { control: 'boolean' },
    nativeButton: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Save',
    disabled: false,
    focusableWhenDisabled: false,
  },
}

export const Disabled: Story = {
  args: {
    children: 'Save',
    disabled: true,
  },
}

export const FocusableWhenDisabled: Story = {
  args: {
    children: 'Save',
    disabled: true,
    focusableWhenDisabled: true,
  },
}

export const CustomElement: Story = {
  name: 'Custom element (nativeButton=false)',
  render: () => (
    <Button
      nativeButton={false}
      render={props => <span {...props}>Save</span>}
    />
  ),
}

export const AsLink: Story = {
  name: 'As link',
  render: () => (
    <Button
      nativeButton={false}
      render={props => (
        <a {...props} href="#target">
          Go
        </a>
      )}
    />
  ),
}
