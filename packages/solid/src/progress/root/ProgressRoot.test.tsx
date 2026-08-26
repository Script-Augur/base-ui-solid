/**
 * Port of `@base-ui/react` Progress root tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Progress } from '../index'

import type { ProgressRootProps } from './ProgressRoot'

afterEach(() => {
  cleanup()
})
describe('<Progress.Root />', () => {
  describe('ARIA attributes', () => {
    it('sets the correct aria attributes', () => {
      render(() => (
        <Progress.Root value={30}>
          <Progress.Label>Downloading</Progress.Label>
          <Progress.Value />
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      ))

      const progressbar = screen.getByRole('progressbar')
      const label = screen.getByText('Downloading')

      expect(progressbar).toHaveAttribute('aria-valuenow', '30')
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
      expect(progressbar).toHaveAttribute(
        'aria-valuetext',
        (0.3).toLocaleString(undefined, { style: 'percent' })
      )
      expect(progressbar.getAttribute('aria-labelledby')).toBe(
        label.getAttribute('id')
      )
    })

    it('should update aria-valuenow when value changes', async () => {
      const [value, valueAssign] = createSignal<number | null>(50)

      render(() => (
        <Progress.Root value={value()}>
          <Progress.Label data-testid="label">Upload progress</Progress.Label>
          <Progress.Value data-testid="value" />
          <Progress.Track data-testid="track">
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ))

      const progressbar = screen.getByRole('progressbar')
      valueAssign(77)
      await flushMicrotasks()
      expect(progressbar).toHaveAttribute('aria-valuenow', '77')
    })
  })

  describe('data attributes', () => {
    it('keeps every composed part synchronized through the status cycle', async () => {
      const [value, valueAssign] = createSignal<number | null>(null)

      render(() => (
        <Progress.Root value={value()}>
          <Progress.Label data-testid="label">Upload progress</Progress.Label>
          <Progress.Value data-testid="value" />
          <Progress.Track data-testid="track">
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ))

      const progressbar = screen.getByRole('progressbar')
      const valueElement = screen.getByTestId('value')
      const indicator = screen.getByTestId('indicator')
      const parts = [
        progressbar,
        screen.getByTestId('label'),
        valueElement,
        screen.getByTestId('track'),
        indicator,
      ]

      parts.forEach(part => {
        expect(part).toHaveAttribute('data-indeterminate')
        expect(part).not.toHaveAttribute('data-progressing')
        expect(part).not.toHaveAttribute('data-complete')
      })
      expect(progressbar).not.toHaveAttribute('aria-valuenow')
      expect(progressbar).toHaveAttribute(
        'aria-valuetext',
        'indeterminate progress'
      )
      expect(valueElement).toBeEmptyDOMElement()
      expect(indicator.style.width).toBe('')

      valueAssign(50)
      await flushMicrotasks()
      parts.forEach(part => {
        expect(part).not.toHaveAttribute('data-indeterminate')
        expect(part).toHaveAttribute('data-progressing')
        expect(part).not.toHaveAttribute('data-complete')
      })
      expect(progressbar).toHaveAttribute('aria-valuenow', '50')
      expect(valueElement.textContent).toBe(formatPercent(0.5))
      expect(indicator.style.width).toBe('50%')

      valueAssign(100)
      await flushMicrotasks()
      parts.forEach(part => {
        expect(part).not.toHaveAttribute('data-indeterminate')
        expect(part).not.toHaveAttribute('data-progressing')
        expect(part).toHaveAttribute('data-complete')
      })
      expect(progressbar).toHaveAttribute('aria-valuenow', '100')
      expect(valueElement.textContent).toBe(formatPercent(1))
      expect(indicator.style.width).toBe('100%')

      valueAssign(null)
      await flushMicrotasks()
      parts.forEach(part => {
        expect(part).toHaveAttribute('data-indeterminate')
        expect(part).not.toHaveAttribute('data-progressing')
        expect(part).not.toHaveAttribute('data-complete')
      })
      expect(progressbar).not.toHaveAttribute('aria-valuenow')
      expect(progressbar).toHaveAttribute(
        'aria-valuetext',
        'indeterminate progress'
      )
      expect(valueElement).toBeEmptyDOMElement()
      expect(indicator.style.width).toBe('')
    })
  })

  describe('range', () => {
    it('normalizes the formatted value, aria-valuetext, and indicator within a custom range', () => {
      const expected = (0.5).toLocaleString(undefined, { style: 'percent' })

      render(() => (
        <Progress.Root min={20} max={40} value={30}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ))

      const progressbar = screen.getByRole('progressbar')
      expect(screen.getByTestId('indicator').style.width).toBe('50%')
      expect(screen.getByTestId('value').textContent).toBe(expected)
      expect(progressbar).toHaveAttribute('aria-valuetext', expected)
    })

    it('clamps aria-valuenow, the value text, and the indicator when the value overshoots max', () => {
      const expected = (1).toLocaleString(undefined, { style: 'percent' })

      render(() => (
        <Progress.Root min={0} max={40} value={50}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ))

      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '40')
      expect(progressbar).toHaveAttribute('aria-valuemax', '40')
      expect(progressbar).toHaveAttribute('aria-valuetext', expected)
      expect(screen.getByTestId('value').textContent).toBe(expected)
      expect(screen.getByTestId('indicator').style.width).toBe('100%')
    })

    it('clamps aria-valuenow, the value text, and the indicator when the value undershoots min', () => {
      const expected = (0).toLocaleString(undefined, { style: 'percent' })

      render(() => (
        <Progress.Root min={20} max={40} value={10}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ))

      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '20')
      expect(progressbar).toHaveAttribute('aria-valuemin', '20')
      expect(progressbar).toHaveAttribute('aria-valuetext', expected)
      expect(screen.getByTestId('value').textContent).toBe(expected)
      expect(screen.getByTestId('indicator').style.width).toBe('0%')
    })

    it.each([
      { value: 50, expectedValue: 40 },
      { value: 10, expectedValue: 20 },
    ])(
      'formats the clamped value $expectedValue when a custom-formatted value $value is outside the range',
      ({ value, expectedValue }) => {
        const format: Intl.NumberFormatOptions = {
          style: 'currency',
          currency: 'USD',
        }
        const expected = new Intl.NumberFormat(undefined, format).format(
          expectedValue
        )
        const getAriaValueText = vi.fn(
          (formattedValue: string, rawValue: number | null) => {
            return `${formattedValue} (raw: ${rawValue})`
          }
        )

        render(() => (
          <Progress.Root
            min={20}
            max={40}
            value={value}
            format={format}
            getAriaValueText={getAriaValueText}
          >
            <Progress.Value data-testid="value" />
          </Progress.Root>
        ))

        const progressbar = screen.getByRole('progressbar')
        expect(progressbar).toHaveAttribute(
          'aria-valuenow',
          String(expectedValue)
        )
        expect(screen.getByTestId('value')).toHaveTextContent(expected)
        expect(getAriaValueText).toHaveBeenLastCalledWith(expected, value)
        expect(progressbar).toHaveAttribute(
          'aria-valuetext',
          `${expected} (raw: ${value})`
        )
      }
    )

    it('reports complete when the value reaches or exceeds max', () => {
      render(() => (
        <Progress.Root min={0} max={40} value={45}>
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      ))

      expect(screen.getByRole('progressbar')).toHaveAttribute('data-complete')
    })

    it('normalizes aria attributes when min equals max', () => {
      const expected = (0).toLocaleString(undefined, { style: 'percent' })

      render(() => (
        <Progress.Root min={5} max={5} value={5}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ))

      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '5')
      expect(progressbar).toHaveAttribute('aria-valuetext', expected)
      expect(screen.getByTestId('value').textContent).toBe(expected)
      expect(screen.getByTestId('indicator').style.width).toBe('0%')
    })

    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
      'keeps non-finite value %s indeterminate',
      value => {
        render(() => <TestProgress value={value} />)

        const progressbar = screen.getByRole('progressbar')
        expect(progressbar).toHaveAttribute('data-indeterminate')
        expect(progressbar).not.toHaveAttribute('aria-valuenow')
        expect(progressbar).toHaveAttribute(
          'aria-valuetext',
          'indeterminate progress'
        )
        expect(screen.getByTestId('value')).toBeEmptyDOMElement()
        expect(screen.getByTestId('indicator').style.width).toBe('')
      }
    )
  })

  describe('prop: getAriaValueText', () => {
    it('receives the formatted and raw values for determinate and indeterminate states', async () => {
      const getAriaValueText = vi.fn(
        (formattedValue: string | null, value: number | null) =>
          value == null ? 'Waiting to start' : `${formattedValue} uploaded`
      )

      const [value, valueAssign] = createSignal<number | null>(30)

      render(() => (
        <Progress.Root value={value()} getAriaValueText={getAriaValueText}>
          <Progress.Value data-testid="value" />
        </Progress.Root>
      ))

      const progressbar = screen.getByRole('progressbar')
      const formattedValue = formatPercent(0.3)
      expect(getAriaValueText).toHaveBeenLastCalledWith(formattedValue, 30)
      expect(progressbar).toHaveAttribute(
        'aria-valuetext',
        `${formattedValue} uploaded`
      )
      expect(screen.getByTestId('value').textContent).toBe(formattedValue)

      valueAssign(null)
      await flushMicrotasks()

      expect(getAriaValueText).toHaveBeenLastCalledWith('', null)
      expect(progressbar).toHaveAttribute('aria-valuetext', 'Waiting to start')
      expect(screen.getByTestId('value')).toBeEmptyDOMElement()
    })
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
        <Progress.Root value={30} format={format}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      ))

      const valueElement = screen.getByTestId('value')
      const progressbar = screen.getByRole('progressbar')
      expect(valueElement.textContent).toBe(formatValue(30))
      expect(progressbar).toHaveAttribute('aria-valuetext', formatValue(30))
    })

    it('reflects format changes without lagging a commit', async () => {
      const usd: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      }
      const eur: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'EUR',
      }
      function formatValue(v: number, options: Intl.NumberFormatOptions) {
        return new Intl.NumberFormat(undefined, options).format(v)
      }

      const [format, formatAssign] = createSignal<Intl.NumberFormatOptions>(usd)

      render(() => (
        <Progress.Root value={30} format={format()}>
          <Progress.Value data-testid="value" />
        </Progress.Root>
      ))

      const valueElement = screen.getByTestId('value')
      expect(valueElement.textContent).toBe(formatValue(30, usd))

      formatAssign(eur)
      await flushMicrotasks()
      expect(valueElement.textContent).toBe(formatValue(30, eur))
    })
  })

  describe('prop: locale', () => {
    it('sets the locale when formatting the value', () => {
      const expectedValue = new Intl.NumberFormat('de-DE').format(70.51)

      render(() => (
        <Progress.Root
          value={70.51}
          format={{
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }}
          locale="de-DE"
        >
          <Progress.Value data-testid="value" />
        </Progress.Root>
      ))

      expect(screen.getByTestId('value')).toHaveTextContent(expectedValue)
    })
  })
})
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
  await new Promise<void>(resolve => queueMicrotask(resolve))
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}
function formatPercent(value: number) {
  return value.toLocaleString(undefined, { style: 'percent' })
}
function TestProgress(props: ProgressRootProps) {
  return (
    <Progress.Root {...props}>
      <Progress.Label data-testid="label">Upload progress</Progress.Label>
      <Progress.Value data-testid="value" />
      <Progress.Track data-testid="track">
        <Progress.Indicator data-testid="indicator" />
      </Progress.Track>
    </Progress.Root>
  )
}
