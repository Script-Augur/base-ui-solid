/**
 * Port of `@base-ui/react` Meter indicator tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { Meter } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Meter.Indicator />', () => {
  describe('value bounds', () => {
    it('clamps the width to 100% when the value exceeds max', () => {
      render(() => (
        <Meter.Root value={150}>
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>
      ))

      expect(screen.getByTestId('indicator').style.width).toBe('100%')
    })

    it('clamps the width to 0% when the value is below min', () => {
      render(() => (
        <Meter.Root value={-10}>
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>
      ))

      expect(screen.getByTestId('indicator').style.width).toBe('0%')
    })

    it('produces a finite width when min equals max', () => {
      render(() => (
        <Meter.Root value={5} min={5} max={5}>
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>
      ))

      expect(screen.getByTestId('indicator').style.width).toBe('0%')
    })
  })
})
