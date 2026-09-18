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

import { Autocomplete } from './index'

import type { AutocompleteRootChangeEventDetails } from './root/AutocompleteRoot'
import type { JSX } from 'solid-js'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

describe('Autocomplete', () => {
  it('renders Input as role=combobox and does not open on click by default', () => {
    render(() => <BasicAutocomplete />)

    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('role', 'combobox')
    expect(input).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('opens on input click when openOnInputClick is true', () => {
    render(() => <BasicAutocomplete openOnInputClick />)

    fireEvent.click(screen.getByTestId('input'))
    expect(screen.getByTestId('input')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('popup')).toBeVisible()
  })

  it('opens from Trigger with trigger-press reason', () => {
    const onOpenChange = vi.fn()
    render(() => <BasicAutocomplete onOpenChange={onOpenChange} />)

    fireEvent.mouseDown(screen.getByTestId('trigger'))
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe('trigger-press')
  })

  it('item press fills value (input string), closes, and does not set aria-selected', () => {
    const onValueChange = vi.fn()
    render(() => (
      <BasicAutocomplete openOnInputClick onValueChange={onValueChange} />
    ))

    fireEvent.click(screen.getByTestId('input'))
    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))

    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls[0]?.[0]).toBe('apple')
    expect(screen.queryByTestId('popup')).toBeNull()
    expect(screen.getByTestId('input')).toHaveValue('apple')

    fireEvent.mouseDown(screen.getByTestId('trigger'))
    expect(
      screen.getByRole('option', { name: 'Apple' }).getAttribute('aria-selected')
    ).toBeNull()
  })

  it('supports controlled value with cancel()', () => {
    const [value] = createSignal('')
    const onValueChange = vi.fn(
      (_next: string, details: AutocompleteRootChangeEventDetails) => {
        details.cancel()
      }
    )

    render(() => (
      <BasicAutocomplete
        openOnInputClick
        value={value()}
        onValueChange={onValueChange}
      />
    ))

    fireEvent.click(screen.getByTestId('input'))
    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }))

    expect(onValueChange).toHaveBeenCalled()
    // cancel prevents setInputValue — controlled value stays empty
    expect(screen.getByTestId('input')).toHaveValue('')
  })

  it('filters items in list mode (default)', async () => {
    const [value, valueAssign] = createSignal('')
    render(() => (
      <BasicAutocomplete
        openOnInputClick
        value={value()}
        onValueChange={next => valueAssign(next)}
      />
    ))

    fireEvent.click(screen.getByTestId('input'))
    fireEvent.input(screen.getByTestId('input'), {
      target: { value: 'ban' },
    })

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Banana' })).toBeVisible()
      expect(screen.queryByRole('option', { name: 'Apple' })).toBeNull()
    })
  })

  it('moves highlight with ArrowDown and sets aria-activedescendant', async () => {
    render(() => <BasicAutocomplete openOnInputClick defaultOpen />)

    const input = screen.getByTestId('input')
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    await waitFor(() => {
      const highlighted = document.querySelector('[data-highlighted]')
      expect(highlighted).not.toBeNull()
      expect(input.getAttribute('aria-activedescendant')).toBe(
        highlighted?.id
      )
    })

    const firstLabel = document.querySelector('[data-highlighted]')?.textContent
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    await waitFor(() => {
      const second = document.querySelector('[data-highlighted]')
      expect(second?.textContent).not.toBe(firstLabel)
      expect(input.getAttribute('aria-activedescendant')).toBe(second?.id)
    })
  })

  it('Enter after filter fills the visible match into value', async () => {
    const onValueChange = vi.fn()
    render(() => (
      <BasicAutocomplete openOnInputClick onValueChange={onValueChange} />
    ))

    const input = screen.getByTestId('input')
    fireEvent.click(input)
    fireEvent.input(input, { target: { value: 'ban' } })

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Banana' })).toBeVisible()
    })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onValueChange).toHaveBeenCalled()
    const last = onValueChange.mock.calls.at(-1)?.[0]
    expect(last).toBe('banana')
  })

  it('clears input via Clear with clear-press', () => {
    const onValueChange = vi.fn()
    render(() => (
      <BasicAutocomplete
        defaultValue="apple"
        onValueChange={onValueChange}
      />
    ))

    expect(screen.getByTestId('input')).toHaveValue('apple')
    fireEvent.click(screen.getByTestId('clear'))
    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls[0]?.[0]).toBe('')
    expect(onValueChange.mock.calls[0]?.[1]?.reason).toBe('clear-press')
    expect(screen.getByTestId('input')).toHaveValue('')
  })

  it('renders Autocomplete.Value from the input string', () => {
    render(() => (
      <Autocomplete.Root defaultValue="hello">
        <span data-testid="value">
          <Autocomplete.Value />
        </span>
        <Autocomplete.Input data-testid="input" />
      </Autocomplete.Root>
    ))

    expect(screen.getByTestId('value')).toHaveTextContent('hello')
  })

  it('serializes the input value via name on the visible Input', () => {
    render(() => (
      <BasicAutocomplete name="search" defaultValue="cherry" />
    ))

    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('name', 'search')
    expect(input).toHaveValue('cherry')

    const hiddenNamed = document.querySelector(
      'input[name="search"][aria-hidden]'
    )
    expect(hiddenNamed).toBeNull()
  })

  it('sets aria-invalid from Field on Input', () => {
    render(() => (
      <Field.Root invalid>
        <BasicAutocomplete />
      </Field.Root>
    ))

    expect(screen.getByTestId('input')).toHaveAttribute('aria-invalid', 'true')
  })

  it('supports actionsRef.unmount', () => {
    const actions: { unmount?: () => void } = {}
    render(() => (
      <BasicAutocomplete defaultOpen actionsRef={actions as never} />
    ))

    expect(screen.getByTestId('popup')).toBeVisible()
    actions.unmount?.()
    expect(screen.queryByTestId('popup')).toBeNull()
  })

  it('Escape dismisses with escape-key reason', () => {
    const onOpenChange = vi.fn()
    render(() => (
      <BasicAutocomplete defaultOpen onOpenChange={onOpenChange} />
    ))

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false)
    expect(onOpenChange.mock.calls.at(-1)?.[1]?.reason).toBe('escape-key')
  })
})

