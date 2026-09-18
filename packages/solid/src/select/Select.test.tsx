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

import { Select } from './index'

import type { SelectRootChangeEventDetails } from './root/SelectRoot'
import type { JSX } from 'solid-js'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

describe('Select', () => {
  it('opens the popup from the trigger and closes on item select', () => {
    render(() => <BasicSelect />)

    expect(screen.queryByTestId('popup')).toBeNull()

    fireEvent.mouseDown(screen.getByRole('combobox'))
    expect(screen.getByTestId('popup')).toBeVisible()
    expect(screen.getByRole('listbox')).toBeVisible()

    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('sets aria-expanded and aria-controls on the trigger', () => {
    render(() => <BasicSelect />)

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.mouseDown(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute(
      'aria-controls',
      screen.getByRole('listbox').id
    )
  })

  it('marks the selected item with aria-selected', () => {
    render(() => <BasicSelect defaultValue="banana" />)

    fireEvent.mouseDown(screen.getByRole('combobox'))
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'false'
    )
  })

  it('displays the selected value label via Select.Value', () => {
    // Without an `items` map, Select.Value falls back to the serialized
    // value (matches upstream `resolveSelectedLabel` fallback behavior).
    render(() => <BasicSelect defaultValue="banana" />)
    expect(screen.getByTestId('value').textContent).toBe('banana')
  })

  it('shows a placeholder when no value is selected', () => {
    render(() => <BasicSelect />)
    expect(screen.getByTestId('value').textContent).toBe('Select a fruit')
  })

  it('closes on Escape', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicSelect defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('escape-key')
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('closes on outside press', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicSelect defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.pointerDown(document.body, { button: 0 })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('outside-press')
  })

  it('supports controlled value', () => {
    const [value, valueAssign] = createSignal<string | null>(null)
    const onValueChange = vi.fn((next: string | null) => {
      valueAssign(next)
    })

    render(() => <BasicSelect value={value()} onValueChange={onValueChange} />)

    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }))

    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls[0]?.[0]).toBe('cherry')
    expect(screen.getByTestId('value').textContent).toBe('cherry')
  })

  it('supports controlled open state', () => {
    const [open, openAssign] = createSignal(false)
    const onOpenChange = vi.fn(
      (next: boolean, _details: SelectRootChangeEventDetails) => {
        openAssign(next)
      }
    )

    render(() => <BasicSelect open={open()} onOpenChange={onOpenChange} />)

    fireEvent.mouseDown(screen.getByRole('combobox'))
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('trigger-press')
  })

  it('honors onValueChange cancel()', () => {
    const onValueChange = vi.fn(
      (_next: string | null, details: SelectRootChangeEventDetails) => {
        details.cancel()
      }
    )
    render(() => <BasicSelect onValueChange={onValueChange} />)

    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))

    expect(onValueChange).toHaveBeenCalled()
    expect(screen.getByTestId('value').textContent).toBe('Select a fruit')
  })

  it('honors onOpenChange cancel()', () => {
    const onOpenChange = vi.fn(
      (_next: boolean, details: SelectRootChangeEventDetails) => {
        details.cancel()
      }
    )
    render(() => <BasicSelect onOpenChange={onOpenChange} />)

    fireEvent.mouseDown(screen.getByRole('combobox'))
    expect(onOpenChange).toHaveBeenCalled()
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('does not open when disabled', () => {
    render(() => <BasicSelect disabled />)

    fireEvent.mouseDown(screen.getByRole('combobox'))
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('mounts into a portal host', () => {
    render(() => <BasicSelect defaultOpen />)
    const portal = document.querySelector('[data-base-ui-portal]')
    expect(portal).not.toBeNull()
    expect(portal?.contains(screen.getByTestId('popup'))).toBe(true)
  })

  it('renders an internal backdrop when modal (default)', () => {
    render(() => <BasicSelect defaultOpen />)
    expect(document.querySelector('[data-base-ui-inert]')).not.toBeNull()
  })

  it('applies scroll lock when modal (default)', () => {
    render(() => <BasicSelect defaultOpen />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('does not apply scroll lock when modal is false', () => {
    render(() => <BasicSelect defaultOpen modal={false} />)
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('wires Select.Label to the trigger via aria-labelledby', () => {
    render(() => <BasicSelect />)

    const label = screen.getByText('Fruit')
    const trigger = screen.getByRole('combobox')
    expect(trigger.getAttribute('aria-labelledby')).toBe(label.id)
  })

  it('renders groups with labels', () => {
    render(() => (
      <Select.Root defaultOpen>
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.List>
                <Select.Group>
                  <Select.GroupLabel>Fruits</Select.GroupLabel>
                  <Select.Item value="apple">Apple</Select.Item>
                  <Select.Item value="banana">Banana</Select.Item>
                </Select.Group>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ))

    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-labelledby',
      screen.getByText('Fruits').id
    )
  })

  it('supports multiple selection', () => {
    render(() => (
      <Select.Root multiple defaultOpen defaultValue={['apple']}>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.List>
                <Select.Item value="apple">Apple</Select.Item>
                <Select.Item value="banana">Banana</Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ))

    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'true'
    )

    fireEvent.click(screen.getByRole('option', { name: 'Banana' }))
    expect(screen.getByTestId('popup')).toBeVisible()
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByTestId('value').textContent).toBe('apple, banana')
  })

  it('supports actionsRef.unmount', async () => {
    const actions = { unmount: () => {} }

    render(() => <BasicSelect defaultOpen actionsRef={actions} />)

    expect(screen.getByTestId('popup')).toBeVisible()

    actions.unmount()
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull()
    })
  })

  it('renders ItemIndicator only when selected', () => {
    render(() => (
      <Select.Root defaultOpen defaultValue="banana">
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.List>
                <Select.Item value="apple">
                  Apple
                  <Select.ItemIndicator data-testid="apple-indicator" />
                </Select.Item>
                <Select.Item value="banana">
                  Banana
                  <Select.ItemIndicator data-testid="banana-indicator" />
                </Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ))

    expect(screen.queryByTestId('apple-indicator')).toBeNull()
    expect(screen.getByTestId('banana-indicator')).toBeInTheDocument()
  })

  it('does not select disabled items', () => {
    const onValueChange = vi.fn()
    render(() => (
      <Select.Root onValueChange={onValueChange} defaultOpen>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.List>
                <Select.Item value="apple" disabled>
                  Apple
                </Select.Item>
                <Select.Item value="banana">Banana</Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ))

    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('renders a hidden input with the serialized value for form submission', () => {
    render(() => <BasicSelect defaultValue="banana" name="fruit" />)
    const input = document.querySelector<HTMLInputElement>(
      'input[name="fruit"]'
    )
    expect(input).not.toBeNull()
    expect(input?.value).toBe('banana')
  })

  it('opens from keyboard activation (click without pointer type)', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicSelect onOpenChange={onOpenChange} />)

    const trigger = screen.getByRole('combobox')
    // Keyboard Enter/Space synthesizes `click` with `detail === 0`.
    fireEvent.click(trigger, { detail: 0 })
    expect(screen.getByTestId('popup')).toBeVisible()
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' })
    )
  })

  it('does not change value when readOnly even if forced open', () => {
    const onValueChange = vi.fn()
    render(() => (
      <Select.Root
        readOnly
        defaultOpen
        defaultValue="apple"
        onValueChange={onValueChange}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.List>
                <Select.Item value="apple">Apple</Select.Item>
                <Select.Item value="banana">Banana</Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ))

    fireEvent.click(screen.getByRole('option', { name: 'Banana' }))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('emits per-value hidden inputs when multiple and name are set', () => {
    render(() => (
      <Select.Root
        multiple
        name="fruit"
        defaultValue={['apple', 'banana']}
        defaultOpen
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                <Select.Item value="apple">Apple</Select.Item>
                <Select.Item value="banana">Banana</Select.Item>
                <Select.Item value="cherry">Cherry</Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ))

    const named = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[name="fruit"]')
    )
    expect(named).toHaveLength(2)
    expect(named.map(input => input.type)).toEqual(['hidden', 'hidden'])
    expect(named.map(input => input.value).sort()).toEqual(['apple', 'banana'])

    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }))
    const after = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[name="fruit"]')
    )
    expect(after.map(input => input.value).sort()).toEqual([
      'apple',
      'banana',
      'cherry',
    ])
  })

  it('applies Field validity attrs to the combobox trigger', async () => {
    render(() => (
      <Field.Root
        validationMode="onChange"
        validate={value => (value === 'apple' ? 'bad fruit' : null)}
      >
        <Select.Root defaultOpen>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  <Select.Item value="apple">Apple</Select.Item>
                  <Select.Item value="banana">Banana</Select.Item>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <Field.Error data-testid="error" />
      </Field.Root>
    ))

    const trigger = screen.getByTestId('trigger')
    expect(trigger).not.toHaveAttribute('aria-invalid')

    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-invalid', 'true')
    })
    expect(trigger).toHaveAttribute('data-invalid')
  })
})

