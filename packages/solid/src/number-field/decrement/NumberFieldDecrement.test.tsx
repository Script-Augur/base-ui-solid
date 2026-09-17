import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NumberField } from '../index'
import {
  PRESS_HOLD_START_DELAY_MS,
  PRESS_HOLD_TICK_DELAY_MS,
  installRafClock,
} from '../test-utils'

afterEach(() => {
  cleanup()
})

describe('<NumberField.Decrement />', () => {
  it('exposes aria-label Decrease', () => {
    render(() => (
      <NumberField.Root defaultValue={0}>
        <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
      </NumberField.Root>
    ))
    expect(screen.getByTestId('decrement')).toHaveAttribute(
      'aria-label',
      'Decrease'
    )
  })

  it('decrements the value on click', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={2} onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
        <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('decrement'))
    expect(onValueChange.mock.calls.at(-1)![0]).toBe(1)
    expect(screen.getByTestId('input').value).toBe('1')
  })

  it('decrements to -1 starting from defaultValue=0', () => {
    render(() => (
      <NumberField.Root defaultValue={0}>
        <NumberField.Input data-testid="input" />
        <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('decrement'))
    expect(screen.getByTestId('input').value).toBe('-1')
  })

  it('is disabled at min', () => {
    render(() => (
      <NumberField.Root defaultValue={0} min={0}>
        <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
      </NumberField.Root>
    ))
    expect(screen.getByTestId('decrement')).toBeDisabled()
  })

  it('should not decrement when root is disabled', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={2} disabled onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
        <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('decrement'))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByTestId('input').value).toBe('2')
  })

  it('should not decrement when readOnly', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={2} readOnly onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
        <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('decrement'))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('only calls onValueChange once per decrement click', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={2} onValueChange={onValueChange}>
        <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('decrement'))
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it('first decrement after external controlled update', () => {
    const [value, valueAssign] = createSignal<number | null>(10)

    render(() => (
      <NumberField.Root
        value={value()}
        onValueChange={next => valueAssign(next)}
      >
        <NumberField.Input data-testid="input" />
        <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
        <button type="button" onClick={() => valueAssign(3)}>
          external
        </button>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByText('external'))
    expect(screen.getByTestId('input').value).toBe('3')
    fireEvent.click(screen.getByTestId('decrement'))
    expect(screen.getByTestId('input').value).toBe('2')
  })

  it('should decrement when input is dirty but not blurred (pointerdown)', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={0} onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
        <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
      </NumberField.Root>
    ))

    const input = screen.getByTestId('input')
    input.value = '5'
    fireEvent.input(input)
    expect(onValueChange.mock.lastCall?.[0]).toBe(5)

    fireEvent.pointerDown(screen.getByTestId('decrement'), {
      button: 0,
      pointerType: 'mouse',
    })
    expect(onValueChange.mock.lastCall?.[0]).toBe(4)
  })

  it('decrements by exact step without rounding when snapOnStep is false', () => {
    render(() => (
      <NumberField.Root defaultValue={5} step={2} snapOnStep={false}>
        <NumberField.Input data-testid="input" />
        <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('decrement'))
    expect(screen.getByTestId('input').value).toBe('3')
  })

  it('snaps on decrement when snapOnStep is true', () => {
    render(() => (
      <NumberField.Root defaultValue={5} step={2} snapOnStep>
        <NumberField.Input data-testid="input" />
        <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('decrement'))
    expect(screen.getByTestId('input').value).toBe('4')
  })

  describe('press and hold (jsdom basics)', () => {
    it('decrements on pointerdown without double-firing on click', () => {
      const onValueChange = vi.fn()
      render(() => (
        <NumberField.Root defaultValue={2} onValueChange={onValueChange}>
          <NumberField.Input data-testid="input" />
          <NumberField.Decrement data-testid="decrement">
            -
          </NumberField.Decrement>
        </NumberField.Root>
      ))

      const button = screen.getByTestId('decrement')
      fireEvent.pointerDown(button, { button: 0, pointerType: 'mouse' })
      fireEvent.pointerUp(button, { button: 0, pointerType: 'mouse' })
      // Real mouse clicks use detail >= 1; press-and-hold skips those via shouldSkipClick.
      fireEvent.click(button, { detail: 1 })

      expect(onValueChange.mock.calls.length).toBe(1)
      expect(screen.getByTestId('input').value).toBe('1')
    })
  })

  describe('press and hold (timer regressions)', () => {
    const { advance } = installRafClock()

    it('does not keep decrementing after a single press is released', () => {
      render(() => (
        <NumberField.Root defaultValue={10}>
          <NumberField.Input data-testid="input" />
          <NumberField.Decrement data-testid="decrement">
            -
          </NumberField.Decrement>
        </NumberField.Root>
      ))

      const button = screen.getByTestId('decrement')
      fireEvent.pointerDown(button, { button: 0, pointerType: 'mouse' })
      expect(screen.getByTestId('input').value).toBe('9')

      advance(PRESS_HOLD_START_DELAY_MS / 2)
      fireEvent.pointerUp(window, { button: 0, pointerType: 'mouse' })

      const valueAfterRelease = screen.getByTestId('input').value
      expect(valueAfterRelease).toBe('9')

      advance(PRESS_HOLD_START_DELAY_MS + PRESS_HOLD_TICK_DELAY_MS * 30)
      expect(screen.getByTestId('input').value).toBe(valueAfterRelease)
    })

    it('stops decrementing once the pointer is released after a hold', () => {
      render(() => (
        <NumberField.Root defaultValue={20}>
          <NumberField.Input data-testid="input" />
          <NumberField.Decrement data-testid="decrement">
            -
          </NumberField.Decrement>
        </NumberField.Root>
      ))

      const button = screen.getByTestId('decrement')
      fireEvent.pointerDown(button, { button: 0, pointerType: 'mouse' })
      expect(screen.getByTestId('input').value).toBe('19')

      advance(PRESS_HOLD_START_DELAY_MS + PRESS_HOLD_TICK_DELAY_MS * 5)
      const valueWhileHeld = Number(screen.getByTestId('input').value)
      expect(valueWhileHeld).toBeLessThan(19)

      fireEvent.pointerUp(window, { button: 0, pointerType: 'mouse' })
      const valueAfterRelease = screen.getByTestId('input').value
      expect(valueAfterRelease).toBe(String(valueWhileHeld))

      advance(PRESS_HOLD_TICK_DELAY_MS * 30)
      expect(screen.getByTestId('input').value).toBe(valueAfterRelease)
    })
  })
})
