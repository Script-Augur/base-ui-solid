import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'

import { Separator } from './Separator'
import { SeparatorDataAttributes } from './SeparatorDataAttributes'

afterEach(() => {
  cleanup()
})

describe('Separator', () => {
  it('renders a div with the separator role', () => {
    render(() => <Separator />)
    const separator = screen.getByRole('separator')
    expect(separator).toBeVisible()
    expect(separator.tagName).toBe('DIV')
  })

  it('defaults to horizontal orientation', () => {
    render(() => <Separator />)
    const separator = screen.getByRole('separator')
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal')
    expect(separator).toHaveAttribute(
      SeparatorDataAttributes.orientation,
      'horizontal'
    )
  })

  describe('prop: orientation', () => {
    it.each(['horizontal', 'vertical'] as const)('%s', orientation => {
      render(() => <Separator orientation={orientation} />)
      const separator = screen.getByRole('separator')
      expect(separator).toHaveAttribute('aria-orientation', orientation)
      expect(separator).toHaveAttribute(
        SeparatorDataAttributes.orientation,
        orientation
      )
    })
  })
})
