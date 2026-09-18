import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Field } from '../field'

import { Combobox, useFilteredItems } from './index'

import type { ComboboxRootChangeEventDetails } from './root/ComboboxRoot'
import type { JSX } from 'solid-js'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

describe('Combobox', () => {
  it('renders Input as role=combobox and opens on click by default', () => {
    render(() => <BasicCombobox />)

    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('role', 'combobox')
    expect(input).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('popup')).toBeVisible()
    expect(input).toHaveAttribute(
      'aria-controls',
      screen.getByRole('listbox').id
    )
  })

  it('opens from Trigger with trigger-press reason', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicCombobox onOpenChange={onOpenChange} />)

    fireEvent.mouseDown(screen.getByTestId('trigger'))
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('trigger-press')
    expect(screen.getByTestId('popup')).toBeVisible()
  })

  it('selects an item, fills input, and closes (single)', () => {
    const onValueChange = vi.fn()
    render(() => <BasicCombobox onValueChange={onValueChange} />)

    fireEvent.click(screen.getByTestId('input'))
    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))

    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls[0]?.[0]).toBe('apple')
    expect(screen.queryByTestId('popup')).toBeNull()
    // Without `items` / `itemToStringLabel`, Lite fills from stringifyAsLabel → value string.
    expect(screen.getByTestId('input')).toHaveValue('apple')
  })

  it('marks the selected item with aria-selected', () => {
    render(() => <BasicCombobox defaultValue="banana" defaultOpen />)

    expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'false'
    )
  })

  it('supports controlled value with cancel()', () => {
    const [value, valueAssign] = createSignal<string | null>(null)
    const onValueChange = vi.fn(
      (next: string | null, details: ComboboxRootChangeEventDetails) => {
        details.cancel()
        valueAssign(next)
      }
    )

    render(() => (
      <BasicCombobox value={value()} onValueChange={onValueChange} />
    ))

    fireEvent.click(screen.getByTestId('input'))
    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }))

    expect(onValueChange).toHaveBeenCalled()
    // cancel prevents setValue — input stays empty
    expect(screen.getByTestId('input')).toHaveValue('')
  })

  it('supports controlled open with cancel()', () => {
    const [open, openAssign] = createSignal(false)
    const onOpenChange = vi.fn(
      (_next: boolean, details: ComboboxRootChangeEventDetails) => {
        details.cancel()
      }
    )

    render(() => <BasicCombobox open={open()} onOpenChange={onOpenChange} />)

    fireEvent.mouseDown(screen.getByTestId('trigger'))
    expect(onOpenChange).toHaveBeenCalled()
    expect(screen.queryByTestId('popup')).toBeNull()
    expect(open()).toBe(false)
    void openAssign
  })

  it('supports controlled inputValue and filters items', async () => {
    const [inputValue, inputValueAssign] = createSignal('')
    const onInputValueChange = vi.fn((next: string) => {
      inputValueAssign(next)
    })

    render(() => (
      <BasicCombobox
        defaultOpen
        inputValue={inputValue()}
        onInputValueChange={onInputValueChange}
      />
    ))

    const input = screen.getByTestId('input')
    fireEvent.input(input, { target: { value: 'ban' } })

    expect(onInputValueChange).toHaveBeenCalled()
    expect(onInputValueChange.mock.calls[0]?.[0]).toBe('ban')
    expect(onInputValueChange.mock.calls[0]?.[1]?.reason).toBe('input-change')

    await waitFor(() => {
      expect(screen.queryByRole('option', { name: 'Apple' })).toBeNull()
      expect(screen.getByRole('option', { name: 'Banana' })).toBeVisible()
    })
  })

  it('closes on Escape with escape-key reason', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicCombobox defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('escape-key')
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('closes on outside press with outside-press reason', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicCombobox defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.pointerDown(document.body, { button: 0 })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('outside-press')
  })

  it('does not open when disabled', () => {
    render(() => <BasicCombobox disabled />)

    fireEvent.click(screen.getByTestId('input'))
    fireEvent.mouseDown(screen.getByTestId('trigger'))
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('does not select when readOnly', () => {
    const onValueChange = vi.fn()
    render(() => (
      <BasicCombobox defaultOpen readOnly onValueChange={onValueChange} />
    ))

    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('mounts into a portal host', () => {
    render(() => <BasicCombobox defaultOpen />)
    const portal = document.querySelector('[data-base-ui-portal]')
    expect(portal).not.toBeNull()
    expect(portal?.contains(screen.getByTestId('popup'))).toBe(true)
  })

  it('defaults modal=false (no scroll lock / no internal backdrop)', () => {
    render(() => <BasicCombobox defaultOpen />)
    expect(document.body.style.overflow).not.toBe('hidden')
    expect(document.querySelector('[data-base-ui-inert]')).toBeNull()
  })

  it('applies scroll lock and internal backdrop when modal={true}', () => {
    render(() => <BasicCombobox defaultOpen modal />)
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.querySelector('[data-base-ui-inert]')).not.toBeNull()
  })

  it('wires Combobox.Label to the Input via aria-labelledby', () => {
    render(() => <BasicCombobox />)

    const label = screen.getByText('Fruit')
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('aria-labelledby', label.id)
  })

  it('clears value and input via Clear with clear-press', () => {
    const onValueChange = vi.fn()
    const onInputValueChange = vi.fn()
    render(() => (
      <BasicCombobox
        defaultValue="apple"
        defaultInputValue="Apple"
        onValueChange={onValueChange}
        onInputValueChange={onInputValueChange}
      />
    ))

    fireEvent.click(screen.getByTestId('clear'))
    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls[0]?.[0]).toBeNull()
    expect(onValueChange.mock.calls[0]?.[1]?.reason).toBe('clear-press')
    expect(onInputValueChange.mock.calls[0]?.[0]).toBe('')
  })

  it('shows Empty when filter yields zero items (items prop)', async () => {
    render(() => (
      <Combobox.Root
        defaultOpen
        items={[
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
        ]}
        defaultInputValue="zzz"
      >
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup">
              <Combobox.Empty data-testid="empty">No results</Combobox.Empty>
              <Combobox.List>
                <Combobox.Collection>
                  {(item: { value: string; label: string }) => (
                    <Combobox.Item value={item.value}>
                      {item.label}
                    </Combobox.Item>
                  )}
                </Combobox.Collection>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ))

    await waitFor(() => {
      expect(screen.getByTestId('empty').textContent).toBe('No results')
    })
  })

  it('serializes the value into a hidden form input', () => {
    render(() => <BasicCombobox name="fruit" defaultValue="cherry" />)

    const hidden = document.querySelector<HTMLInputElement>(
      'input[name="fruit"][aria-hidden]'
    )
    expect(hidden).not.toBeNull()
    expect(hidden?.value).toBe('cherry')
  })

  it('forwards Field validity attrs to Input', () => {
    render(() => (
      <Field.Root invalid>
        <BasicCombobox />
      </Field.Root>
    ))

    expect(screen.getByTestId('input')).toHaveAttribute('aria-invalid', 'true')
  })

  it('exposes actionsRef.unmount', async () => {
    const actionsRef: { unmount?: () => void } = {}
    render(() => <BasicCombobox defaultOpen actionsRef={actionsRef} />)

    expect(screen.getByTestId('popup')).toBeVisible()
    actionsRef.unmount?.()
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull()
    })
  })

  it('renders ItemIndicator only when selected', () => {
    render(() => (
      <Combobox.Root defaultValue="apple" defaultOpen>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="apple">
                  Apple
                  <Combobox.ItemIndicator data-testid="indicator" />
                </Combobox.Item>
                <Combobox.Item value="banana">
                  Banana
                  <Combobox.ItemIndicator data-testid="indicator-banana" />
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ))

    expect(screen.getByTestId('indicator')).toBeVisible()
    expect(screen.queryByTestId('indicator-banana')).toBeNull()
  })

  it('does not fire onValueChange for disabled items', () => {
    const onValueChange = vi.fn()
    render(() => (
      <Combobox.Root defaultOpen onValueChange={onValueChange}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="apple" disabled>
                  Apple
                </Combobox.Item>
                <Combobox.Item value="banana">Banana</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ))

    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('moves highlight with ArrowDown/Up on focused Input (Lite)', async () => {
    render(() => <BasicCombobox defaultOpen />)

    const input = screen.getByTestId('input')
    input.focus()

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
        'data-highlighted'
      )
    })
    expect(input.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Apple' }).id
    )

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
        'data-highlighted'
      )
    })
    expect(screen.getByRole('option', { name: 'Apple' })).not.toHaveAttribute(
      'data-highlighted'
    )
    expect(input.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Banana' }).id
    )

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
        'data-highlighted'
      )
    })
  })

  it('sets aria-activedescendant to the highlighted option while open', async () => {
    render(() => <BasicCombobox defaultOpen />)

    const input = screen.getByTestId('input')
    expect(input.getAttribute('aria-activedescendant')).toBeNull()

    input.focus()
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    await waitFor(() => {
      const apple = screen.getByRole('option', { name: 'Apple' })
      expect(input.getAttribute('aria-activedescendant')).toBe(apple.id)
    })
  })

  it('Enter after filtering selects the visible match, not a hidden earlier option', async () => {
    const onValueChange = vi.fn()
    render(() => <BasicCombobox defaultOpen onValueChange={onValueChange} />)

    const input = screen.getByTestId('input')
    input.focus()
    fireEvent.input(input, { target: { value: 'ban' } })

    await waitFor(() => {
      expect(screen.queryByRole('option', { name: 'Apple' })).toBeNull()
      expect(screen.getByRole('option', { name: 'Banana' })).toBeVisible()
    })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
        'data-highlighted'
      )
    })

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls[0]?.[0]).toBe('banana')
  })

  it('autoHighlight reseeds to the first visible match while filtering', async () => {
    const onItemHighlighted = vi.fn()
    render(() => (
      <Combobox.Root
        defaultOpen
        autoHighlight
        onItemHighlighted={onItemHighlighted}
      >
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="apple">Apple</Combobox.Item>
                <Combobox.Item value="banana">Banana</Combobox.Item>
                <Combobox.Item value="cherry">Cherry</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ))

    const input = screen.getByTestId('input')
    fireEvent.input(input, { target: { value: 'ch' } })

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Cherry' })).toHaveAttribute(
        'data-highlighted'
      )
    })
    expect(onItemHighlighted).toHaveBeenCalled()
  })

  it('renders per-value hidden inputs for multiple + name', () => {
    render(() => (
      <Combobox.Root multiple name="fruits" defaultValue={['apple', 'banana']}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="apple">Apple</Combobox.Item>
                <Combobox.Item value="banana">Banana</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ))

    const hiddens = document.querySelectorAll(
      'input[type="hidden"][name="fruits"]'
    )
    expect(hiddens).toHaveLength(2)
    expect(
      Array.from(hiddens).map(el => (el as HTMLInputElement).value)
    ).toEqual(['apple', 'banana'])
  })

  it('opens from Trigger keyboard click (detail === 0)', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicCombobox onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByTestId('trigger'), { detail: 0 })
    expect(screen.getByTestId('popup')).toBeVisible()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('trigger-press')
  })

  it('useFilteredItems returns a reactive accessor', async () => {
    let readFiltered!: () => ReadonlyArray<unknown>
    function Probe() {
      readFiltered = useFilteredItems()
      return null
    }

    const [inputValue, inputValueAssign] = createSignal('')
    render(() => (
      <Combobox.Root
        defaultOpen
        inputValue={inputValue()}
        onInputValueChange={value => inputValueAssign(value)}
        items={['apple', 'banana', 'cherry']}
      >
        <Probe />
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Collection>
                  {(item: unknown) => (
                    <Combobox.Item value={item}>{String(item)}</Combobox.Item>
                  )}
                </Combobox.Collection>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ))

    expect(readFiltered()).toHaveLength(3)
    fireEvent.input(screen.getByTestId('input'), { target: { value: 'ban' } })
    await waitFor(() => {
      expect(readFiltered()).toEqual(['banana'])
    })
  })
})

