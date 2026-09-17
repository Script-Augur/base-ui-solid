/**
 * Port of `@base-ui/react` Toolbar tests (v1.7.0).
 * Skips documented in `./UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { flushMicrotasks } from '../field/test-utils'
import { DirectionProvider } from '../internals/direction'
import { NumberField } from '../number-field'
import { Toggle } from '../toggle'
import { ToggleGroup } from '../toggle-group'

import { useToolbarRootContext } from './root/ToolbarRootContext'

import { Toolbar } from './index'

afterEach(() => {
  cleanup()
})

describe('<Toolbar.Root />', () => {
  describe('ARIA attributes', () => {
    it('has role="toolbar"', () => {
      const { container } = render(() => <Toolbar.Root />)
      expect(container.firstElementChild as HTMLElement).toHaveAttribute(
        'role',
        'toolbar'
      )
    })
  })

  describe('context', () => {
    function OptionalToolbarConsumer() {
      const context = useToolbarRootContext(true)
      return <span>{context?.orientation() ?? 'outside'}</span>
    }

    it('allows optional consumers both outside and inside a toolbar', () => {
      render(() => (
        <div>
          <OptionalToolbarConsumer />
          <Toolbar.Root orientation="vertical">
            <OptionalToolbarConsumer />
          </Toolbar.Root>
        </div>
      ))

      expect(screen.getByText('outside')).toBeVisible()
      expect(screen.getByText('vertical')).toBeVisible()
    })
  })

  describe('keyboard navigation', () => {
    ;[
      ['ltr', 'horizontal', 'ArrowRight', 'ArrowLeft'],
      ['ltr', 'vertical', 'ArrowDown', 'ArrowUp'],
      ['rtl', 'horizontal', 'ArrowLeft', 'ArrowRight'],
      ['rtl', 'vertical', 'ArrowDown', 'ArrowUp'],
    ].forEach(entry => {
      const [direction, orientation, nextKey, prevKey] = entry

      it(`${direction} orientation: ${orientation}`, () => {
        render(() => (
          <DirectionProvider
            direction={direction as 'ltr' | 'rtl'}
          >
            <Toolbar.Root
              dir={direction as 'ltr' | 'rtl'}
              orientation={orientation as 'horizontal' | 'vertical'}
            >
              <Toolbar.Button />
              <Toolbar.Link href="https://base-ui.com">Link</Toolbar.Link>
              <Toolbar.Group>
                <Toolbar.Button />
                <Toolbar.Button />
              </Toolbar.Group>
              <Toolbar.Input defaultValue="" />
            </Toolbar.Root>
          </DirectionProvider>
        ))

        const [button1, groupedButton1, groupedButton2] =
          screen.getAllByRole('button')
        const link = screen.getByText('Link')
        const input = screen.getByRole('textbox')

        button1!.focus()
        expect(button1).toHaveFocus()

        fireEvent.keyDown(button1!, { key: nextKey })
        expect(link).toHaveFocus()

        fireEvent.keyDown(link, { key: nextKey })
        expect(groupedButton1).toHaveFocus()

        fireEvent.keyDown(groupedButton1!, { key: nextKey })
        expect(groupedButton2).toHaveFocus()

        fireEvent.keyDown(groupedButton2!, { key: nextKey })
        expect(input).toHaveFocus()

        fireEvent.keyDown(input, { key: nextKey })
        expect(button1).toHaveFocus()

        fireEvent.keyDown(button1!, { key: prevKey })
        expect(input).toHaveFocus()

        fireEvent.keyDown(input, { key: prevKey })
        expect(groupedButton2).toHaveFocus()
      })
    })

    it('does not wrap focus when loopFocus is false', () => {
      render(() => (
        <Toolbar.Root loopFocus={false}>
          <Toolbar.Button data-testid="first" />
          <Toolbar.Button data-testid="last" />
        </Toolbar.Root>
      ))
      const first = screen.getByTestId('first')
      const last = screen.getByTestId('last')

      first.focus()
      expect(first).toHaveFocus()

      fireEvent.keyDown(first, { key: 'ArrowLeft' })
      expect(first).toHaveFocus()

      fireEvent.keyDown(first, { key: 'ArrowRight' })
      expect(last).toHaveFocus()

      fireEvent.keyDown(last, { key: 'ArrowRight' })
      expect(last).toHaveFocus()
    })
  })

  describe('prop: disabled', () => {
    it('disables all toolbar items except links', () => {
      render(() => (
        <Toolbar.Root disabled>
          <Toolbar.Button />
          <Toolbar.Link href="https://base-ui.com">Link</Toolbar.Link>
          <Toolbar.Input defaultValue="" />
          <Toolbar.Group>
            <Toolbar.Button />
            <Toolbar.Link href="https://base-ui.com">Link</Toolbar.Link>
            <Toolbar.Input defaultValue="" />
          </Toolbar.Group>
        </Toolbar.Root>
      ))

      ;[
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('textbox'),
      ].forEach(toolbarItem => {
        expect(toolbarItem).toHaveAttribute('aria-disabled', 'true')
        expect(toolbarItem).toHaveAttribute('data-disabled')
      })

      expect(screen.getByRole('group')).toHaveAttribute('data-disabled')

      screen.getAllByText('Link').forEach(link => {
        expect(link).not.toHaveAttribute('data-disabled')
        expect(link).not.toHaveAttribute('aria-disabled')
      })
    })
  })

  describe('prop: focusableWhenDisabled', () => {
    function expectFocusedWhenDisabled(element: Element) {
      expect(element).toHaveAttribute('data-disabled')
      expect(element).toHaveAttribute('aria-disabled', 'true')
      expect(element).toHaveFocus()
    }

    it('toolbar items can be focused when disabled by default', () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Button disabled />
          <Toolbar.Group>
            <Toolbar.Button disabled />
            <Toolbar.Button disabled />
          </Toolbar.Group>
          <Toolbar.Input defaultValue="" disabled />
        </Toolbar.Root>
      ))

      const input = screen.getByRole('textbox')
      const buttons = screen.getAllByRole('button')
      ;[input, ...buttons].forEach(item => {
        expect(item).not.toHaveAttribute('disabled')
      })

      const [button1, groupedButton1, groupedButton2] = buttons

      button1!.focus()
      expect(button1).toHaveFocus()

      fireEvent.keyDown(button1!, { key: 'ArrowRight' })
      expectFocusedWhenDisabled(groupedButton1!)

      fireEvent.keyDown(groupedButton1!, { key: 'ArrowRight' })
      expectFocusedWhenDisabled(groupedButton2!)

      fireEvent.keyDown(groupedButton2!, { key: 'ArrowRight' })
      expectFocusedWhenDisabled(input)

      fireEvent.keyDown(input, { key: 'ArrowRight' })
      expect(button1).toHaveAttribute('tabindex', '0')

      fireEvent.keyDown(button1!, { key: 'ArrowLeft' })
      expectFocusedWhenDisabled(input)

      fireEvent.keyDown(input, { key: 'ArrowLeft' })
      expectFocusedWhenDisabled(groupedButton2!)
    })

    it('toolbar items can individually disable focusableWhenDisabled', () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Button disabled />
          <Toolbar.Group>
            <Toolbar.Button disabled />
            <Toolbar.Button disabled focusableWhenDisabled={false} />
          </Toolbar.Group>
          <Toolbar.Input defaultValue="" disabled />
        </Toolbar.Root>
      ))

      const input = screen.getByRole('textbox')
      const buttons = screen.getAllByRole('button')
      const focusableWhenDisabledButtons = buttons.filter(
        button => button.getAttribute('data-focusable') != null
      )
      ;[input, ...focusableWhenDisabledButtons].forEach(item => {
        expect(item).not.toHaveAttribute('disabled')
      })

      const [button1, groupedButton1, groupedButton2] = buttons
      expect(groupedButton2).toHaveAttribute('disabled')

      button1!.focus()
      expect(button1).toHaveFocus()

      fireEvent.keyDown(button1!, { key: 'ArrowRight' })
      expectFocusedWhenDisabled(groupedButton1!)

      fireEvent.keyDown(groupedButton1!, { key: 'ArrowRight' })
      expectFocusedWhenDisabled(input)

      fireEvent.keyDown(input, { key: 'ArrowRight' })
      expect(button1).toHaveAttribute('tabindex', '0')

      fireEvent.keyDown(button1!, { key: 'ArrowLeft' })
      expectFocusedWhenDisabled(input)

      fireEvent.keyDown(input, { key: 'ArrowLeft' })
      expectFocusedWhenDisabled(groupedButton1!)
    })

    it('moves the initial tab stop off a disabled, non-focusable first item', () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Button disabled focusableWhenDisabled={false} />
          <Toolbar.Button />
          <Toolbar.Button />
        </Toolbar.Root>
      ))

      const [button1, button2, button3] = screen.getAllByRole('button')
      expect(button1).toHaveAttribute('disabled')
      expect(button1).not.toHaveAttribute('tabindex', '0')
      expect(button2).toHaveAttribute('tabindex', '0')

      button2!.focus()
      expect(button2).toHaveFocus()

      fireEvent.keyDown(button2!, { key: 'ArrowRight' })
      expect(button3).toHaveFocus()

      fireEvent.keyDown(button3!, { key: 'ArrowRight' })
      expect(button2).toHaveFocus()
    })

    it('keeps an enabled item with focusableWhenDisabled={false} navigable', () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Button />
          <Toolbar.Button focusableWhenDisabled={false} />
          <Toolbar.Button />
        </Toolbar.Root>
      ))

      const [button1, button2, button3] = screen.getAllByRole('button')
      expect(button2).not.toHaveAttribute('disabled')

      button1!.focus()
      expect(button1).toHaveFocus()

      fireEvent.keyDown(button1!, { key: 'ArrowRight' })
      expect(button2).toHaveFocus()

      fireEvent.keyDown(button2!, { key: 'ArrowRight' })
      expect(button3).toHaveFocus()
    })

    it('skips a disabled Toolbar.Input with focusableWhenDisabled={false}', () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Button />
          <Toolbar.Input
            defaultValue=""
            disabled
            focusableWhenDisabled={false}
          />
          <Toolbar.Button />
        </Toolbar.Root>
      ))

      const [button1, button2] = screen.getAllByRole('button')
      const input = screen.getByRole('textbox')

      button1!.focus()
      expect(button1).toHaveFocus()

      fireEvent.keyDown(button1!, { key: 'ArrowRight' })
      expect(input).not.toHaveFocus()
      expect(button2).toHaveFocus()
    })
  })
})

describe('<Toolbar.Group />', () => {
  describe('ARIA attributes', () => {
    it('renders a group', () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Group data-testid="group" />
        </Toolbar.Root>
      ))

      expect(screen.getByTestId('group')).toBe(screen.getByRole('group'))
    })
  })

  describe('prop: disabled', () => {
    it('disables all toolbar items except links in the group', () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Group disabled>
            <Toolbar.Button />
            <Toolbar.Link href="https://base-ui.com">Link</Toolbar.Link>
            <Toolbar.Input defaultValue="" />
          </Toolbar.Group>
        </Toolbar.Root>
      ))

      ;[screen.getByRole('button'), screen.getByRole('textbox')].forEach(
        toolbarItem => {
          expect(toolbarItem).toHaveAttribute('aria-disabled', 'true')
          expect(toolbarItem).toHaveAttribute('data-disabled')
        }
      )

      expect(screen.getByText('Link')).not.toHaveAttribute('data-disabled')
      expect(screen.getByText('Link')).not.toHaveAttribute('aria-disabled')
    })
  })
})

describe('<Toolbar.Button />', () => {
  describe('ARIA attributes', () => {
    it('renders a button', () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Button data-testid="button" />
        </Toolbar.Root>
      ))

      expect(screen.getByTestId('button')).toBe(screen.getByRole('button'))
    })
  })

  describe('prop: nativeButton', () => {
    it('custom element: dispatches real clicks from Space keyboard activation', () => {
      const handleClick = vi.fn()

      render(() => (
        <Toolbar.Root>
          <Toolbar.Button
            nativeButton={false}
            render={(props: Record<string, unknown>) => (
              <span {...props}>Save</span>
            )}
            onClick={handleClick}
          >
            Save
          </Toolbar.Button>
        </Toolbar.Root>
      ))

      const button = screen.getByRole('button', { name: 'Save' })
      button.focus()
      fireEvent.keyDown(button, { key: ' ' })
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('custom element: dispatches real clicks from Enter keyboard activation', () => {
      const handleClick = vi.fn()

      render(() => (
        <Toolbar.Root>
          <Toolbar.Button
            nativeButton={false}
            render={(props: Record<string, unknown>) => (
              <span {...props}>Save</span>
            )}
            onClick={handleClick}
          >
            Save
          </Toolbar.Button>
        </Toolbar.Root>
      ))

      const button = screen.getByRole('button', { name: 'Save' })
      button.focus()
      fireEvent.keyDown(button, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('prop: disabled', () => {
    it('disables the button', () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Button disabled data-testid="button" />
        </Toolbar.Root>
      ))

      const button = screen.getByTestId('button')
      expect(button).not.toHaveAttribute('disabled')
      expect(button).toHaveAttribute('data-disabled')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('uses the disabled attribute when focusableWhenDisabled is false', () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Button disabled focusableWhenDisabled={false} />
        </Toolbar.Root>
      ))

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('disabled')
      expect(button).toHaveAttribute('data-disabled')
      expect(button).not.toHaveAttribute('aria-disabled')
    })

    it('blocks activation while disabled', () => {
      const handleClick = vi.fn()

      render(() => (
        <Toolbar.Root>
          <Toolbar.Button disabled onClick={handleClick} />
        </Toolbar.Root>
      ))

      const button = screen.getByRole('button')
      expect(button).not.toHaveAttribute('disabled')
      expect(button).toHaveAttribute('data-disabled')
      expect(button).toHaveAttribute('aria-disabled', 'true')

      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(0)
    })
  })

  describe('rendering other Base UI components', () => {
    describe('Toggle', () => {
      it('renders a toggle', () => {
        render(() => (
          <Toolbar.Root>
            <Toolbar.Button
              data-testid="button"
              render={(props: Record<string, unknown>) => (
                <Toggle {...props} value="bold" />
              )}
            />
          </Toolbar.Root>
        ))

        expect(screen.getByTestId('button')).toBe(screen.getByRole('button'))
      })
    })

    describe('ToggleGroup', () => {
      it('renders toggles inside a group', () => {
        render(() => (
          <Toolbar.Root>
            <Toolbar.Group>
              <ToggleGroup defaultValue={['bold']}>
                <Toolbar.Button
                  render={(props: Record<string, unknown>) => (
                    <Toggle {...props} value="bold">
                      Bold
                    </Toggle>
                  )}
                />
                <Toolbar.Button
                  render={(props: Record<string, unknown>) => (
                    <Toggle {...props} value="italic">
                      Italic
                    </Toggle>
                  )}
                />
              </ToggleGroup>
            </Toolbar.Group>
          </Toolbar.Root>
        ))

        expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
          'aria-pressed',
          'true'
        )
        expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute(
          'aria-pressed',
          'false'
        )
      })
    })
  })
})

describe('<Toolbar.Link />', () => {
  describe('ARIA attributes', () => {
    it('renders an anchor', () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Link data-testid="link" href="https://base-ui.com" />
        </Toolbar.Root>
      ))

      expect(screen.getByTestId('link')).toBe(screen.getByRole('link'))
    })
  })
})

describe('<Toolbar.Input />', () => {
  describe('ARIA attributes', () => {
    it('renders a textbox', () => {
      render(() => (
        <Toolbar.Root>
          <Toolbar.Input data-testid="input" />
        </Toolbar.Root>
      ))

      expect(screen.getByTestId('input')).toBe(screen.getByRole('textbox'))
    })
  })

  describe('pointer interactions', () => {
    it('does not steal focus while disabled; enabled inputs accept focus', async () => {
      function TestInput() {
        const [disabled, disabledAssign] = createSignal(true)
        return (
          <div>
            <button
              type="button"
              data-testid="toggle"
              onClick={() => disabledAssign(false)}
            >
              enable
            </button>
            <Toolbar.Root>
              <Toolbar.Button data-testid="button" />
              <Toolbar.Input data-testid="input" disabled={disabled()} />
            </Toolbar.Root>
          </div>
        )
      }

      render(() => <TestInput />)
      const button = screen.getByTestId('button')
      const input = screen.getByTestId('input')

      button.focus()
      expect(button).toHaveFocus()

      fireEvent.click(input)
      expect(button).toHaveFocus()

      fireEvent.click(screen.getByTestId('toggle'))
      await flushMicrotasks()
      expect(input).not.toHaveAttribute('aria-disabled')
      input.focus()
      expect(input).toHaveFocus()
    })

    it('prevents click default actions while disabled', () => {
      function TestInput() {
        const [disabled, disabledAssign] = createSignal(true)
        return (
          <div>
            <button
              type="button"
              data-testid="toggle"
              onClick={() => disabledAssign(false)}
            >
              enable
            </button>
            <Toolbar.Root>
              <Toolbar.Input type="checkbox" disabled={disabled()} />
            </Toolbar.Root>
          </div>
        )
      }

      render(() => <TestInput />)
      const input = screen.getByRole('checkbox')

      fireEvent.click(input)
      expect(input).not.toBeChecked()

      fireEvent.click(screen.getByTestId('toggle'))
      fireEvent.click(input)
      expect(input).toBeChecked()
    })
  })

  describe('rendering NumberField', () => {
    it('renders NumberField.Input', () => {
      render(() => (
        <Toolbar.Root>
          <NumberField.Root>
            <NumberField.Group>
              <Toolbar.Input
                render={(props: Record<string, unknown>) => (
                  <NumberField.Input {...props} />
                )}
              />
            </NumberField.Group>
          </NumberField.Root>
        </Toolbar.Root>
      ))

      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-roledescription',
        'Number field'
      )
    })
  })
})

describe('<Toolbar.Separator />', () => {
  it.each([
    ['horizontal', 'vertical'],
    ['vertical', 'horizontal'],
  ] as const)(
    'uses a %s separator in a %s toolbar',
    (separatorOrientation, toolbarOrientation) => {
      render(() => (
        <Toolbar.Root orientation={toolbarOrientation}>
          <Toolbar.Separator />
        </Toolbar.Root>
      ))

      expect(screen.getByRole('separator')).toHaveAttribute(
        'aria-orientation',
        separatorOrientation
      )
    }
  )

  it('allows its orientation to be overridden', () => {
    render(() => (
      <Toolbar.Root orientation="horizontal">
        <Toolbar.Separator orientation="horizontal" />
      </Toolbar.Root>
    ))

    expect(screen.getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'horizontal'
    )
  })

  it('throws a descriptive error when rendered outside Toolbar.Root', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(() => <Toolbar.Separator />)).toThrow(
      'Base UI: ToolbarRootContext is missing. Toolbar parts must be placed within <Toolbar.Root>.'
    )

    errorSpy.mockRestore()
  })
})
