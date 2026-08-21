/**
 * Port of `@base-ui/react` Accordion trigger tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { Accordion } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Accordion.Trigger />', () => {
  it('keeps a non-native trigger tabbable', () => {
    render(() => (
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger
              nativeButton={false}
              render={(props: Record<string, unknown>) => <span {...props} />}
            >
              Trigger
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ))

    const trigger = screen.getByRole('button', { name: 'Trigger' })
    expect(trigger).toHaveAttribute('tabindex', '0')
  })
})
