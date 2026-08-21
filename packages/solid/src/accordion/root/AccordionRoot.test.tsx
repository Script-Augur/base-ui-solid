/**
 * Port of `@base-ui/react` Accordion root tests (v1.7.0).
 * Skips documented in `../UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { REASONS } from '../../internals/createChangeEventDetails'
import { Accordion } from '../index'

import type { BaseUIEvent } from '../../internals/makeEventPreventable'

const PANEL_CONTENT_1 = 'Panel contents 1'
const PANEL_CONTENT_2 = 'Panel contents 2'

afterEach(() => {
  cleanup()
})

describe('<Accordion.Root />', () => {
  it('warns when hiddenUntilFound overrides keepMounted={false}', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      render(() => (
        <Accordion.Root hiddenUntilFound keepMounted={false}>
          <Accordion.Item>
            <Accordion.Panel>Panel</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      expect(warnSpy).toHaveBeenCalledWith(
        'Base UI: The `keepMounted={false}` prop on `Accordion.Root` is ignored when `hiddenUntilFound` is enabled, since panels must remain mounted while closed.'
      )
      expect(screen.getByText('Panel').getAttribute('hidden')).toBe(
        'until-found'
      )
    } finally {
      warnSpy.mockRestore()
    }
  })

  describe('ARIA attributes', () => {
    it('renders correct ARIA attributes', () => {
      render(() => (
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const trigger = screen.getByRole('button')
      const panel = screen.getByText(PANEL_CONTENT_1)

      expect(trigger).toHaveAttribute('aria-controls')
      expect(panel.getAttribute('id')).toBe(
        trigger.getAttribute('aria-controls')
      )
      expect(panel).toHaveAttribute('role', 'region')
      expect(trigger.getAttribute('id')).toBe(
        panel.getAttribute('aria-labelledby')
      )
    })

    it('references manual panel id in trigger aria-controls', () => {
      render(() => (
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel id="custom-panel-id">
              {PANEL_CONTENT_1}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const trigger = screen.getByRole('button')
      const panel = screen.getByText(PANEL_CONTENT_1)

      expect(trigger).toHaveAttribute('aria-controls', 'custom-panel-id')
      expect(panel).toHaveAttribute('id', 'custom-panel-id')
    })

    it('references manual trigger id in panel aria-labelledby', () => {
      render(() => (
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger id="custom-trigger-id">
                Trigger 1
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      expect(screen.getByText(PANEL_CONTENT_1)).toHaveAttribute(
        'aria-labelledby',
        'custom-trigger-id'
      )
    })

    it('updates panel labeling when a manual trigger id is added or changed', () => {
      function App() {
        const [triggerId, triggerIdAssign] = createSignal<string | undefined>()

        return (
          <>
            <button
              type="button"
              onClick={() => triggerIdAssign('custom-trigger-id-1')}
            >
              Set id 1
            </button>
            <button
              type="button"
              onClick={() => triggerIdAssign('custom-trigger-id-2')}
            >
              Set id 2
            </button>
            <Accordion.Root defaultValue={[0]}>
              <Accordion.Item value={0}>
                <Accordion.Header>
                  <Accordion.Trigger id={triggerId()}>
                    Trigger 1
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
          </>
        )
      }

      render(() => <App />)

      const trigger = screen.getByRole('button', { name: 'Trigger 1' })
      const panel = screen.getByText(PANEL_CONTENT_1)

      expect(trigger).toHaveAttribute('id')
      expect(panel).toHaveAttribute('aria-labelledby', trigger.id)

      fireEvent.click(screen.getByRole('button', { name: 'Set id 1' }))
      expect(trigger).toHaveAttribute('id', 'custom-trigger-id-1')
      expect(panel).toHaveAttribute('aria-labelledby', 'custom-trigger-id-1')

      fireEvent.click(screen.getByRole('button', { name: 'Set id 2' }))
      expect(trigger).toHaveAttribute('id', 'custom-trigger-id-2')
      expect(panel).toHaveAttribute('aria-labelledby', 'custom-trigger-id-2')
    })

    it('restores panel labeling when a manual trigger id is removed', () => {
      function App() {
        const [triggerId, triggerIdAssign] = createSignal<string | undefined>(
          'custom-trigger-id'
        )

        return (
          <>
            <button type="button" onClick={() => triggerIdAssign(undefined)}>
              Remove id
            </button>
            <Accordion.Root defaultValue={[0]}>
              <Accordion.Item value={0}>
                <Accordion.Header>
                  <Accordion.Trigger id={triggerId()}>
                    Trigger 1
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
          </>
        )
      }

      render(() => <App />)

      const trigger = screen.getByRole('button', { name: 'Trigger 1' })
      const panel = screen.getByText(PANEL_CONTENT_1)

      expect(panel).toHaveAttribute('aria-labelledby', 'custom-trigger-id')

      fireEvent.click(screen.getByRole('button', { name: 'Remove id' }))

      expect(trigger).toHaveAttribute('id')
      expect(trigger).not.toHaveAttribute('id', 'custom-trigger-id')
      expect(panel).toHaveAttribute('aria-labelledby', trigger.id)
    })

    it('unregisters generated part ids when the trigger or panel unmounts', () => {
      function App() {
        const [parts, partsAssign] = createSignal<'both' | 'trigger' | 'panel'>(
          'both'
        )

        return (
          <>
            <button type="button" onClick={() => partsAssign('panel')}>
              panel only
            </button>
            <button type="button" onClick={() => partsAssign('both')}>
              both
            </button>
            <button type="button" onClick={() => partsAssign('trigger')}>
              trigger only
            </button>
            <Accordion.Root defaultValue={[0]}>
              <Accordion.Item value={0}>
                <Accordion.Header>
                  <Show when={parts() !== 'panel'}>
                    <Accordion.Trigger>Trigger 1</Accordion.Trigger>
                  </Show>
                </Accordion.Header>
                <Show when={parts() !== 'trigger'}>
                  <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
                </Show>
              </Accordion.Item>
            </Accordion.Root>
          </>
        )
      }

      render(() => <App />)

      fireEvent.click(screen.getByRole('button', { name: 'panel only' }))
      expect(screen.getByText(PANEL_CONTENT_1)).not.toHaveAttribute(
        'aria-labelledby'
      )

      fireEvent.click(screen.getByRole('button', { name: 'both' }))
      let trigger = screen.getByRole('button', { name: 'Trigger 1' })
      let panel = screen.getByText(PANEL_CONTENT_1)
      expect(panel).toHaveAttribute('aria-labelledby', trigger.id)

      fireEvent.click(screen.getByRole('button', { name: 'trigger only' }))
      expect(
        screen.getByRole('button', { name: 'Trigger 1' })
      ).not.toHaveAttribute('aria-controls')

      fireEvent.click(screen.getByRole('button', { name: 'both' }))
      trigger = screen.getByRole('button', { name: 'Trigger 1' })
      panel = screen.getByText(PANEL_CONTENT_1)
      expect(trigger).toHaveAttribute('aria-controls', panel.id)
    })
  })

  describe('uncontrolled', () => {
    it('open state', () => {
      render(() => (
        <Accordion.Root>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const trigger = screen.getByRole('button')

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)

      fireEvent.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(trigger).toHaveAttribute('data-panel-open')
      expect(screen.getByText(PANEL_CONTENT_1)).toBeVisible()
      expect(screen.getByText(PANEL_CONTENT_1)).toHaveAttribute('data-open')

      fireEvent.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
    })

    describe('prop: defaultValue', () => {
      it('custom item value', () => {
        render(() => (
          <Accordion.Root defaultValue={['first']}>
            <Accordion.Item value="first">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="second">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>
        ))

        expect(screen.getByText(PANEL_CONTENT_1)).toBeVisible()
        expect(screen.getByText(PANEL_CONTENT_1)).toHaveAttribute('data-open')
        expect(screen.queryByText(PANEL_CONTENT_2)).toBe(null)
      })
    })
  })

  describe('controlled', () => {
    it('open state', () => {
      function App() {
        const [value, valueAssign] = createSignal<Array<number>>([])
        return (
          <>
            <Accordion.Root value={value()}>
              <Accordion.Item value={0}>
                <Accordion.Header>
                  <Accordion.Trigger>Trigger 1</Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
            <button type="button" onClick={() => valueAssign([0])}>
              set open
            </button>
            <button type="button" onClick={() => valueAssign([])}>
              set closed
            </button>
          </>
        )
      }

      render(() => <App />)

      const trigger = screen.getByRole('button', { name: 'Trigger 1' })

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)

      fireEvent.click(screen.getByRole('button', { name: 'set open' }))

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(trigger).toHaveAttribute('data-panel-open')
      expect(screen.getByText(PANEL_CONTENT_1)).toBeVisible()
      expect(screen.getByText(PANEL_CONTENT_1)).toHaveAttribute('data-open')

      fireEvent.click(screen.getByRole('button', { name: 'set closed' }))

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
    })

    describe('prop: value', () => {
      it('custom item value', () => {
        render(() => (
          <Accordion.Root value={['one']}>
            <Accordion.Item value="one">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="second">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>
        ))

        expect(screen.getByText(PANEL_CONTENT_1)).toBeVisible()
        expect(screen.getByText(PANEL_CONTENT_1)).toHaveAttribute('data-open')
        expect(screen.queryByText(PANEL_CONTENT_2)).toBe(null)
      })
    })
  })

  describe('prop: disabled', () => {
    it('can disable the whole accordion', () => {
      render(() => (
        <Accordion.Root defaultValue={[0]} disabled>
          <Accordion.Item data-testid="item1" value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item data-testid="item2" value={1}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const item1 = screen.getByTestId('item1')
      const panel1 = screen.getByText(PANEL_CONTENT_1)
      const [header1, header2] = screen.getAllByRole('heading')
      const [trigger1, trigger2] = screen.getAllByRole('button')
      const item2 = screen.getByTestId('item2')

      for (const element of [
        item1,
        header1,
        trigger1,
        panel1,
        item2,
        header2,
        trigger2,
      ]) {
        expect(element).toHaveAttribute('data-disabled')
      }
    })

    it('can disable one accordion item', () => {
      render(() => (
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item data-testid="item1" value={0} disabled>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item data-testid="item2" value={1}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const item1 = screen.getByTestId('item1')
      const panel1 = screen.getByText(PANEL_CONTENT_1)
      const [header1, header2] = screen.getAllByRole('heading')
      const [trigger1, trigger2] = screen.getAllByRole('button')
      const item2 = screen.getByTestId('item2')

      for (const element of [item1, header1, trigger1, panel1]) {
        expect(element).toHaveAttribute('data-disabled')
      }
      for (const element of [item2, header2, trigger2]) {
        expect(element).not.toHaveAttribute('data-disabled')
      }
    })

    it.each(['root', 'item'] as const)(
      'does not toggle or fire callbacks when the %s is disabled',
      disabledPart => {
        const onValueChange = vi.fn()
        const onOpenChange = vi.fn()

        render(() => (
          <Accordion.Root
            disabled={disabledPart === 'root'}
            onValueChange={onValueChange}
          >
            <Accordion.Item
              value={0}
              disabled={disabledPart === 'item'}
              onOpenChange={onOpenChange}
            >
              <Accordion.Header>
                <Accordion.Trigger disabled={false}>
                  Trigger 1
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value={1} onOpenChange={onOpenChange}>
              <Accordion.Header>
                <Accordion.Trigger disabled={false}>
                  Trigger 2
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>
        ))

        const triggers = screen.getAllByRole('button')
        const trigger1 = triggers[0]!

        fireEvent.click(trigger1)
        trigger1.focus()
        fireEvent.keyDown(trigger1, { key: ' ' })
        fireEvent.keyUp(trigger1, { key: ' ' })
        fireEvent.keyDown(trigger1, { key: 'Enter' })

        expect(trigger1).toHaveAttribute('aria-expanded', 'false')
        expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
        expect(onValueChange).not.toHaveBeenCalled()
        expect(onOpenChange).not.toHaveBeenCalled()
      }
    )
  })

  it('allows onMouseUp to call preventBaseUIHandler on the trigger', () => {
    render(() => (
      <Accordion.Root>
        <Accordion.Item value={0}>
          <Accordion.Header>
            <Accordion.Trigger
              onMouseUp={(event: MouseEvent) => {
                ;(event as BaseUIEvent<MouseEvent>).preventBaseUIHandler()
              }}
            >
              Trigger 1
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ))

    const trigger = screen.getByRole('button', { name: 'Trigger 1' })
    expect(() => fireEvent.mouseUp(trigger)).not.toThrow()
  })

  describe('keyboard interactions', () => {
    describe.each([true, false])(
      'rendering %s nativeButton triggers',
      isNativeButton => {
        it.each(['Enter', ' '] as const)(
          'key: %s toggles the Accordion open state',
          key => {
            render(() => (
              <Accordion.Root>
                <Accordion.Item>
                  <Accordion.Header>
                    <Accordion.Trigger
                      nativeButton={isNativeButton}
                      render={
                        isNativeButton
                          ? undefined
                          : (props: Record<string, unknown>) => (
                              <span {...props} />
                            )
                      }
                    >
                      Trigger 1
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
                </Accordion.Item>
              </Accordion.Root>
            ))

            const trigger = screen.getByRole('button')

            expect(trigger).toHaveAttribute('aria-expanded', 'false')
            expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)

            trigger.focus()
            expect(trigger).toHaveFocus()

            if (isNativeButton) {
              // Native buttons rely on the host click from activation; jsdom
              // does not always synthesize that from keyboard, so click covers
              // the open path and mirrors pointer activation.
              fireEvent.click(trigger)
            } else if (key === 'Enter') {
              fireEvent.keyDown(trigger, { key: 'Enter' })
            } else {
              fireEvent.keyDown(trigger, { key: ' ' })
              fireEvent.keyUp(trigger, { key: ' ' })
            }

            expect(trigger).toHaveAttribute('aria-expanded', 'true')
            expect(trigger).toHaveAttribute('data-panel-open')
            expect(screen.getByText(PANEL_CONTENT_1)).toBeVisible()
            expect(screen.getByText(PANEL_CONTENT_1)).toHaveAttribute(
              'data-open'
            )

            if (isNativeButton) {
              fireEvent.click(trigger)
            } else if (key === 'Enter') {
              fireEvent.keyDown(trigger, { key: 'Enter' })
            } else {
              fireEvent.keyDown(trigger, { key: ' ' })
              fireEvent.keyUp(trigger, { key: ' ' })
            }

            expect(trigger).toHaveAttribute('aria-expanded', 'false')
            expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
          }
        )
      }
    )
  })

  describe('keyboard activation timing', () => {
    describe.each([true, false])(
      'Space keyup when rendering nativeButton=%s',
      isNativeButton => {
        it('opens and closes on Space keyup', () => {
          const onOpenChange = vi.fn()

          render(() => (
            <Accordion.Root>
              <Accordion.Item onOpenChange={onOpenChange}>
                <Accordion.Header>
                  <Accordion.Trigger
                    nativeButton={isNativeButton}
                    render={
                      isNativeButton
                        ? undefined
                        : (props: Record<string, unknown>) => (
                            <span {...props} />
                          )
                    }
                  >
                    Trigger 1
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
          ))

          const trigger = screen.getByRole('button')
          trigger.focus()
          expect(trigger).toHaveFocus()

          fireEvent.keyDown(trigger, { key: ' ' })
          expect(trigger).toHaveAttribute('aria-expanded', 'false')
          expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
          expect(onOpenChange).not.toHaveBeenCalled()

          if (isNativeButton) {
            // jsdom: synthesize the click that browsers fire on Space keyup
            fireEvent.keyUp(trigger, { key: ' ' })
            fireEvent.click(trigger)
          } else {
            fireEvent.keyUp(trigger, { key: ' ' })
          }

          expect(trigger).toHaveAttribute('aria-expanded', 'true')
          expect(screen.getByText(PANEL_CONTENT_1)).toBeInTheDocument()
          expect(onOpenChange).toHaveBeenCalledTimes(1)
          expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything())

          fireEvent.keyDown(trigger, { key: ' ' })
          expect(trigger).toHaveAttribute('aria-expanded', 'true')
          expect(screen.getByText(PANEL_CONTENT_1)).toBeInTheDocument()
          expect(onOpenChange).toHaveBeenCalledTimes(1)

          if (isNativeButton) {
            fireEvent.keyUp(trigger, { key: ' ' })
            fireEvent.click(trigger)
          } else {
            fireEvent.keyUp(trigger, { key: ' ' })
          }

          expect(trigger).toHaveAttribute('aria-expanded', 'false')
          expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
          expect(onOpenChange).toHaveBeenCalledTimes(2)
          expect(onOpenChange).toHaveBeenLastCalledWith(
            false,
            expect.anything()
          )
        })
      }
    )
  })

  describe('BaseUIChangeEventDetails', () => {
    it('onOpenChange cancel() prevents opening while uncontrolled', () => {
      const onValueChange = vi.fn()

      render(() => (
        <Accordion.Root onValueChange={onValueChange}>
          <Accordion.Item
            value={0}
            onOpenChange={(nextOpen, eventDetails) => {
              if (nextOpen) {
                eventDetails.cancel()
              }
            }}
          >
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
      expect(onValueChange).not.toHaveBeenCalled()
    })

    it('onValueChange cancel() prevents opening while uncontrolled', () => {
      const onValueChange = vi.fn(
        (
          _value: Array<string | number>,
          eventDetails: { cancel: () => void }
        ) => {
          eventDetails.cancel()
        }
      )

      render(() => (
        <Accordion.Root onValueChange={onValueChange}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
      expect(onValueChange).toHaveBeenCalledTimes(1)
    })

    it('onValueChange cancel() prevents closing while uncontrolled', () => {
      const onValueChange = vi.fn(
        (
          _value: Array<string | number>,
          eventDetails: { cancel: () => void }
        ) => {
          eventDetails.cancel()
        }
      )

      render(() => (
        <Accordion.Root defaultValue={[0]} onValueChange={onValueChange}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText(PANEL_CONTENT_1)).toHaveAttribute('data-open')
      expect(onValueChange).toHaveBeenCalledOnce()
      expect(onValueChange.mock.lastCall?.[0]).toEqual([])
    })

    it('onOpenChange cancel() prevents onValueChange while controlled', () => {
      const onValueChange = vi.fn()

      render(() => (
        <Accordion.Root value={[]} onValueChange={onValueChange}>
          <Accordion.Item
            value={0}
            onOpenChange={(nextOpen, eventDetails) => {
              if (nextOpen) {
                eventDetails.cancel()
              }
            }}
          >
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
      expect(onValueChange).not.toHaveBeenCalled()
    })

    it('onValueChange cancel() prevents opening while controlled', () => {
      const onValueChange = vi.fn()

      function App() {
        const [value, valueAssign] = createSignal<Array<number>>([])

        return (
          <Accordion.Root
            value={value()}
            onValueChange={(nextValue, eventDetails) => {
              onValueChange(nextValue, eventDetails)
              eventDetails.cancel()
              if (!eventDetails.isCanceled) {
                valueAssign(nextValue as Array<number>)
              }
            }}
          >
            <Accordion.Item value={0}>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>
        )
      }

      render(() => <App />)

      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
      expect(onValueChange).toHaveBeenCalledTimes(1)
    })

    it('onValueChange cancel() prevents opening while multiple', () => {
      const onValueChange = vi.fn(
        (
          _value: Array<string | number>,
          eventDetails: { cancel: () => void }
        ) => {
          eventDetails.cancel()
        }
      )

      render(() => (
        <Accordion.Root multiple onValueChange={onValueChange}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
      expect(onValueChange).toHaveBeenCalledTimes(1)
    })

    it('onValueChange cancel() prevents closing while multiple', () => {
      const onValueChange = vi.fn(
        (
          _value: Array<string | number>,
          eventDetails: { cancel: () => void }
        ) => {
          eventDetails.cancel()
        }
      )

      render(() => (
        <Accordion.Root
          defaultValue={[0]}
          multiple
          onValueChange={onValueChange}
        >
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(screen.queryByText(PANEL_CONTENT_1)).not.toBe(null)
      expect(onValueChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('prop: multiple', () => {
    it('multiple items can be open when `multiple = true`', () => {
      render(() => (
        <Accordion.Root multiple>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const triggers = screen.getAllByRole('button')
      const trigger1 = triggers[0]!
      const trigger2 = triggers[1]!

      expect(trigger1).not.toHaveAttribute('data-panel-open')
      expect(trigger2).not.toHaveAttribute('data-panel-open')
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
      expect(screen.queryByText(PANEL_CONTENT_2)).toBe(null)

      fireEvent.click(trigger1)
      fireEvent.click(trigger2)

      expect(screen.getByText(PANEL_CONTENT_1)).toHaveAttribute('data-open')
      expect(screen.getByText(PANEL_CONTENT_2)).toHaveAttribute('data-open')
      expect(trigger1).toHaveAttribute('data-panel-open')
      expect(trigger2).toHaveAttribute('data-panel-open')

      fireEvent.click(trigger1)

      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
      expect(screen.getByText(PANEL_CONTENT_2)).toHaveAttribute('data-open')
      expect(trigger1).not.toHaveAttribute('data-panel-open')
      expect(trigger2).toHaveAttribute('data-panel-open')
    })

    it('when false only one item can be open', () => {
      render(() => (
        <Accordion.Root multiple={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const triggers = screen.getAllByRole('button')
      const trigger1 = triggers[0]!
      const trigger2 = triggers[1]!

      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
      expect(screen.queryByText(PANEL_CONTENT_2)).toBe(null)

      fireEvent.click(trigger1)
      expect(screen.getByText(PANEL_CONTENT_1)).toHaveAttribute('data-open')
      expect(trigger1).toHaveAttribute('data-panel-open')

      fireEvent.click(trigger2)
      expect(screen.getByText(PANEL_CONTENT_2)).toHaveAttribute('data-open')
      expect(trigger2).toHaveAttribute('data-panel-open')
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null)
      expect(trigger1).not.toHaveAttribute('data-panel-open')
    })
  })

  describe('prop: onValueChange', () => {
    it('default item value', () => {
      const onValueChange = vi.fn()

      render(() => (
        <Accordion.Root onValueChange={onValueChange} multiple>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value={1}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const triggers = screen.getAllByRole('button')
      const trigger1 = triggers[0]!
      const trigger2 = triggers[1]!

      expect(onValueChange).not.toHaveBeenCalled()

      fireEvent.click(trigger1)

      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect(onValueChange.mock.lastCall?.[0]).toEqual([0])
      expect(onValueChange.mock.lastCall?.[1].reason).toBe(REASONS.triggerPress)

      fireEvent.click(trigger2)

      expect(onValueChange).toHaveBeenCalledTimes(2)
      expect(onValueChange.mock.lastCall?.[0]).toEqual([0, 1])
      expect(onValueChange.mock.lastCall?.[1].reason).toBe(REASONS.triggerPress)
    })

    it('custom item value', () => {
      const onValueChange = vi.fn()

      render(() => (
        <Accordion.Root onValueChange={onValueChange} multiple>
          <Accordion.Item value="one">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="two">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const triggers = screen.getAllByRole('button')
      const trigger1 = triggers[0]!
      const trigger2 = triggers[1]!

      fireEvent.click(trigger2)
      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect(onValueChange.mock.calls[0]![0]).toEqual(['two'])

      fireEvent.click(trigger1)
      expect(onValueChange).toHaveBeenCalledTimes(2)
      expect(onValueChange.mock.calls[1]![0]).toEqual(['two', 'one'])
    })

    it('`multiple` is false', () => {
      const onValueChange = vi.fn()

      render(() => (
        <Accordion.Root onValueChange={onValueChange} multiple={false}>
          <Accordion.Item value="one">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="two">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))

      const triggers = screen.getAllByRole('button')
      const trigger1 = triggers[0]!
      const trigger2 = triggers[1]!

      fireEvent.click(trigger1)
      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect(onValueChange.mock.calls[0]![0]).toEqual(['one'])

      fireEvent.click(trigger2)
      expect(onValueChange).toHaveBeenCalledTimes(2)
      expect(onValueChange.mock.calls[1]![0]).toEqual(['two'])
    })
  })
})
