import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Toggle } from './Toggle'
import { ToggleDataAttributes } from './ToggleDataAttributes'

afterEach(() => {
  cleanup()
})

describe('Toggle', () => {
  describe('pressed state', () => {
    it('controlled', () => {
      function App() {
        const [pressed, setPressed] = createSignal(false)
        return (
          <div>
            <input
              type="checkbox"
              checked={pressed()}
              onChange={() => setPressed(!pressed())}
            />
            <Toggle pressed={pressed()} />
          </div>
        )
      }

      render(() => <App />)
      const checkbox = screen.getByRole('checkbox')
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-pressed', 'false')
      fireEvent.click(checkbox)
      expect(button).toHaveAttribute('aria-pressed', 'true')
      fireEvent.click(checkbox)
      expect(button).toHaveAttribute('aria-pressed', 'false')
    })

    it('uncontrolled', () => {
      render(() => <Toggle defaultPressed={false}>Bold</Toggle>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-pressed', 'false')
      expect(button).not.toHaveAttribute(ToggleDataAttributes.pressed)

      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-pressed', 'true')
      expect(button).toHaveAttribute(ToggleDataAttributes.pressed)

      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-pressed', 'false')
      expect(button).not.toHaveAttribute(ToggleDataAttributes.pressed)
    })
  })

  describe('prop: onPressedChange', () => {
    it('is called when the pressed state changes', () => {
      const handlePressed = vi.fn()
      render(() => (
        <Toggle defaultPressed={false} onPressedChange={handlePressed} />
      ))

      fireEvent.click(screen.getByRole('button'))

      expect(handlePressed).toHaveBeenCalledTimes(1)
      expect(handlePressed.mock.calls[0]?.[0]).toBe(true)
    })

    it('does not change the pressed state when the event is canceled', () => {
      render(() => (
        <Toggle
          defaultPressed={false}
          onPressedChange={(_pressed, eventDetails) => {
            eventDetails.cancel()
          }}
        />
      ))

      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('prop: disabled', () => {
    it('disables the component', () => {
      const handlePressed = vi.fn()
      render(() => <Toggle disabled onPressedChange={handlePressed} />)

      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('disabled')
      expect(button).toHaveAttribute(ToggleDataAttributes.disabled)
      expect(button).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(button)

      expect(handlePressed).not.toHaveBeenCalled()
      expect(button).toHaveAttribute('aria-pressed', 'false')
    })
  })
})
