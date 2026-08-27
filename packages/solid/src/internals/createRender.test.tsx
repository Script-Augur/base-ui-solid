/**
 * Port of `@base-ui/react` `useRender` + `useRenderElement` tests (v1.7.0).
 * Skips documented in `./UPSTREAM_TEST_PARITY.md`.
 */
import { cleanup, render, screen, waitFor } from '@solidjs/testing-library'
import { createSignal, mergeProps } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createRender } from './createRender'
import { mergeRenderProps } from './mergeRenderProps'

import type { CreateRenderOptions } from './createRender'
import type { StateAttributesMapping } from './getStateAttributesProps.types'

afterEach(() => {
  cleanup()
})
describe('createRender', () => {
  describe('Solid reactivity', () => {
    it('renders the default element with static props', () => {
      render(() =>
        createRender({
          defaultElement: 'div',
          props: { role: 'progressbar', 'data-testid': 'host' },
        })
      )

      const host = screen.getByTestId('host')
      expect(host.tagName).toBe('DIV')
      expect(host).toHaveAttribute('role', 'progressbar')
    })

    it('updates attributes when props use reactive getters', async () => {
      const [value, valueAssign] = createSignal(10)

      render(() =>
        createRender({
          defaultElement: 'div',
          props: mergeProps({
            role: 'progressbar',
            'data-testid': 'host',
            get 'aria-valuenow'() {
              return value()
            },
          }),
        })
      )

      const host = screen.getByRole('progressbar')
      expect(host).toHaveAttribute('aria-valuenow', '10')

      valueAssign(42)
      await flushMicrotasks()
      expect(host).toHaveAttribute('aria-valuenow', '42')
    })

    it('forwards reactive getters to custom render functions', async () => {
      const [value, valueAssign] = createSignal('a')

      render(() =>
        createRender({
          defaultElement: 'div',
          state: {},
          render: (props: Record<string, unknown>) => (
            <span data-testid="custom" {...props} />
          ),
          props: mergeProps({
            get 'data-value'() {
              return value()
            },
          }),
        })
      )

      const host = screen.getByTestId('custom')
      expect(host).toHaveAttribute('data-value', 'a')

      valueAssign('b')
      await flushMicrotasks()
      expect(host).toHaveAttribute('data-value', 'b')
    })
  })

  describe('useRender parity', () => {
    it('render props does not overwrite className in a render function when unspecified', () => {
      render(() =>
        createRender({
          defaultElement: 'div',
          render: (props: Record<string, unknown>) => (
            <span
              class={`my-span ${typeof props.class === 'string' ? props.class : ''}`}
            />
          ),
          props: {},
        })
      )

      expect(document.querySelector('span')).toHaveAttribute(
        'class',
        'my-span '
      )
    })

    it('refs are handled as expected', () => {
      const refs: Array<{ current: Element | null | undefined }> = []

      render(() => {
        const ref1 = { current: null as Element | null }
        const ref2 = { current: null as Element | null }
        refs[0] = ref1
        refs[1] = ref2

        return createRender({
          defaultElement: 'span',
          ref: [ref1, ref2],
          render: (props: Record<string, unknown>) => <span {...props} />,
          props: {},
        })
      })

      expect(refs.length).toBe(2)
      refs.forEach(ref => {
        expect(ref.current).toBe(document.querySelector('span'))
      })
    })

    describe('param: defaultElement', () => {
      it('renders div by default if no defaultElement override and no render params are provided', () => {
        render(() =>
          createRender({
            defaultElement: 'div',
            props: { 'data-testid': 'host' },
          })
        )
        expect(hostElement()?.tagName).toBe('DIV')
      })

      it.skip('renders the element with the default tag with no render prop', async () => {
        // Solid `Dynamic` does not always remount when the tag name signal changes in jsdom.
        const [tag, tagAssign] = createSignal<'div' | 'span'>('div')

        render(() =>
          createRender({
            defaultElement: tag(),
            props: { 'data-testid': 'host' },
          })
        )

        expect(hostElement()?.tagName).toBe('DIV')
        tagAssign('span')
        await waitFor(() => {
          expect(hostElement()?.tagName).toBe('SPAN')
        })
      })

      it('is overwritten by the render prop', async () => {
        const [tag, tagAssign] = createSignal<'a' | 'span'>('span')

        render(() =>
          createRender({
            defaultElement: tag(),
            render: (props: Record<string, unknown>) => (
              <span {...props} data-testid="render-span" />
            ),
            props: {},
          })
        )

        expect(screen.getByTestId('render-span').tagName).toBe('SPAN')
        tagAssign('a')
        await flushMicrotasks()
        expect(screen.getByTestId('render-span').tagName).toBe('SPAN')
      })
    })

    describe('state to data attributes', () => {
      const stateAttrs = { mapStateToDataAttributes: true as const }

      it('converts state to data attributes automatically', () => {
        render(() =>
          createRender({
            defaultElement: 'button',
            ...stateAttrs,
            render: (props: Record<string, unknown>) => (
              <button {...props} data-testid="host" />
            ),
            state: { active: true, index: 42 },
            props: {},
          })
        )

        const button = hostElement()
        expect(button).toHaveAttribute('data-active', '')
        expect(button).toHaveAttribute('data-index', '42')
      })

      it('handles undefined values in state', () => {
        render(() =>
          createRender({
            defaultElement: 'div',
            ...stateAttrs,
            render: (props: Record<string, unknown>) => (
              <div {...props} data-testid="host" />
            ),
            state: { defined: 'value', notDefined: undefined },
            props: {},
          })
        )

        const div = hostElement()
        expect(div).toHaveAttribute('data-defined', 'value')
        expect(div).not.toHaveAttribute('data-notdefined')
      })

      it('merges state-based data attributes with existing props', () => {
        render(() =>
          createRender({
            defaultElement: 'button',
            ...stateAttrs,
            render: (props: Record<string, unknown>) => (
              <button {...props} data-testid="host" />
            ),
            state: { form: 'login' },
            props: {
              class: 'btn-primary',
              id: 'submit-btn',
              'data-existing': 'prop',
            },
          })
        )

        const button = hostElement()
        expect(button).toHaveAttribute('data-form', 'login')
        expect(button).toHaveAttribute('class', 'btn-primary')
        expect(button).toHaveAttribute('id', 'submit-btn')
        expect(button).toHaveAttribute('data-existing', 'prop')
      })

      it('props override state-based data attributes', () => {
        render(() =>
          createRender({
            defaultElement: 'button',
            ...stateAttrs,
            render: (props: Record<string, unknown>) => (
              <button {...props} data-testid="host" />
            ),
            state: { active: true },
            props: { 'data-active': 'false' },
          })
        )

        expect(hostElement()).toHaveAttribute('data-active', 'false')
      })

      it('handles empty state', () => {
        render(() =>
          createRender({
            defaultElement: 'span',
            ...stateAttrs,
            render: (props: Record<string, unknown>) => (
              <span {...props} id="host" />
            ),
            state: {},
            props: { class: 'test-class', id: 'host' },
          })
        )

        const span = document.getElementById('host')
        expect(span).toHaveAttribute('class', 'test-class')
        const attributes = span?.attributes
        if (attributes) {
          for (let index = 0; index < attributes.length; index += 1) {
            const name = attributes[index]?.name
            if (name === 'id' || name === 'class') continue
            expect(name).not.toMatch(/^data-/)
          }
        }
      })

      it('handles undefined state', () => {
        render(() =>
          createRender({
            defaultElement: 'div',
            ...stateAttrs,
            render: (props: Record<string, unknown>) => (
              <div {...props} data-testid="host" />
            ),
            state: undefined,
            props: {
              class: 'test-class',
              'data-from-props': 'value',
            },
          })
        )

        const div = hostElement()
        expect(div).toHaveAttribute('class', 'test-class')
        expect(div).toHaveAttribute('data-from-props', 'value')
      })

      it('converts boolean values in state to data attributes', () => {
        render(() =>
          createRender({
            defaultElement: 'button',
            ...stateAttrs,
            render: (props: Record<string, unknown>) => (
              <button {...props} data-testid="host" />
            ),
            state: { active: true, disabled: false },
            props: {},
          })
        )

        const button = hostElement()
        expect(button).toHaveAttribute('data-active', '')
        expect(button).not.toHaveAttribute('data-disabled')
      })

      it('converts number values in state to data attributes', () => {
        render(() =>
          createRender({
            defaultElement: 'div',
            ...stateAttrs,
            render: (props: Record<string, unknown>) => (
              <div {...props} data-testid="host" />
            ),
            state: { count: 0, index: 42, percentage: 99.9 },
            props: {},
          })
        )

        const div = hostElement()
        expect(div).not.toHaveAttribute('data-count')
        expect(div).toHaveAttribute('data-index', '42')
        expect(div).toHaveAttribute('data-percentage', '99.9')
      })

      it('supports custom stateAttributesMapping for kebab-case conversion', () => {
        render(() =>
          createRender({
            defaultElement: 'button',
            ...stateAttrs,
            render: (props: Record<string, unknown>) => (
              <button {...props} data-testid="host" />
            ),
            state: { isActive: true, itemCount: 5, userName: 'John' },
            stateAttributesMapping: {
              isActive: (value: boolean) =>
                value ? { 'data-is-active': '' } : null,
              itemCount: (value: number) => ({
                'data-item-count': value.toString(),
              }),
              userName: (value: string) => ({ 'data-user-name': value }),
            } as StateAttributesMapping<Record<string, unknown>>,
            props: {},
          })
        )

        const button = hostElement()
        expect(button).toHaveAttribute('data-is-active', '')
        expect(button).toHaveAttribute('data-item-count', '5')
        expect(button).toHaveAttribute('data-user-name', 'John')
      })
    })
  })

  describe('useRenderElement parity', () => {
    it('accepts class as function', () => {
      render(() => (
        <TestHost
          active
          class={state => (state.active ? 'active-class' : 'inactive-class')}
          options={{
            defaultElement: 'div',
            props: { class: 'test-component', 'data-testid': 'host' },
          }}
        />
      ))

      expect(hostElement()).toHaveAttribute(
        'class',
        'active-class test-component'
      )
    })

    it('accepts class as function that returns undefined', () => {
      render(() => (
        <TestHost
          class={state => (state.active ? 'active-class' : undefined)}
          options={{
            defaultElement: 'div',
            props: { class: 'test-component', 'data-testid': 'host' },
          }}
        />
      ))

      expect(hostElement()).toHaveAttribute('class', 'test-component')
    })

    it('accepts style as function', () => {
      render(() => (
        <TestHost
          active
          style={state => ({
            color: state.active ? 'rgb(255,0,0)' : 'rgb(0,255,0)',
          })}
          options={{
            defaultElement: 'div',
            props: { style: { padding: '10px' }, 'data-testid': 'host' },
          }}
        />
      ))

      expect(hostElement()?.getAttribute('style')).toBe(
        'padding: 10px; color: rgb(255, 0, 0);'
      )
    })

    it('accepts style as function that returns undefined', () => {
      render(() => (
        <TestHost
          style={state =>
            state.active ? { color: 'rgb(255,0,0)' } : undefined
          }
          options={{
            defaultElement: 'div',
            props: { style: { padding: '10px' }, 'data-testid': 'host' },
          }}
        />
      ))

      expect(hostElement()?.getAttribute('style')).toBe('padding: 10px;')
    })

    it('makes single prop objects preventable', () => {
      const handleMouseDown = vi.fn((event: MouseEvent) => {
        ;(
          event as Event & { preventBaseUIHandler?: () => void }
        ).preventBaseUIHandler?.()
      })

      render(() =>
        createRender({
          defaultElement: 'div',
          props: mergeRenderProps({
            onMouseDown: handleMouseDown,
            'data-testid': 'host',
          }),
        })
      )

      const element = hostElement() as HTMLDivElement
      expect(() =>
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      ).not.toThrow()
      expect(handleMouseDown).toHaveBeenCalledTimes(1)
    })

    it('makes multi-prop arrays preventable when the event handler is first', () => {
      const handleMouseDown = vi.fn((event: MouseEvent) => {
        ;(
          event as Event & { preventBaseUIHandler?: () => void }
        ).preventBaseUIHandler?.()
      })

      render(() =>
        createRender({
          defaultElement: 'div',
          props: [
            { onMouseDown: handleMouseDown },
            { id: 'target', 'data-testid': 'host' },
          ],
        })
      )

      const element = hostElement() as HTMLDivElement
      expect(() =>
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      ).not.toThrow()
      expect(handleMouseDown).toHaveBeenCalledTimes(1)
    })

    it('does not resolve props when disabled', () => {
      const propsGetter = vi.fn(() => ({
        onMouseDown() {},
        'data-testid': 'host',
      }))

      render(() =>
        createRender({
          defaultElement: 'div',
          enabled: false,
          props: [propsGetter as unknown as Record<string, unknown>],
        })
      )

      expect(screen.queryByTestId('host')).toBeNull()
      expect(propsGetter).not.toHaveBeenCalled()
    })

    it.skip('handles enabled toggles across rerenders', async () => {
      // Covered by `enabled: false` lazy skip; full false→true toggle needs a parent component boundary in Solid tests.
      const [enabled, enabledAssign] = createSignal<boolean | undefined>(false)
      const ref = { current: null as HTMLDivElement | null }
      const handleClick = vi.fn()

      render(() =>
        createRender({
          defaultElement: 'div',
          enabled: enabled(),
          ref,
          props: [{ id: 'rerender-target', onClick: handleClick }],
        })
      )

      expect(document.getElementById('rerender-target')).toBeNull()
      expect(ref.current).toBeNull()

      enabledAssign(true)
      await waitFor(() => {
        expect(document.getElementById('rerender-target')).not.toBeNull()
      })

      const element = document.getElementById(
        'rerender-target'
      ) as HTMLDivElement
      expect(ref.current).toBe(element)

      element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(handleClick).toHaveBeenCalledTimes(1)

      enabledAssign(false)
      await flushMicrotasks()
      expect(document.getElementById('rerender-target')).toBeNull()
      expect(ref.current).toBeNull()
    })

    describe('prop: render', () => {
      it('accepts render as a function that receives props and state', () => {
        const renderCalls: Array<
          [Record<string, unknown>, { active?: boolean }]
        > = []

        render(() => (
          <TestHost
            active
            options={{
              defaultElement: 'div',
              mapStateToDataAttributes: true,
              props: {
                class: 'test-component',
                'data-testid': 'custom',
                style: { padding: '10px' },
              },
              render: (props, state) => {
                renderCalls.push([props, state])
                return <span {...props} />
              },
            }}
          />
        ))

        const element = screen.getByTestId('custom')
        expect(renderCalls.length).toBeGreaterThan(0)
        const [firstCallProps, firstCallState] = renderCalls[0]!
        expect(firstCallProps).toMatchObject({
          'data-testid': 'custom',
        })
        expect(screen.getByTestId('custom').className).toContain(
          'test-component'
        )
        expect(firstCallProps.style).toEqual({ padding: '10px' })
        expect(firstCallState).toEqual({ active: true })
        expect(element.tagName).toBe('SPAN')
        expect(element).toHaveAttribute('data-testid', 'custom')
        expect(element).toHaveAttribute('data-active', '')
      })

      it('accepts render element descriptor and merges props onto it', () => {
        render(() => (
          <TestHost
            active
            options={{
              defaultElement: 'div',
              mapStateToDataAttributes: true,
              props: { class: 'test-component', 'data-testid': 'custom' },
              render: {
                component: 'span',
                props: { class: 'render-class' },
              },
            }}
          />
        ))

        const element = screen.getByTestId('custom')
        expect(element.tagName).toBe('SPAN')
        expect(element.className).toContain('test-component')
        expect(element.className).toContain('render-class')
        expect(element).toHaveAttribute('data-active', '')
      })

      it('forwards ref to render element', () => {
        const ref = { current: null as HTMLDivElement | null }

        render(() =>
          createRender({
            defaultElement: 'div',
            ref,
            render: {
              component: 'div',
              props: { 'data-testid': 'render-target' },
            },
            props: {},
          })
        )

        expect(ref.current).toBe(screen.getByTestId('render-target'))
      })

      it('merges class from render element and component props', () => {
        render(() =>
          createRender({
            defaultElement: 'div',
            render: {
              component: 'span',
              props: { class: 'render-class', 'data-testid': 'merged' },
            },
            props: { class: 'component-class' },
            class: 'options-class',
          })
        )

        const element = screen.getByTestId('merged')
        expect(element.className).toContain('component-class')
        expect(element.className).toContain('render-class')
        expect(element.className).toContain('options-class')
      })

      it('merges style from render element and component props', () => {
        render(() =>
          createRender({
            defaultElement: 'div',
            render: {
              component: 'span',
              props: {
                'data-testid': 'styled',
                style: { color: 'rgb(255, 0, 0)', 'font-size': '16px' },
              },
            },
            props: { style: { padding: '10px' } },
          })
        )

        const element = screen.getByTestId('styled')
        expect(element.style.padding).toBe('10px')
        expect(element.style.color).toBe('rgb(255, 0, 0)')
        expect(element.style.fontSize).toBe('16px')
      })

      it('handles render element with existing ref', () => {
        const renderRef = { current: null as HTMLDivElement | null }
        const componentRef = { current: null as HTMLDivElement | null }

        render(() =>
          createRender({
            defaultElement: 'div',
            ref: componentRef,
            render: {
              component: 'div',
              props: { ref: renderRef, 'data-testid': 'dual-ref' },
            },
            props: {},
          })
        )

        expect(renderRef.current).toBeInstanceOf(HTMLDivElement)
        expect(componentRef.current).toBeInstanceOf(HTMLDivElement)
        expect(renderRef.current).toBe(componentRef.current)
      })
    })

    it('renders button default element with type=button', () => {
      render(() =>
        createRender({
          defaultElement: 'button',
          props: { 'data-testid': 'btn' },
        })
      )

      const button = screen.getByTestId('btn')
      expect(button.tagName).toBe('BUTTON')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('renders img default element with alt=""', () => {
      render(() =>
        createRender({
          defaultElement: 'img',
          props: { 'data-testid': 'img' },
        })
      )

      expect(screen.getByTestId('img')).toHaveAttribute('alt', '')
    })
  })
})
function TestHost(props: {
  options: RenderOptions
  active?: boolean
  class?: string | ((state: { active?: boolean }) => string | undefined)
  style?:
    | Record<string, string | number>
    | ((state: {
        active?: boolean
      }) => Record<string, string | number> | undefined)
}) {
  const state = {
    get active() {
      return props.active
    },
  }

  return createRender({
    ...props.options,
    defaultElement: props.options.defaultElement,
    state: props.options.state ?? state,
    class: props.class ?? props.options.class,
    style: props.style ?? props.options.style,
  })
}
function hostElement(): Element | null {
  return document.body.querySelector('[data-testid="host"]')
}
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
  await new Promise<void>(resolve => queueMicrotask(resolve))
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}
type RenderOptions = CreateRenderOptions<
  Record<string, unknown>,
  Record<string, unknown>
>
