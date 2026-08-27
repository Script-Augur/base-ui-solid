/**
 * Port of `@base-ui/react` Meter root tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Meter } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Meter.Root />', () => {
  function formatPercent(value: number) {
    return value.toLocaleString(undefined, { style: 'percent' })
  }

  describe('ARIA attributes', () => {
    it('sets the correct aria attributes', () => {
      render(() => (
        <Meter.Root value={30}>
          <Meter.Label>Battery Level</Meter.Label>
          <Meter.Track>
            <Meter.Indicator />
          </Meter.Track>
        </Meter.Root>
      ))

      const meter = screen.getByRole('meter')

      expect(meter).toHaveAttribute('aria-valuenow', '30')
      expect(meter).toHaveAttribute('aria-valuemin', '0')
      expect(meter).toHaveAttribute('aria-valuemax', '100')
      expect(meter).toHaveAttribute('aria-valuetext', formatPercent(0.3))
      expect(meter.getAttribute('aria-labelledby')).toBe(
        screen.getByText('Battery Level').getAttribute('id')
      )
    })

    it('defaults aria-valuetext to the localized formatted value, matching Meter.Value', () => {
      // German percent formatting inserts a narrow no-break space before `%`, so the localized
      // output differs from the raw `30%` string.
      const expected = new Intl.NumberFormat('de-DE', {
        style: 'percent',
      }).format(0.3)

      render(() => (
        <Meter.Root value={30} locale="de-DE">
          <Meter.Value data-testid="value" />
        </Meter.Root>
      ))

      const meter = screen.getByRole('meter')
      expect(meter).toHaveAttribute('aria-valuetext', expected)
      expect(meter.getAttribute('aria-valuetext')).toBe(
        screen.getByTestId('value').textContent
      )
    })

    it('rounds the default aria-valuetext like the displayed value', () => {
      const expected = formatPercent(0.33333)

      render(() => (
        <Meter.Root value={33.333}>
          <Meter.Value data-testid="value" />
        </Meter.Root>
      ))

      const meter = screen.getByRole('meter')
      expect(meter).toHaveAttribute('aria-valuetext', expected)
      expect(meter.getAttribute('aria-valuetext')).toBe(
        screen.getByTestId('value').textContent
      )
    })

    it('refreshes aria-valuenow, aria-valuetext, the value text, and the indicator when value changes', async () => {
      const fiftyPercent = formatPercent(0.5)
      const seventySevenPercent = formatPercent(0.77)

      const [value, valueAssign] = createSignal(50)

      render(() => (
        <Meter.Root value={value()}>
          <Meter.Value data-testid="value" />
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>
      ))
      const meter = screen.getByRole('meter')
      const valueElement = screen.getByTestId('value')
      const indicator = screen.getByTestId('indicator')

      expect(meter).toHaveAttribute('aria-valuenow', '50')
      expect(meter).toHaveAttribute('aria-valuetext', fiftyPercent)
      expect(valueElement.textContent).toBe(fiftyPercent)
      expect(indicator.style.width).toBe('50%')

      valueAssign(77)
      await flushMicrotasks()

      expect(meter).toHaveAttribute('aria-valuenow', '77')
      expect(meter).toHaveAttribute('aria-valuetext', seventySevenPercent)
      expect(valueElement.textContent).toBe(seventySevenPercent)
      expect(indicator.style.width).toBe('77%')
    })
  })

  describe('prop: getAriaValueText', () => {
    it('uses the returned text and receives the formatted and raw value', () => {
      const formatted = formatPercent(0.3)
      const getAriaValueText = vi.fn(
        (formattedValue: string, value: number) =>
          `${value} of 100 (${formattedValue})`
      )

      render(() => (
        <Meter.Root value={30} getAriaValueText={getAriaValueText}>
          <Meter.Value data-testid="value" />
        </Meter.Root>
      ))

      const meter = screen.getByRole('meter')
      expect(getAriaValueText).toHaveBeenCalledWith(formatted, 30)
      expect(meter).toHaveAttribute(
        'aria-valuetext',
        `30 of 100 (${formatted})`
      )
      // getAriaValueText only affects the spoken text, not the visible value.
      expect(screen.getByTestId('value').textContent).toBe(formatted)
    })
  })

  describe('range', () => {
    it('formats the value as its position within a custom range and keeps the indicator in sync', () => {
      const expected = formatPercent(0.5)

      render(() => (
        <Meter.Root value={0.5} min={0} max={1}>
          <Meter.Value data-testid="value" />
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>
      ))

      const meter = screen.getByRole('meter')
      expect(meter).toHaveAttribute('aria-valuenow', '0.5')
      expect(meter).toHaveAttribute('aria-valuetext', expected)
      expect(screen.getByTestId('value').textContent).toBe(expected)
      expect(screen.getByTestId('indicator').style.width).toBe('50%')
    })

    it('formats the value relative to a non-zero min', () => {
      const expected = formatPercent(0.5)

      render(() => (
        <Meter.Root value={30} min={20} max={40}>
          <Meter.Value data-testid="value" />
        </Meter.Root>
      ))

      expect(screen.getByRole('meter')).toHaveAttribute(
        'aria-valuetext',
        expected
      )
      expect(screen.getByTestId('value').textContent).toBe(expected)
    })

    it('keeps range attributes, formatted text, and the indicator synchronized on rerender', async () => {
      const initialValue = formatPercent(0.5)
      const updatedValue = formatPercent(0.75)

      const [min, minAssign] = createSignal(10)
      const [max, maxAssign] = createSignal(30)
      const [value, valueAssign] = createSignal(20)

      render(() => (
        <Meter.Root value={value()} min={min()} max={max()}>
          <Meter.Value data-testid="value" />
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>
      ))

      const meter = screen.getByRole('meter')
      const valueElement = screen.getByTestId('value')
      const indicator = screen.getByTestId('indicator')

      expect(meter).toHaveAttribute('aria-valuemin', '10')
      expect(meter).toHaveAttribute('aria-valuemax', '30')
      expect(meter).toHaveAttribute('aria-valuenow', '20')
      expect(meter).toHaveAttribute('aria-valuetext', initialValue)
      expect(valueElement).toHaveTextContent(initialValue)
      expect(indicator.style.width).toBe('50%')

      minAssign(20)
      maxAssign(60)
      valueAssign(50)
      await flushMicrotasks()

      expect(meter).toHaveAttribute('aria-valuemin', '20')
      expect(meter).toHaveAttribute('aria-valuemax', '60')
      expect(meter).toHaveAttribute('aria-valuenow', '50')
      expect(meter).toHaveAttribute('aria-valuetext', updatedValue)
      expect(valueElement).toHaveTextContent(updatedValue)
      expect(indicator.style.width).toBe('75%')
    })

    it.each([
      {
        label: 'value exceeds max',
        props: { value: 150 },
        ariaValueNow: '100',
        ariaValueText: formatPercent(1),
      },
      {
        label: 'value is below min',
        props: { value: -10 },
        ariaValueNow: '0',
        ariaValueText: formatPercent(0),
      },
      {
        label: 'min equals max',
        props: { value: 5, min: 5, max: 5 },
        ariaValueNow: '5',
        ariaValueText: formatPercent(0),
      },
      {
        label: 'value is NaN',
        props: { value: Number.NaN },
        ariaValueNow: '0',
        ariaValueText: formatPercent(0),
      },
    ] as const)(
      'normalizes aria attributes when $label',
      ({ props, ariaValueNow, ariaValueText }) => {
        render(() => <Meter.Root {...props} />)

        const meter = screen.getByRole('meter')
        expect(meter).toHaveAttribute('aria-valuenow', ariaValueNow)
        expect(meter).toHaveAttribute('aria-valuetext', ariaValueText)
      }
    )
  })

  describe('prop: format', () => {
    it('formats the value', () => {
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      }
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v)
      }

      render(() => (
        <Meter.Root value={30} format={format}>
          <Meter.Value data-testid="value" />
          <Meter.Track>
            <Meter.Indicator />
          </Meter.Track>
        </Meter.Root>
      ))

      const value = screen.getByTestId('value')
      const meter = screen.getByRole('meter')
      expect(value.textContent).toBe(formatValue(30))
      expect(meter).toHaveAttribute('aria-valuetext', formatValue(30))
    })

    it('formats the clamped value while clamping range attributes and indicator width', () => {
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      }
      const expectedValue = new Intl.NumberFormat(undefined, format).format(100)
      const getAriaValueText = vi.fn(
        (formattedValue: string, rawValue: number) =>
          `${formattedValue} (raw: ${rawValue})`
      )

      render(() => (
        <Meter.Root
          value={150}
          format={format}
          getAriaValueText={getAriaValueText}
        >
          <Meter.Value data-testid="value" />
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>
      ))

      const meter = screen.getByRole('meter')
      expect(screen.getByTestId('value').textContent).toBe(expectedValue)
      expect(meter).toHaveAttribute('aria-valuenow', '100')
      expect(getAriaValueText).toHaveBeenLastCalledWith(expectedValue, 150)
      expect(meter).toHaveAttribute(
        'aria-valuetext',
        `${expectedValue} (raw: 150)`
      )
      expect(screen.getByTestId('indicator').style.width).toBe('100%')
    })
  })

  describe('prop: locale', () => {
    it('sets the locale when formatting the value', () => {
      // In German locale, numbers use dot as thousands separator and comma as decimal separator
      const expectedValue = new Intl.NumberFormat('de-DE').format(86.49)

      render(() => (
        <Meter.Root
          value={86.49}
          format={{
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }}
          locale="de-DE"
        >
          <Meter.Value data-testid="value" />
        </Meter.Root>
      ))

      expect(screen.getByTestId('value').textContent).toBe(expectedValue)
    })
  })
})

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
  await new Promise<void>(resolve => queueMicrotask(resolve))
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}
