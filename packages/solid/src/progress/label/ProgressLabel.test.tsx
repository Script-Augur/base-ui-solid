/**
 * Port of `@base-ui/react` Progress label tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Progress } from '../index'

import { ProgressLabel } from './ProgressLabel'

afterEach(() => {
  cleanup()
})

describe('<Progress.Label />', () => {
  it('updates and clears the progress bar label association', () => {
    const [labelId, labelIdAssign] = createSignal('label-a')
    const [showLabel, showLabelAssign] = createSignal(true)

    render(() => (
      <>
        <Progress.Root value={40}>
          <Show when={showLabel()}>
            <Progress.Label id={labelId()}>Upload progress</Progress.Label>
          </Show>
        </Progress.Root>
        <button type="button" onClick={() => labelIdAssign('label-b')}>
          Change id
        </button>
        <button type="button" onClick={() => showLabelAssign(false)}>
          Remove label
        </button>
      </>
    ))

    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-labelledby', 'label-a')

    fireEvent.click(screen.getByRole('button', { name: 'Change id' }))
    expect(progressbar).toHaveAttribute('aria-labelledby', 'label-b')

    fireEvent.click(screen.getByRole('button', { name: 'Remove label' }))
    expect(progressbar).not.toHaveAttribute('aria-labelledby')
  })

  it('throws a descriptive error when rendered outside <Progress.Root>', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      expect(() => render(() => <ProgressLabel />)).toThrow(
        'Base UI: ProgressRootContext is missing. Progress parts must be placed within <Progress.Root>.'
      )
    } finally {
      errorSpy.mockRestore()
    }
  })
})
