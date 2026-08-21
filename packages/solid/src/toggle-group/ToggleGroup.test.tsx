import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Toggle } from '../toggle/Toggle'
import { ToggleDataAttributes } from '../toggle/ToggleDataAttributes'

import { ToggleGroup } from './ToggleGroup'
import { ToggleGroupDataAttributes } from './ToggleGroupDataAttributes'

afterEach(() => {
  cleanup()
})

describe('ToggleGroup', () => {
  it('renders a group', () => {
    render(() => <ToggleGroup aria-label="My Toggle Group" />)
    expect(
      screen.queryByRole('group', { name: 'My Toggle Group' })
    ).not.toBeNull()
  })

  describe('uncontrolled', () => {
    it('pressed state', () => {
      render(() => (
        <ToggleGroup>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ))

      const [button1, button2] = screen.getAllByRole('button')

      expect(button1).toHaveAttribute('aria-pressed', 'false')
      expect(button2).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(button1!)
      expect(button1).toHaveAttribute('aria-pressed', 'true')
      expect(button1).toHaveAttribute(ToggleDataAttributes.pressed)
      expect(button2).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(button2!)
      expect(button2).toHaveAttribute('aria-pressed', 'true')
      expect(button2).toHaveAttribute(ToggleDataAttributes.pressed)
      expect(button1).toHaveAttribute('aria-pressed', 'false')
    })

    it('prop: defaultValue', () => {
      render(() => (
        <ToggleGroup defaultValue={['two']}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ))

      const [button1, button2] = screen.getAllByRole('button')

      expect(button2).toHaveAttribute('aria-pressed', 'true')
      expect(button2).toHaveAttribute(ToggleDataAttributes.pressed)
      expect(button1).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(button1!)
      expect(button1).toHaveAttribute('aria-pressed', 'true')
      expect(button1).toHaveAttribute(ToggleDataAttributes.pressed)
      expect(button2).toHaveAttribute('aria-pressed', 'false')
    })

    it('when Toggles omit value', () => {
      render(() => (
        <ToggleGroup>
          <Toggle />
          <Toggle value="" />
        </ToggleGroup>
      ))

      const [button1, button2] = screen.getAllByRole('button')

      expect(button1).toHaveAttribute('aria-pressed', 'false')
      expect(button2).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(button1!)
      expect(button1).toHaveAttribute('aria-pressed', 'true')
      expect(button2).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(button2!)
      expect(button1).toHaveAttribute('aria-pressed', 'false')
      expect(button2).toHaveAttribute('aria-pressed', 'true')
    })

    it('should warn if Toggle value is not set and ToggleGroup value is defined', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(() => (
        <ToggleGroup value={['one']}>
          <Toggle />
          <Toggle value="two" />
        </ToggleGroup>
      ))

      expect(spy).toHaveBeenCalledExactlyOnceWith(
        'Base UI: A `Toggle` component rendered in a `ToggleGroup` has no explicit `value` prop. This will cause issues between the Toggle Group and Toggle values. Provide the `Toggle` with a `value` prop matching the `ToggleGroup` values prop type.'
      )

      spy.mockRestore()
    })
  })

  describe('controlled', () => {
    it('pressed state', () => {
      function App() {
        const [value, valueAssign] = createSignal<Array<string>>(['two'])
        return (
          <div>
            <button type="button" onClick={() => valueAssign(['one'])}>
              set one
            </button>
            <button type="button" onClick={() => valueAssign(['two'])}>
              set two
            </button>
            <ToggleGroup value={value()}>
              <Toggle value="one" />
              <Toggle value="two" />
            </ToggleGroup>
          </div>
        )
      }

      render(() => <App />)

      const buttons = screen.getAllByRole('button')
      const button1 = buttons[2]!
      const button2 = buttons[3]!

      expect(button1).toHaveAttribute('aria-pressed', 'false')
      expect(button2).toHaveAttribute('aria-pressed', 'true')
      expect(button2).toHaveAttribute(ToggleDataAttributes.pressed)

      fireEvent.click(screen.getByText('set one'))
      expect(button1).toHaveAttribute('aria-pressed', 'true')
      expect(button1).toHaveAttribute(ToggleDataAttributes.pressed)
      expect(button2).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(screen.getByText('set two'))
      expect(button2).toHaveAttribute('aria-pressed', 'true')
      expect(button2).toHaveAttribute(ToggleDataAttributes.pressed)
      expect(button1).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('prop: disabled', () => {
    it('can disable the whole group', () => {
      render(() => (
        <ToggleGroup disabled>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ))

      const [button1, button2] = screen.getAllByRole('button')

      expect(button1).toBeDisabled()
      expect(button1).toHaveAttribute(ToggleDataAttributes.disabled)
      expect(button2).toBeDisabled()
      expect(button2).toHaveAttribute(ToggleDataAttributes.disabled)
    })

    it('can disable individual items', () => {
      render(() => (
        <ToggleGroup>
          <Toggle value="one" />
          <Toggle value="two" disabled />
        </ToggleGroup>
      ))

      const [button1, button2] = screen.getAllByRole('button')

      expect(button1).not.toBeDisabled()
      expect(button1).not.toHaveAttribute(ToggleDataAttributes.disabled)
      expect(button2).toBeDisabled()
      expect(button2).toHaveAttribute(ToggleDataAttributes.disabled)
    })
  })

  describe('prop: orientation', () => {
    it('vertical', () => {
      render(() => (
        <ToggleGroup orientation="vertical">
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ))

      const group = screen.getByRole('group')
      expect(group).toHaveAttribute(
        ToggleGroupDataAttributes.orientation,
        'vertical'
      )
    })

    it('does not render aria-orientation on role="group"', () => {
      render(() => (
        <ToggleGroup orientation="horizontal">
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ))

      const group = screen.getByRole('group')
      expect(group).not.toHaveAttribute('aria-orientation')
    })
  })

  describe('prop: multiple', () => {
    it('sets data-multiple only when true', () => {
      function App() {
        const [multiple, multipleAssign] = createSignal(false)
        return (
          <div>
            <button type="button" onClick={() => multipleAssign(true)}>
              enable multiple
            </button>
            <button type="button" onClick={() => multipleAssign(false)}>
              disable multiple
            </button>
            <ToggleGroup multiple={multiple()}>
              <Toggle value="one" />
            </ToggleGroup>
          </div>
        )
      }

      render(() => <App />)
      const group = screen.getByRole('group')
      expect(group).not.toHaveAttribute(ToggleGroupDataAttributes.multiple)

      fireEvent.click(screen.getByText('enable multiple'))
      expect(group).toHaveAttribute(ToggleGroupDataAttributes.multiple)

      fireEvent.click(screen.getByText('disable multiple'))
      expect(group).not.toHaveAttribute(ToggleGroupDataAttributes.multiple)
    })

    it('multiple items can be pressed when true', () => {
      render(() => (
        <ToggleGroup multiple defaultValue={['one']}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ))

      const [button1, button2] = screen.getAllByRole('button')

      expect(button1).toHaveAttribute('aria-pressed', 'true')
      expect(button2).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(button2!)
      expect(button1).toHaveAttribute('aria-pressed', 'true')
      expect(button2).toHaveAttribute('aria-pressed', 'true')
    })

    it('only one item can be pressed when false', () => {
      render(() => (
        <ToggleGroup defaultValue={['one']}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ))

      const [button1, button2] = screen.getAllByRole('button')

      expect(button1).toHaveAttribute('aria-pressed', 'true')
      expect(button2).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(button2!)
      expect(button1).toHaveAttribute('aria-pressed', 'false')
      expect(button2).toHaveAttribute('aria-pressed', 'true')
    })

    it('when Toggles omit value', () => {
      render(() => (
        <ToggleGroup multiple>
          <Toggle value="" />
          <Toggle />
        </ToggleGroup>
      ))

      const [button1, button2] = screen.getAllByRole('button')

      expect(button1).toHaveAttribute('aria-pressed', 'false')
      expect(button2).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(button1!)
      expect(button1).toHaveAttribute('aria-pressed', 'true')
      expect(button2).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(button2!)
      expect(button1).toHaveAttribute('aria-pressed', 'true')
      expect(button2).toHaveAttribute('aria-pressed', 'true')

      fireEvent.click(button1!)
      expect(button1).toHaveAttribute('aria-pressed', 'false')
      expect(button2).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('prop: onValueChange', () => {
    it('fires when an item is clicked', () => {
      const onValueChange = vi.fn()

      render(() => (
        <ToggleGroup onValueChange={onValueChange}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>
      ))

      const [button1, button2] = screen.getAllByRole('button')

      expect(onValueChange).toHaveBeenCalledTimes(0)

      fireEvent.click(button1!)
      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect(onValueChange.mock.calls[0]?.[0]).toEqual(['one'])

      fireEvent.click(button2!)
      expect(onValueChange).toHaveBeenCalledTimes(2)
      expect(onValueChange.mock.calls[1]?.[0]).toEqual(['two'])
    })

    it('does not change the value when the event is canceled', () => {
      const onValueChange = vi.fn(
        (_value: Array<string>, eventDetails: { cancel: () => void }) => {
          eventDetails.cancel()
        }
      )

      render(() => (
        <ToggleGroup onValueChange={onValueChange}>
          <Toggle value="one" />
        </ToggleGroup>
      ))

      const [button1] = screen.getAllByRole('button')
      fireEvent.click(button1!)

      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect(button1).toHaveAttribute('aria-pressed', 'false')
    })
  })
})
