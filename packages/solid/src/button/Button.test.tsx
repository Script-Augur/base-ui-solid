import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button } from './Button'

afterEach(() => {
  cleanup()
})

describe('Button', () => {
  describe('prop: nativeButton', () => {
    it('custom link element: Space activates the link without scrolling the page', () => {
      const handleClick = vi.fn()

      render(() => (
        <Button
          nativeButton={false}
          render={(props: Record<string, unknown>) => (
            <a {...props} href="#target" onClick={handleClick}>
              Go
            </a>
          )}
        >
          Go
        </Button>
      ))

      const link = screen.getByRole('button', { name: 'Go' })
      expect(link.tagName).toBe('A')

      link.focus()
      expect(link).toHaveFocus()

      // `fireEvent` returns false when `preventDefault()` was called (no page scroll).
      expect(fireEvent.keyDown(link, { key: ' ' })).toBe(false)
      fireEvent.keyUp(link, { key: ' ' })

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('custom element: applies button semantics and dispatches clicks from keyboard', () => {
      const handleClick = vi.fn()

      render(() => (
        <Button
          nativeButton={false}
          render={(props: Record<string, unknown>) => (
            <span {...props}>Save</span>
          )}
          onClick={handleClick}
        />
      ))

      const button = screen.getByRole('button', { name: 'Save' })

      expect(button.tagName).toBe('SPAN')
      expect(button).toHaveAttribute('role', 'button')
      expect(button).toHaveAttribute('tabindex', '0')

      button.focus()
      expect(button).toHaveFocus()

      fireEvent.keyDown(button, { key: 'Enter' })
      fireEvent.keyUp(button, { key: ' ' })

      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('custom element: keyboard activation clicks carry modifier key state', () => {
      const handleClick = vi.fn()

      render(() => (
        <Button
          nativeButton={false}
          render={(props: Record<string, unknown>) => (
            <span {...props}>Save</span>
          )}
          onClick={handleClick}
        />
      ))

      const button = screen.getByRole('button', { name: 'Save' })
      button.focus()

      fireEvent.keyDown(button, { key: 'Enter', shiftKey: true })

      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(handleClick.mock.calls[0]?.[0].shiftKey).toBe(true)
    })
  })

  describe('prop: disabled', () => {
    it('native button: uses the disabled attribute and is not focusable', () => {
      const handleClick = vi.fn()
      const handleMouseDown = vi.fn()
      const handlePointerDown = vi.fn()
      const handleKeyDown = vi.fn()

      render(() => (
        <>
          <button type="button" data-testid="before">
            Before
          </button>
          <Button
            disabled
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
          >
            Save
          </Button>
        </>
      ))

      const button = screen.getByRole('button', { name: 'Save' })

      expect(button).toHaveAttribute('disabled')
      expect(button).toHaveAttribute('data-disabled')
      expect(button).not.toHaveAttribute('aria-disabled')

      // Tab order skips native disabled buttons (jsdom `.focus()` still focuses them).
      screen.getByTestId('before').focus()
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
      expect(button).not.toHaveFocus()

      fireEvent.click(button)
      fireEvent.keyDown(button, { key: ' ' })
      fireEvent.keyDown(button, { key: 'Enter' })

      expect(handleClick).not.toHaveBeenCalled()
      expect(handleMouseDown).not.toHaveBeenCalled()
      expect(handlePointerDown).not.toHaveBeenCalled()
      expect(handleKeyDown).not.toHaveBeenCalled()
    })

    it('custom element: applies aria-disabled and is not focusable', () => {
      const handleClick = vi.fn()
      const handleMouseDown = vi.fn()
      const handlePointerDown = vi.fn()
      const handleKeyDown = vi.fn()

      render(() => (
        <Button
          disabled
          nativeButton={false}
          render={(props: Record<string, unknown>) => <span {...props} />}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        />
      ))

      const button = screen.getByRole('button')

      expect(button).not.toHaveAttribute('disabled')
      expect(button).toHaveAttribute('data-disabled')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      // tabindex=-1 removes the control from sequential focus navigation
      // (programmatic `.focus()` is still allowed by the platform).
      expect(button).toHaveAttribute('tabindex', '-1')

      fireEvent.click(button)
      fireEvent.keyDown(button, { key: ' ' })
      fireEvent.keyDown(button, { key: 'Enter' })

      expect(handleClick).not.toHaveBeenCalled()
      expect(handleMouseDown).not.toHaveBeenCalled()
      expect(handlePointerDown).not.toHaveBeenCalled()
      expect(handleKeyDown).not.toHaveBeenCalled()
    })
  })

  describe('prop: focusableWhenDisabled', () => {
    it('native button: prevents interactions but remains focusable', () => {
      const handleClick = vi.fn()
      const handleMouseDown = vi.fn()
      const handlePointerDown = vi.fn()
      const handleKeyDown = vi.fn()

      render(() => (
        <Button
          disabled
          focusableWhenDisabled
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        >
          Save
        </Button>
      ))

      const button = screen.getByRole('button')

      expect(button).not.toHaveAttribute('disabled')
      expect(button).toHaveAttribute('data-disabled')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toHaveAttribute('tabindex', '0')

      button.focus()
      expect(button).toHaveFocus()

      fireEvent.click(button)
      fireEvent.keyDown(button, { key: ' ' })
      fireEvent.keyDown(button, { key: 'Enter' })

      expect(handleClick).not.toHaveBeenCalled()
      expect(handleMouseDown).not.toHaveBeenCalled()
      expect(handlePointerDown).not.toHaveBeenCalled()
      expect(handleKeyDown).not.toHaveBeenCalled()
    })

    it('keeps focus and suppresses interactions after becoming disabled', () => {
      const handleClick = vi.fn()

      function TestButton() {
        const [disabled, disabledAssign] = createSignal(false)

        return (
          <Button
            disabled={disabled()}
            focusableWhenDisabled
            onClick={event => {
              handleClick(event)
              disabledAssign(true)
            }}
          >
            Save
          </Button>
        )
      }

      render(() => <TestButton />)

      const button = screen.getByRole('button', { name: 'Save' })

      button.focus()
      expect(button).toHaveFocus()

      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(button).toHaveFocus()
      expect(button).toHaveAttribute('aria-disabled', 'true')

      fireEvent.click(button)
      fireEvent.keyDown(button, { key: 'Enter' })
      fireEvent.keyDown(button, { key: ' ' })

      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(button).toHaveFocus()
    })

    it('custom element: prevents interactions but remains focusable', () => {
      const handleClick = vi.fn()
      const handleMouseDown = vi.fn()
      const handlePointerDown = vi.fn()
      const handleKeyDown = vi.fn()

      render(() => (
        <Button
          disabled
          focusableWhenDisabled
          nativeButton={false}
          render={(props: Record<string, unknown>) => <span {...props} />}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        />
      ))

      const button = screen.getByRole('button')

      expect(button).not.toHaveAttribute('disabled')
      expect(button).toHaveAttribute('data-disabled')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toHaveAttribute('tabindex', '0')

      button.focus()
      expect(button).toHaveFocus()

      fireEvent.click(button)
      fireEvent.keyDown(button, { key: ' ' })
      fireEvent.keyDown(button, { key: 'Enter' })

      expect(handleClick).not.toHaveBeenCalled()
      expect(handleMouseDown).not.toHaveBeenCalled()
      expect(handlePointerDown).not.toHaveBeenCalled()
      expect(handleKeyDown).not.toHaveBeenCalled()
    })
  })

  it('renders a native button with type=button by default', () => {
    render(() => <Button>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('type', 'button')
  })
})
