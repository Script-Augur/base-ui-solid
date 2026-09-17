/**
 * Port of `@base-ui/react` Radio.Indicator tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { RadioGroup } from '../../radio-group'
import { Radio } from '../index'

afterEach(() => {
  cleanup()
})

describe('<Radio.Indicator />', () => {
  it('should remove the indicator when there is no exit animation defined', () => {
    render(() => (
      <RadioGroup defaultValue="a">
        <Radio.Root value="a" data-testid="a">
          <Radio.Indicator data-testid="indicator" />
        </Radio.Root>
        <Radio.Root value="b" data-testid="b" />
      </RadioGroup>
    ))

    expect(screen.getByTestId('indicator')).toBeTruthy()
    fireEvent.click(screen.getByTestId('b'))
    expect(screen.queryByTestId('indicator')).toBeNull()
  })

  it('keeps the indicator mounted when keepMounted is true', () => {
    render(() => (
      <RadioGroup defaultValue="a">
        <Radio.Root value="a" data-testid="a">
          <Radio.Indicator data-testid="indicator" keepMounted />
        </Radio.Root>
        <Radio.Root value="b" data-testid="b" />
      </RadioGroup>
    ))

    expect(screen.getByTestId('indicator')).toBeTruthy()
    fireEvent.click(screen.getByTestId('b'))
    expect(screen.getByTestId('indicator')).toHaveAttribute(
      'data-unchecked',
      ''
    )
  })
})