function BasicAutocomplete(props: {
  openOnInputClick?: boolean
  defaultOpen?: boolean
  defaultValue?: string
  value?: string
  name?: string
  onValueChange?: (
    value: string,
    eventDetails: AutocompleteRootChangeEventDetails
  ) => void
  onOpenChange?: (
    open: boolean,
    eventDetails: AutocompleteRootChangeEventDetails
  ) => void
  actionsRef?: { unmount: () => void }
}): JSX.Element {
  return (
    <Autocomplete.Root
      openOnInputClick={props.openOnInputClick}
      defaultOpen={props.defaultOpen}
      defaultValue={props.defaultValue}
      value={props.value}
      name={props.name}
      onValueChange={props.onValueChange}
      onOpenChange={props.onOpenChange}
      actionsRef={props.actionsRef}
    >
      <Autocomplete.Input data-testid="input" />
      <Autocomplete.Trigger data-testid="trigger">Open</Autocomplete.Trigger>
      <Autocomplete.Clear data-testid="clear" />
      <Autocomplete.Portal>
        <Autocomplete.Positioner>
          <Autocomplete.Popup data-testid="popup">
            <Autocomplete.List>
              <Autocomplete.Item value="apple">Apple</Autocomplete.Item>
              <Autocomplete.Item value="banana">Banana</Autocomplete.Item>
              <Autocomplete.Item value="cherry">Cherry</Autocomplete.Item>
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  )
}
