import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NumberField } from '../index'

afterEach(() => {
  cleanup()
})

describe('<NumberField.Input />', () => {
  it('has textbox role', () => {
    render(() => (
      <NumberField.Root>
        <NumberField.Input />
      </NumberField.Root>
    ))
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it('sets aria-roledescription by default', () => {
    render(() => (
      <NumberField.Root>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))
    expect(screen.getByTestId('input')).toHaveAttribute(
      'aria-roledescription',
      'Number field'
    )
  })

  it('updates value while typing parseable numbers', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={null} onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    const input = screen.getByTestId('input')
    fireEvent.input(input, { target: { value: '12' } })
    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls.at(-1)![0]).toBe(12)
    expect(input.value).toBe('12')
  })

  it('does not fire onValueChange for non-numeric partial input', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    fireEvent.input(screen.getByTestId('input'), { target: { value: 'abc' } })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('fires onValueChange for parseable typing', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    const input = screen.getByTestId('input')
    input.value = '12'
    fireEvent.input(input)
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange.mock.calls[0][0]).toBe(12)
  })

  it('does not fire onValueChange for trailing non-numeric characters', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={12} onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    const input = screen.getByTestId('input')
    input.value = '12.a'
    fireEvent.input(input)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('clears value when input is emptied', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={5} onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    fireEvent.input(screen.getByTestId('input'), { target: { value: '' } })
    expect(onValueChange.mock.calls.at(-1)![0]).toBeNull()
  })

  it('steps with ArrowUp / ArrowDown', () => {
    const onValueChange = vi.fn()
    const onValueCommitted = vi.fn()
    const [value, valueAssign] = createSignal<number | null>(1)

    render(() => (
      <NumberField.Root
        value={value()}
        onValueChange={(next, details) => {
          onValueChange(next, details)
          if (!details.isCanceled) {
            valueAssign(next)
          }
        }}
        onValueCommitted={onValueCommitted}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    fireEvent.keyDown(screen.getByTestId('input'), { key: 'ArrowUp' })
    expect(onValueChange.mock.calls.at(-1)![0]).toBe(2)
    expect(value()).toBe(2)
    expect(onValueCommitted).toHaveBeenCalled()
    expect(screen.getByTestId('input').value).toBe('2')

    fireEvent.keyDown(screen.getByTestId('input'), { key: 'ArrowDown' })
    expect(onValueChange.mock.calls.at(-1)![0]).toBe(1)
    expect(value()).toBe(1)
    expect(screen.getByTestId('input').value).toBe('1')
  })

  it('sets the value to min on keydown Home', () => {
    render(() => (
      <NumberField.Root min={-10} max={10}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    fireEvent.keyDown(screen.getByTestId('input'), { key: 'Home' })
    expect(screen.getByTestId('input').value).toBe('-10')
  })

  it('sets the value to max on keydown End', () => {
    render(() => (
      <NumberField.Root min={-10} max={10}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    fireEvent.keyDown(screen.getByTestId('input'), { key: 'End' })
    expect(screen.getByTestId('input').value).toBe('10')
  })

  it('uses smallStep when holding Alt with ArrowUp', () => {
    const onValueChange = vi.fn()
    const [value, valueAssign] = createSignal<number | null>(0.15)

    render(() => (
      <NumberField.Root
        value={value()}
        smallStep={0.1}
        snapOnStep
        onValueChange={(next, details) => {
          onValueChange(next, details)
          if (!details.isCanceled) {
            valueAssign(next)
          }
        }}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    fireEvent.keyDown(screen.getByTestId('input'), {
      key: 'ArrowUp',
      altKey: true,
    })
    expect(onValueChange.mock.lastCall?.[0]).toBe(0.3)
    expect(value()).toBe(0.3)
  })

  it('uses largeStep when holding Shift with ArrowUp', () => {
    const onValueChange = vi.fn()
    const [value, valueAssign] = createSignal<number | null>(5)

    render(() => (
      <NumberField.Root
        value={value()}
        largeStep={10}
        onValueChange={(next, details) => {
          onValueChange(next, details)
          if (!details.isCanceled) {
            valueAssign(next)
          }
        }}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    fireEvent.keyDown(screen.getByTestId('input'), {
      key: 'ArrowUp',
      shiftKey: true,
    })
    expect(onValueChange.mock.lastCall?.[0]).toBe(15)
    expect(value()).toBe(15)
  })

  it('uses smallStep when holding Alt with ArrowDown', () => {
    const onValueChange = vi.fn()
    const [value, valueAssign] = createSignal<number | null>(0.3)

    render(() => (
      <NumberField.Root
        value={value()}
        smallStep={0.1}
        snapOnStep
        onValueChange={(next, details) => {
          onValueChange(next, details)
          if (!details.isCanceled) {
            valueAssign(next)
          }
        }}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    fireEvent.keyDown(screen.getByTestId('input'), {
      key: 'ArrowDown',
      altKey: true,
    })
    expect(onValueChange.mock.lastCall?.[0]).toBe(0.2)
    expect(value()).toBe(0.2)
  })

  it('advances by a smallStep finer than 3 fraction digits', () => {
    const onValueChange = vi.fn()
    const [value, valueAssign] = createSignal<number | null>(0)

    render(() => (
      <NumberField.Root
        value={value()}
        smallStep={0.0001}
        onValueChange={(next, details) => {
          onValueChange(next, details)
          if (!details.isCanceled) {
            valueAssign(next)
          }
        }}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    fireEvent.keyDown(screen.getByTestId('input'), {
      key: 'ArrowUp',
      altKey: true,
    })
    expect(onValueChange.mock.lastCall?.[0]).toBe(0.0001)
  })

  it('formats on blur', () => {
    render(() => (
      <NumberField.Root defaultValue={null}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    const input = screen.getByTestId('input')
    fireEvent.input(input, { target: { value: '42' } })
    fireEvent.blur(input)
    expect(input.value).toBe('42')
  })

  it('commits validated number on blur (min)', () => {
    const onValueChange = vi.fn()
    const onValueCommitted = vi.fn()
    render(() => (
      <NumberField.Root
        defaultValue={null}
        min={5}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    const input = screen.getByTestId('input')
    input.value = '2'
    fireEvent.input(input)
    expect(onValueChange.mock.lastCall?.[0]).toBe(5)
    fireEvent.blur(input)
    expect(onValueCommitted.mock.lastCall?.[0]).toBe(5)
  })

  it('commits validated number on blur (max)', () => {
    const onValueChange = vi.fn()
    const onValueCommitted = vi.fn()
    render(() => (
      <NumberField.Root
        defaultValue={null}
        max={5}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    const input = screen.getByTestId('input')
    input.value = '8'
    fireEvent.input(input)
    expect(onValueChange.mock.lastCall?.[0]).toBe(5)
    fireEvent.blur(input)
    expect(onValueCommitted.mock.lastCall?.[0]).toBe(5)
  })

  it('does not snap number to step on blur', () => {
    const onValueCommitted = vi.fn()
    render(() => (
      <NumberField.Root
        defaultValue={null}
        step={2}
        min={0}
        onValueCommitted={onValueCommitted}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    const input = screen.getByTestId('input')
    input.value = '3'
    fireEvent.input(input)
    fireEvent.blur(input)
    expect(onValueCommitted.mock.lastCall?.[0]).toBe(3)
  })

  it('commits parsed currency amount on blur', () => {
    const format: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'USD',
    }
    const onValueCommitted = vi.fn()

    render(() => (
      <NumberField.Root
        defaultValue={null}
        format={format}
        onValueCommitted={onValueCommitted}
      >
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    const input = screen.getByTestId('input')
    input.value = '12'
    fireEvent.input(input)
    fireEvent.blur(input)
    expect(onValueCommitted.mock.lastCall?.[0]).toBe(12)
  })

  it('applies paste into the current selection', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={null} onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    const input = screen.getByTestId('input')
    fireEvent.input(input, { target: { value: '' } })

    Object.defineProperty(input, 'selectionStart', {
      configurable: true,
      value: 0,
    })
    Object.defineProperty(input, 'selectionEnd', {
      configurable: true,
      value: 0,
    })

    fireEvent.paste(input, {
      clipboardData: {
        getData: () => '42',
      },
    })

    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(42)
  })

  it('does not step when the keydown default is prevented', () => {
    const onValueChange = vi.fn()
    render(() => (
      <NumberField.Root defaultValue={0} onValueChange={onValueChange}>
        <NumberField.Input
          data-testid="input"
          onKeyDown={event => event.preventDefault()}
        />
      </NumberField.Root>
    ))

    fireEvent.keyDown(screen.getByTestId('input'), { key: 'ArrowUp' })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('increments with keyboard from numeric state, not rounded display text', () => {
    const onValueChange = vi.fn()

    render(() => (
      <NumberField.Root defaultValue={1.23456} onValueChange={onValueChange}>
        <NumberField.Input data-testid="input" />
      </NumberField.Root>
    ))

    expect(screen.getByTestId('input').value).toBe((1.23456).toLocaleString())
    fireEvent.keyDown(screen.getByTestId('input'), { key: 'ArrowUp' })
    expect(onValueChange.mock.lastCall?.[0]).toBe(2.23456)
  })
})