function BasicSelect(props: {
  value?: string | null
  defaultValue?: string
  onValueChange?: (
    value: string | null,
    details: SelectRootChangeEventDetails
  ) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: SelectRootChangeEventDetails) => void
  modal?: boolean
  disabled?: boolean
  readOnly?: boolean
  name?: string
  actionsRef?: { unmount: () => void }
  children?: JSX.Element
}): JSX.Element {
  return (
    <Select.Root
      value={props.value}
      defaultValue={props.defaultValue}
      onValueChange={
        props.onValueChange as
          | ((value: unknown, details: SelectRootChangeEventDetails) => void)
          | undefined
      }
      open={props.open}
      defaultOpen={props.defaultOpen}
      onOpenChange={props.onOpenChange}
      modal={props.modal}
      disabled={props.disabled}
      readOnly={props.readOnly}
      name={props.name}
      actionsRef={props.actionsRef}
    >
      <Select.Label>Fruit</Select.Label>
      <Select.Trigger data-testid="trigger">
        <Select.Value data-testid="value" placeholder="Select a fruit" />
        <Select.Icon data-testid="icon" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Backdrop />
        <Select.Positioner>
          <Select.Popup data-testid="popup">
            <Select.List>
              <Select.Item value="apple">Apple</Select.Item>
              <Select.Item value="banana">Banana</Select.Item>
              <Select.Item value="cherry">Cherry</Select.Item>
              {props.children}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
