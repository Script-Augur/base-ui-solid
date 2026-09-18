import {
  Timeout,
  activeElement,
  addEventListener,
  contains,
  getTarget,
  mergeCleanups,
  ownerDocument,
  ownerWindow,
} from '@script-augur/base-ui-utils'
import {
  For,
  Show,
  createEffect,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'

import { FocusGuard } from '../../dialog/utils/FocusGuard'
import { visuallyHiddenStyle } from '../../dialog/utils/visuallyHidden'
import { createRender } from '../../internals/createRender'
import { useToastProviderContext } from '../provider/ToastProviderContext'
import { isFocusVisible } from '../utils/focusVisible'

import { ToastViewportCssVars } from './ToastViewportCssVars'

import type { RenderProp } from '../../internals/createRender'
import type { JSX } from 'solid-js'

/**
 * A container viewport for toasts.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 *
 * @param componentProps - Viewport props.
 * @returns Viewport region plus optional high-priority alerts.
 */
export function ToastViewport(componentProps: ToastViewportProps): JSX.Element {
  const store = useToastProviderContext()
  const windowFocusTimeout = new Timeout()

  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'style',
    'children',
    'ref',
  ])

  let handlingFocusGuard = false
  let markedReadyForMouseLeave = false
  let touchActive = false

  const isEmpty = store.select('isEmpty')
  const toasts = store.select('toasts')
  const focused = store.select('focused')
  const expanded = store.select('expanded')
  const prevFocusElement = store.select('prevFocusElement')

  const frontmostHeight = () => toasts()[0]?.height
  const hasTransitioningToasts = () =>
    toasts().some(toast => toast.transitionStatus === 'ending')
  const highPriorityToasts = () =>
    toasts().filter(toast => toast.priority === 'high')

  onCleanup(() => windowFocusTimeout.clear())

  createEffect(() => {
    const viewport = store.state.viewport
    if (!viewport || isEmpty()) {
      return
    }

    const win = ownerWindow(viewport)
    const doc = ownerDocument(viewport)

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (event.key === 'F6' && getTarget(event) !== viewport) {
        event.preventDefault()
        const previouslyFocused = activeElement(doc)
        store.set(
          'prevFocusElement',
          previouslyFocused instanceof HTMLElement ? previouslyFocused : null
        )
        viewport?.focus({ preventScroll: true })
        store.pauseTimers()
        store.set('focused', true)
      }
    }

    function handleWindowBlur(event: FocusEvent) {
      if (getTarget(event) !== win) {
        return
      }

      store.set('isWindowFocused', false)
      store.pauseTimers()
    }

    function handleWindowFocus(event: FocusEvent) {
      if (event.relatedTarget) {
        return
      }

      const target = getTarget(event)
      const activeEl = activeElement(ownerDocument(viewport))
      if (
        target === win ||
        !contains(viewport, target as HTMLElement | null) ||
        !isFocusVisible(activeEl)
      ) {
        store.resumeTimers()
      }

      windowFocusTimeout.start(0, () => store.set('isWindowFocused', true))
    }

    onCleanup(
      mergeCleanups(
        addEventListener(win, 'keydown', handleGlobalKeyDown),
        addEventListener(win, 'blur', handleWindowBlur, true),
        addEventListener(win, 'focus', handleWindowFocus, true),
        addEventListener(
          doc,
          'pointerdown',
          store.handleDocumentPointerDown,
          true
        )
      )
    )
  })

  function handleFocusGuard(event: FocusEvent) {
    handlingFocusGuard = true

    const firstFocusableToast =
      event.relatedTarget === store.state.viewport
        ? toasts().find(
            toast => toast.transitionStatus !== 'ending' && !toast.limited
          )
        : undefined

    if (firstFocusableToast) {
      firstFocusableToast.ref?.focus()
    } else {
      store.restoreFocusToPrevElement()
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (
      event.key === 'Tab' &&
      event.shiftKey &&
      getTarget(event) === store.state.viewport
    ) {
      event.preventDefault()
      store.restoreFocusToPrevElement()
    }
  }

  function flushMouseLeave() {
    const hasEndingToasts = store.state.toasts.some(
      toast => toast.transitionStatus === 'ending'
    )

    if (hasEndingToasts || touchActive || !markedReadyForMouseLeave) {
      return
    }

    if (store.state.isWindowFocused) {
      store.resumeTimers()
    }
    store.set('hovering', false)
    markedReadyForMouseLeave = false
  }

  createEffect(() => {
    hasTransitioningToasts()
    flushMouseLeave()
  })

  function handleMouseEnter() {
    store.pauseTimers()
    store.set('hovering', true)
    markedReadyForMouseLeave = false
  }

  function resumeTimersIfWindowFocused() {
    if (store.state.isWindowFocused) {
      store.resumeTimers()
    }
  }

  function handleMouseLeave() {
    markedReadyForMouseLeave = true
    flushMouseLeave()
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.pointerType === 'touch') {
      touchActive = true
    }
  }

  function handlePointerEnd(event: PointerEvent) {
    if (event.pointerType !== 'touch') {
      return
    }

    touchActive = false
    flushMouseLeave()
  }

  function handleFocus() {
    if (handlingFocusGuard) {
      handlingFocusGuard = false
      return
    }

    if (focused()) {
      return
    }

    if (isFocusVisible(activeElement(ownerDocument(store.state.viewport)))) {
      store.set('focused', true)
      store.pauseTimers()
    }
  }

  function handleBlur(event: FocusEvent) {
    if (
      !focused() ||
      contains(store.state.viewport, event.relatedTarget as HTMLElement | null)
    ) {
      return
    }

    store.set('focused', false)
    resumeTimersIfWindowFocused()
  }

  const state: ToastViewportState = {
    get expanded() {
      return expanded()
    },
  }

  onCleanup(() => {
    store.setViewport(null)
  })

  const showFocusGuard = () => !isEmpty() && Boolean(prevFocusElement())

  const viewportChildren = (
    <>
      <Show when={showFocusGuard()}>
        <FocusGuard onFocus={handleFocusGuard} />
      </Show>
      {local.children}
      <Show when={showFocusGuard()}>
        <FocusGuard onFocus={handleFocusGuard} />
      </Show>
    </>
  )

  return (
    <>
      <Show when={showFocusGuard()}>
        <FocusGuard onFocus={handleFocusGuard} />
      </Show>
      {createRender<ToastViewportState, Record<string, unknown>>({
        defaultElement: 'div',
        state,
        render: local.render,
        mapStateToDataAttributes: true,
        props: mergeProps(elementProps as Record<string, unknown>, {
          tabIndex: -1,
          role: 'region',
          'aria-live': 'polite',
          'aria-atomic': false,
          'aria-relevant': 'additions text',
          'aria-label': 'Notifications',
          onMouseEnter: handleMouseEnter,
          onMouseMove: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
          onFocus: handleFocus,
          onBlur: handleBlur,
          onKeyDown: handleKeyDown,
          onClick: handleFocus,
          onPointerDown: handlePointerDown,
          onPointerUp: handlePointerEnd,
          onPointerCancel: handlePointerEnd,
          get class() {
            return local.class
          },
          get style() {
            const height = frontmostHeight()
            const base: JSX.CSSProperties = {
              [ToastViewportCssVars.frontmostHeight]: height
                ? `${height}px`
                : undefined,
            }
            const user = local.style
            if (user && typeof user === 'object' && !Array.isArray(user)) {
              return { ...base, ...user }
            }
            return base
          },
          children: viewportChildren,
          ref(element: HTMLElement) {
            store.setViewport(element)
            const userRef = local.ref
            if (typeof userRef === 'function') {
              userRef(element as HTMLDivElement)
            }
          },
        }),
      })}
      <Show when={!focused() && highPriorityToasts().length > 0}>
        <div style={visuallyHiddenStyle}>
          <For each={highPriorityToasts()}>
            {toast => (
              <div role="alert" aria-atomic={true}>
                <div>{toast.title}</div>
                <div>{toast.description}</div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </>
  )
}
/** Public state for {@link ToastViewport}. */
export interface ToastViewportState extends Record<string, unknown> {
  expanded: boolean
}
/** Props for {@link ToastViewport}. */
export type ToastViewportProps = JSX.HTMLAttributes<HTMLDivElement> & {
  render?: RenderProp<ToastViewportState, Record<string, unknown>>
}
