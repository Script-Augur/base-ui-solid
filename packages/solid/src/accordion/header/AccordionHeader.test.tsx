/**
 * Port of `@base-ui/react` Accordion header tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Accordion } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Accordion.Header />', () => {
  it('throws when rendered outside an Accordion.Item', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      expect(() =>
        render(() => (
          <Accordion.Root>
            <Accordion.Header />
          </Accordion.Root>
        ))
      ).toThrow(/Accordion parts must be placed within <Accordion\.Item>/)
    } finally {
      errorSpy.mockRestore()
    }
  })
})
