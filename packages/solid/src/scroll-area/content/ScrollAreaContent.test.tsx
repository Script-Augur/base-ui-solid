/**
 * Port of `@base-ui/react` ScrollArea.Content tests (v1.7.0).
 * Browser-only / conformance skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ScrollArea } from '../index'

afterEach(cleanup)

describe('<ScrollArea.Content />', () => {
  it('throws a descriptive error when rendered outside <ScrollArea.Viewport>', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Content />
        </ScrollArea.Root>
      ))
    ).toThrow(
      'Base UI: ScrollAreaViewportContext missing. ScrollAreaViewport parts must be placed within <ScrollArea.Viewport>.'
    )

    errorSpy.mockRestore()
  })

  it('supports a custom content renderer that does not forward its ref', () => {
    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Viewport>
          <ScrollArea.Content
            data-testid="content"
            render={(props: Record<string, unknown>) => <div {...props} />}
          />
        </ScrollArea.Viewport>
      </ScrollArea.Root>
    ))

    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it.skip('recomputes overflow when observed content resizes (browser layout)', () => {
    // Upstream: it.skipIf(isJSDOM) — Storybook coverage.
  })
})
