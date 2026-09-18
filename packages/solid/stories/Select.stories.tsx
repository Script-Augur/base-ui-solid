import { createSignal } from 'solid-js'

import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Select } from '../src/select'

const popupStyle = {
  padding: '0.25rem',
  'background-color': 'Canvas',
  border: '1px solid currentColor',
  'min-width': '10rem',
  display: 'grid',
  gap: '0.125rem',
} as const

const itemStyle = {
  padding: '0.375rem 0.75rem',
  'border-radius': '0.25rem',
  cursor: 'default',
} as const

const groupLabelStyle = {
  padding: '0.375rem 0.75rem',
  'font-weight': 600,
  opacity: 0.7,
} as const

const fruitLabels: Record<string, string> = {
  apple: 'Apple',
  banana: 'Banana',
  cherry: 'Cherry',
}

const meta = {
  title: 'Components/Select',
  component: Select.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Select.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Select.Root items={fruitLabels}>
      <Select.Trigger>
        <Select.Value placeholder="Choose a fruit" />
        <Select.Icon>▾</Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={8}>
          <Select.Popup style={popupStyle}>
            <Select.List>
              <Select.Item value="apple" style={itemStyle}>
                <Select.ItemText>Apple</Select.ItemText>
              </Select.Item>
              <Select.Item value="banana" style={itemStyle}>
                <Select.ItemText>Banana</Select.ItemText>
              </Select.Item>
              <Select.Item value="cherry" style={itemStyle}>
                <Select.ItemText>Cherry</Select.ItemText>
              </Select.Item>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, valueAssign] = createSignal<string | null>('banana')
    return (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <Select.Root
          items={fruitLabels}
          value={value()}
          onValueChange={next => valueAssign(next as string | null)}
        >
          <Select.Trigger>
            <Select.Value placeholder="Choose a fruit" />
            <Select.Icon>▾</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner sideOffset={8}>
              <Select.Popup style={popupStyle}>
                <Select.List>
                  <Select.Item value="apple" style={itemStyle}>
                    <Select.ItemText>Apple</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="banana" style={itemStyle}>
                    <Select.ItemText>Banana</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="cherry" style={itemStyle}>
                    <Select.ItemText>Cherry</Select.ItemText>
                  </Select.Item>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <button
          type="button"
          onClick={() =>
            valueAssign(prev => (prev === 'apple' ? 'cherry' : 'apple'))
          }
        >
          External set ({value() ?? 'none'})
        </button>
      </div>
    )
  },
}

export const Groups: Story = {
  render: () => (
    <Select.Root defaultValue="carrot">
      <Select.Trigger>
        <Select.Value placeholder="Choose a food" />
        <Select.Icon>▾</Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={8}>
          <Select.Popup style={popupStyle}>
            <Select.List>
              <Select.Group>
                <Select.GroupLabel style={groupLabelStyle}>
                  Fruits
                </Select.GroupLabel>
                <Select.Item value="apple" style={itemStyle}>
                  <Select.ItemText>Apple</Select.ItemText>
                </Select.Item>
                <Select.Item value="banana" style={itemStyle}>
                  <Select.ItemText>Banana</Select.ItemText>
                </Select.Item>
              </Select.Group>
              <Select.Separator />
              <Select.Group>
                <Select.GroupLabel style={groupLabelStyle}>
                  Vegetables
                </Select.GroupLabel>
                <Select.Item value="carrot" style={itemStyle}>
                  <Select.ItemText>Carrot</Select.ItemText>
                </Select.Item>
                <Select.Item value="potato" style={itemStyle}>
                  <Select.ItemText>Potato</Select.ItemText>
                </Select.Item>
              </Select.Group>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  ),
}