function BasicCombobox(props: {
  children?: JSX.Element
  defaultValue?: string | null
  defaultOpen?: boolean
  defaultInputValue?: string
  value?: string | null
  open?: boolean
  inputValue?: string
  name?: string
  disabled?: boolean
  readOnly?: boolean
  modal?: boolean
  onValueChange?: (
    value: string | null,
    details: ComboboxRootChangeEventDetails
  ) => void
  onOpenChange?: (
    open: boolean,
    details: ComboboxRootChangeEventDetails
  ) => void
  onInputValueChange?: (
    inputValue: string,
    details: ComboboxRootChangeEventDetails
  ) => void
  actionsRef?: { unmount?: () => void }
}): JSX.Element {
  return (
    <Combobox.Root
      defaultValue={props.defaultValue}
      defaultOpen={props.defaultOpen}
      defaultInputValue={props.defaultInputValue}
      value={props.value}
      open={props.open}
      inputValue={props.inputValue}
      name={props.name}
      disabled={props.disabled}
      readOnly={props.readOnly}
      modal={props.modal}
      onValueChange={props.onValueChange as never}
      onOpenChange={props.onOpenChange}
      onInputValueChange={props.onInputValueChange}
      actionsRef={props.actionsRef as never}
    >
      <Combobox.Label>Fruit</Combobox.Label>
      <Combobox.Input data-testid="input" />
      <Combobox.Trigger data-testid="trigger" />
      <Combobox.Clear data-testid="clear" />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup data-testid="popup">
            <Combobox.Empty>No results</Combobox.Empty>
            <Combobox.List>
              <Combobox.Item value="apple">Apple</Combobox.Item>
              <Combobox.Item value="banana">Banana</Combobox.Item>
              <Combobox.Item value="cherry">Cherry</Combobox.Item>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
      {props.children}
    </Combobox.Root>
  )
}
