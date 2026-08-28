/**
 * Port of `@base-ui/react` ScrollArea.Corner tests (v1.7.0).
 * Browser-only / conformance skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render } from '@solidjs/testing-library'
import { afterEach, describe, it } from 'vitest'

import { ScrollArea } from '../index'

afterEach(cleanup)

describe('<ScrollArea.Corner />', () => {
  it('renders without throwing when nested under Root with both scrollbars', () => {
    render(() => (
      <ScrollArea.Root style={{ width: '200px', height: '200px' }}>
        <ScrollArea.Viewport style={{ width: '100%', height: '100%' }}>
          <div style={{ width: '1000px', height: '1000px' }} />
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" keepMounted />
        <ScrollArea.Scrollbar orientation="horizontal" keepMounted />
        <ScrollArea.Corner data-testid="corner" />
      </ScrollArea.Root>
    ))
  })

  describe.skip('interactions (browser layout)', () => {
    it('should apply correct corner size when both scrollbars are present', () => {
      // Upstream: describe.skipIf(isJSDOM) — Storybook coverage.
    })
  })
})
