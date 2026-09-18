import { createSignal } from 'solid-js'

import type { Meta, StoryObj } from 'storybook-solidjs-vite'

import { Combobox } from '../src/combobox'

const popupStyle = {
  padding: '0.25rem',
  'background-color': 'Canvas',
  border: '1px solid currentColor',
  'min-width': '12rem',
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

const meta = {
  title: 'Components/Combobox',
  component: Combobox.Root,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Combobox.Root>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Combobox.Root>
      <Combobox.Label>Fruit</Combobox.Label>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <Combobox.Input placeholder="Search…" />
        <Combobox.Trigger>▾</Combobox.Trigger>
        <Combobox.Clear>Clear</Combobox.Clear>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={8}>
          <Combobox.Popup style={popupStyle}>
            <Combobox.Empty>No results</Combobox.Empty>
            <Combobox.List>
              <Combobox.Item value="apple" style={itemStyle}>
                Apple
              </Combobox.Item>
              <Combobox.Item value="banana" style={itemStyle}>
                Banana
              </Combobox.Item>
              <Combobox.Item value="cherry" style={itemStyle}>
                Cherry
              </Combobox.Item>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  ),
}

export const Filtered: Story = {
  render: () => {
    const [inputValue, inputValueAssign] = createSignal('')
    return (
      <Combobox.Root
        inputValue={inputValue()}
        onInputValueChange={next => inputValueAssign(next)}
      >
        <Combobox.Label>Filter fruit</Combobox.Label>
        <Combobox.Input placeholder="Type to filter…" />
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={8}>
            <Combobox.Popup style={popupStyle}>
              <Combobox.Empty>No matches</Combobox.Empty>
              <Combobox.List>
                <Combobox.Item value="apple" style={itemStyle}>
                  Apple
                </Combobox.Item>
                <Combobox.Item value="apricot" style={itemStyle}>
                  Apricot
                </Combobox.Item>
                <Combobox.Item value="banana" style={itemStyle}>
                  Banana
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    )
  },
}

export const Controlled: Story = {
  render: () => {
    const [value, valueAssign] = createSignal<string | null>(null)
    const [inputValue, inputValueAssign] = createSignal('')
    return (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <Combobox.Root
          value={value()}
          onValueChange={next => valueAssign(next as string | null)}
          inputValue={inputValue()}
          onInputValueChange={next => inputValueAssign(next)}
        >
          <Combobox.Label>Controlled</Combobox.Label>
          <Combobox.Input />
          <Combobox.Trigger>▾</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner sideOffset={8}>
              <Combobox.Popup style={popupStyle}>
                <Combobox.List>
                  <Combobox.Item value="apple" style={itemStyle}>
                    Apple
                  </Combobox.Item>
                  <Combobox.Item value="banana" style={itemStyle}>
                    Banana
                  </Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <div>
          value: {value() ?? 'none'} / input: {inputValue() || '∅'}
        </div>
      </div>
    )
  },
}

export const ClearAndEmpty: Story = {
  render: () => (
    <Combobox.Root defaultOpen defaultInputValue="zzz">
      <Combobox.Input />
      <Combobox.Clear>Clear</Combobox.Clear>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={8}>
          <Combobox.Popup style={popupStyle}>
            <Combobox.Empty>No results</Combobox.Empty>
            <Combobox.List>
              <Combobox.Item value="apple" style={itemStyle}>
                Apple
              </Combobox.Item>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  ),
}

export const Groups: Story = {
  render: () => (
    <Combobox.Root>
      <Combobox.Input placeholder="Food…" />
      <Combobox.Trigger>▾</Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={8}>
          <Combobox.Popup style={popupStyle}>
            <Combobox.List>
              <Combobox.Group>
                <Combobox.GroupLabel style={groupLabelStyle}>
                  Fruit
                </Combobox.GroupLabel>
                <Combobox.Item value="apple" style={itemStyle}>
                  Apple
                </Combobox.Item>
                <Combobox.Item value="banana" style={itemStyle}>
                  Banana
                </Combobox.Item>
              </Combobox.Group>
              <Combobox.Separator />
              <Combobox.Group>
                <Combobox.GroupLabel style={groupLabelStyle}>
                  Veg
                </Combobox.GroupLabel>
                <Combobox.Item value="carrot" style={itemStyle}>
                  Carrot
                </Combobox.Item>
              </Combobox.Group>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  ),
}
