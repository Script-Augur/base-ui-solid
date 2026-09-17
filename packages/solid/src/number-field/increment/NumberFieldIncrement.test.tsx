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

describe('<NumberField.Increment />', () => {
  it('exposes aria-label Increase', () => {
    render(() => (
      <NumberField.Root defaultValue={0}>
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
      </NumberField.Root>
    ))
    expect(screen.getByTestId('increment')).toHaveAttribute(
      'aria-label',
      'Increase'
    )
  })

  it('increments the value on click', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={0} onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('increment'))
    expect(onValueChange.mock.calls.at(-1)![0]).toBe(1)
    expect(screen.getByTestId('input').value).toBe('1')
  })

  it('increments starting from null to 0 on first click', () => {
    render(() => (
      <NumberField.Root>
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('increment'))
    expect(screen.getByTestId('input').value).toBe('0')
  })

  it('is disabled at max', () => {
    render(() => (
      <NumberField.Root defaultValue={5} max={5}>
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
      </NumberField.Root>
    ))
    expect(screen.getByTestId('increment')).toBeDisabled()
  })

  it('should not increment when root is disabled', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={0} disabled onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('increment'))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByTestId('input').value).toBe('0')
  })

  it('should not increment when readOnly', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={0} readOnly onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('increment'))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('only calls onValueChange once per increment click', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={0} onValueChange={onValueChange}>
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('increment'))
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it('first increment after external controlled update', () => {
    const [value, valueAssign] = createSignal<number | null>(1)

    render(() => (
      <NumberField.Root
        value={value()}
        onValueChange={next => valueAssign(next)}
      >
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
        <button type="button" onClick={() => valueAssign(10)}>
          external
        </button>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByText('external'))
    expect(screen.getByTestId('input').value).toBe('10')
    fireEvent.click(screen.getByTestId('increment'))
    expect(screen.getByTestId('input').value).toBe('11')
  })

  it('should increment when input is dirty but not blurred (pointerdown)', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={0} onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
      </NumberField.Root>
    ))

    const input = screen.getByTestId('input')
    input.value = '5'
    fireEvent.input(input)
    expect(onValueChange.mock.lastCall?.[0]).toBe(5)

    fireEvent.pointerDown(screen.getByTestId('increment'), {
      button: 0,
      pointerType: 'mouse',
    })
    expect(onValueChange.mock.lastCall?.[0]).toBe(6)
  })

  it('increments by exact step without rounding when snapOnStep is false', () => {
    render(() => (
      <NumberField.Root defaultValue={1} step={2} snapOnStep={false}>
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('increment'))
    expect(screen.getByTestId('input').value).toBe('3')
  })

  it('snaps on increment when snapOnStep is true', () => {
    render(() => (
      <NumberField.Root defaultValue={1} step={2} snapOnStep>
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
      </NumberField.Root>
    ))

    fireEvent.click(screen.getByTestId('increment'))
    expect(screen.getByTestId('input').value).toBe('2')
  })

  it('exposes aria-controls on the stepper', () => {
    render(() => (
      <NumberField.Root defaultValue={0} id="qty">
        <NumberField.Input data-testid="input" />
        <NumberField.Increment data-testid="increment">+</NumberField.Increment>
      </NumberField.Root>
    ))

    const controls = screen
      .getByTestId('increment')
      .getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    expect(controls).toBe(screen.getByTestId('input').id)
  })

  describe('press and hold (jsdom basics)', () => {
    it('increments on pointerdown without double-firing on click', () => {
      const onValueChange = vi.fn()
      render(() => (
        <NumberField.Root defaultValue={0} onValueChange={onValueChange}>
          <NumberField.Input data-testid="input" />
          <NumberField.Increment data-testid="increment">
            +
          </NumberField.Increment>
        </NumberField.Root>
      ))

      const button = screen.getByTestId('increment')
      fireEvent.pointerDown(button, { button: 0, pointerType: 'mouse' })
      fireEvent.pointerUp(button, { button: 0, pointerType: 'mouse' })
      // Real mouse clicks use detail >= 1; press-and-hold skips those via shouldSkipClick.
      fireEvent.click(button, { detail: 1 })

      expect(onValueChange.mock.calls.length).toBe(1)
      expect(screen.getByTestId('input').value).toBe('1')
    })

    it('keeps the same increment button node across value updates', () => {
      render(() => (
        <NumberField.Root defaultValue={0}>
          <NumberField.Input data-testid="input" />
          <NumberField.Increment data-testid="increment">
            +
          </NumberField.Increment>
        </NumberField.Root>
      ))

      const button = screen.getByTestId('increment')
      fireEvent.pointerDown(button, { button: 0, pointerType: 'mouse' })
      fireEvent.pointerUp(document, { button: 0, pointerType: 'mouse' })

      expect(screen.getByTestId('input').value).toBe('1')
      expect(screen.getByTestId('increment')).toBe(button)
    })

    it('ignores non-primary pointer buttons', () => {
      const onValueChange = vi.fn()
      render(() => (
        <NumberField.Root defaultValue={0} onValueChange={onValueChange}>
          <NumberField.Increment data-testid="increment">
            +
          </NumberField.Increment>
        </NumberField.Root>
      ))

      fireEvent.pointerDown(screen.getByTestId('increment'), {
        button: 1,
        pointerType: 'mouse',
      })
      expect(onValueChange).not.toHaveBeenCalled()
    })
  })

  describe('press and hold (timer regressions)', () => {
    const { advance } = installRafClock()

    it('does not keep incrementing after a single press is released', () => {
      render(() => (
        <NumberField.Root defaultValue={0}>
          <NumberField.Input data-testid="input" />
          <NumberField.Increment data-testid="increment">
            +
          </NumberField.Increment>
        </NumberField.Root>
      ))

      const button = screen.getByTestId('increment')
      fireEvent.pointerDown(button, { button: 0, pointerType: 'mouse' })
      expect(screen.getByTestId('input').value).toBe('1')

      // Release before the hold repeat starts.
      advance(PRESS_HOLD_START_DELAY_MS / 2)
      fireEvent.pointerUp(window, { button: 0, pointerType: 'mouse' })

      const valueAfterRelease = screen.getByTestId('input').value
      expect(valueAfterRelease).toBe('1')

      // Well past start delay + many tick intervals — must stay put.
      advance(PRESS_HOLD_START_DELAY_MS + PRESS_HOLD_TICK_DELAY_MS * 30)
      expect(screen.getByTestId('input').value).toBe(valueAfterRelease)
    })

    it('stops incrementing once the pointer is released after a hold', () => {
      render(() => (
        <NumberField.Root defaultValue={0}>
          <NumberField.Input data-testid="input" />
          <NumberField.Increment data-testid="increment">
            +
          </NumberField.Increment>
        </NumberField.Root>
      ))

      const button = screen.getByTestId('increment')
      fireEvent.pointerDown(button, { button: 0, pointerType: 'mouse' })
      expect(screen.getByTestId('input').value).toBe('1')

      // Cross the start delay and let several repeat ticks fire.
      advance(PRESS_HOLD_START_DELAY_MS + PRESS_HOLD_TICK_DELAY_MS * 5)
      const valueWhileHeld = Number(screen.getByTestId('input').value)
      expect(valueWhileHeld).toBeGreaterThan(1)

      fireEvent.pointerUp(window, { button: 0, pointerType: 'mouse' })
      const valueAfterRelease = screen.getByTestId('input').value
      expect(valueAfterRelease).toBe(String(valueWhileHeld))

      advance(PRESS_HOLD_TICK_DELAY_MS * 30)
      expect(screen.getByTestId('input').value).toBe(valueAfterRelease)
    })
  })
})
