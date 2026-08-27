import { mergeObjects } from '@script-augur/base-ui-utils'

import { makeEventPreventable } from './makeEventPreventable'
import { mergeClassNames } from './resolveRenderProps'

import type { BaseUIEvent } from './makeEventPreventable'

const EMPTY_PROPS: Record<string, unknown> = {}
/**
 * Merges prop bags for render composition (Base UI `mergeProps` semantics).
 *
 * Event handlers run right-to-left; the rightmost may call
 * `event.preventBaseUIHandler()` to skip earlier handlers. `class` strings are
 * concatenated; `style` objects are shallow-merged. `ref` is not merged here.
 *
 * @param inputs - Prop objects or `(previous) => props` getters.
 * @returns Merged props object.
 */
export function mergeRenderProps(
  ...inputs: Array<PropsInput>
): Record<string, unknown> {
  let merged = createInitialMergedProps(inputs[0])

  for (let index = 1; index < inputs.length; index += 1) {
    merged = mergeInto(merged, inputs[index])
  }

  return merged
}
/**
 * Merges an array of prop bags using {@link mergeRenderProps}.
 *
 * @param inputs - Prop objects or getters.
 * @returns Merged props object.
 */
export function mergeRenderPropsN(
  inputs: Array<PropsInput>
): Record<string, unknown> {
  if (inputs.length === 0) {
    return EMPTY_PROPS
  }
  if (inputs.length === 1) {
    return createInitialMergedProps(inputs[0])
  }

  let merged = createInitialMergedProps(inputs[0])
  for (let index = 1; index < inputs.length; index += 1) {
    merged = mergeInto(merged, inputs[index])
  }
  return merged
}
export type PropsInput =
  | Record<string, unknown>
  | ((previous: Record<string, unknown>) => Record<string, unknown>)
  | null
  | undefined
function createInitialMergedProps(input: PropsInput): Record<string, unknown> {
  if (isPropsGetter(input)) {
    return { ...resolvePropsGetter(input, EMPTY_PROPS) }
  }
  return copyInitialProps(input)
}
function mergeInto(
  merged: Record<string, unknown>,
  input: PropsInput
): Record<string, unknown> {
  if (input == null) {
    return merged
  }
  if (isPropsGetter(input)) {
    return resolvePropsGetter(input, merged)
  }
  return mutablyMergeInto(merged, input)
}
function copyInitialProps(
  inputProps: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!inputProps) {
    return {}
  }

  const copiedProps: Record<string, unknown> = {}

  for (const propName of Object.keys(inputProps)) {
    const descriptor = Object.getOwnPropertyDescriptor(inputProps, propName)
    if (descriptor?.get || descriptor?.set) {
      Object.defineProperty(copiedProps, propName, descriptor)
      continue
    }

    const propValue = inputProps[propName]
    if (isEventHandler(propName, propValue)) {
      copiedProps[propName] = wrapEventHandler(
        propValue as (...args: Array<unknown>) => void
      )
    } else {
      copiedProps[propName] = propValue
    }
  }

  return copiedProps
}
function mutablyMergeInto(
  mergedProps: Record<string, unknown>,
  externalProps: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!externalProps) {
    return mergedProps
  }

  for (const propName in externalProps) {
    const externalPropValue = externalProps[propName]

    switch (propName) {
      case 'style': {
        mergedProps.style = mergeObjects(
          mergedProps.style as Record<string, unknown> | undefined,
          externalPropValue as Record<string, unknown> | undefined
        )
        break
      }
      case 'class':
      case 'className': {
        const mergedKey =
          mergedProps.class !== undefined ? 'class' : 'className'
        const existing =
          (mergedProps.class as string | undefined) ??
          (mergedProps.className as string | undefined)
        const nextClass = mergeClassNames(existing, externalPropValue as string)
        delete mergedProps.className
        if (nextClass !== undefined) {
          mergedProps[mergedKey] = nextClass
        } else {
          delete mergedProps.class
        }
        break
      }
      default: {
        if (isEventHandler(propName, externalPropValue)) {
          mergedProps[propName] = mergeEventHandlers(
            mergedProps[propName] as
              ((...args: Array<unknown>) => void) | undefined,
            externalPropValue as (...args: Array<unknown>) => void
          )
        } else {
          mergedProps[propName] = externalPropValue
        }
      }
    }
  }

  return mergedProps
}
function isEventHandler(key: string, value: unknown): boolean {
  const code0 = key.charCodeAt(0)
  const code1 = key.charCodeAt(1)
  const code2 = key.charCodeAt(2)
  return (
    code0 === 111 /* o */ &&
    code1 === 110 /* n */ &&
    code2 >= 65 /* A */ &&
    code2 <= 90 /* Z */ &&
    (typeof value === 'function' || typeof value === 'undefined')
  )
}
function isPropsGetter(
  input: PropsInput
): input is (props: Record<string, unknown>) => Record<string, unknown> {
  return typeof input === 'function'
}
function resolvePropsGetter(
  input: PropsInput,
  previousProps: Record<string, unknown>
): Record<string, unknown> {
  if (isPropsGetter(input)) {
    return input(previousProps)
  }
  return input ?? EMPTY_PROPS
}
function mergeEventHandlers(
  ourHandler: ((...args: Array<unknown>) => void) | undefined,
  theirHandler: ((...args: Array<unknown>) => void) | undefined
): (...args: Array<unknown>) => unknown {
  if (!theirHandler) {
    return ourHandler ?? (() => undefined)
  }
  if (!ourHandler) {
    return wrapEventHandler(theirHandler)
  }

  return (...args: Array<unknown>) => {
    const event = args[0]
    if (isDOMEvent(event)) {
      const baseUIEvent = makeEventPreventable(event)
      const result = theirHandler(...args)
      if (!baseUIEvent.baseUIHandlerPrevented) {
        ourHandler(...args)
      }
      return result
    }

    const result = theirHandler(...args)
    ourHandler(...args)
    return result
  }
}
function wrapEventHandler(
  handler: (...args: Array<unknown>) => void
): (...args: Array<unknown>) => unknown {
  return (...args: Array<unknown>) => {
    const event = args[0]
    if (isDOMEvent(event)) {
      makeEventPreventable(event as BaseUIEvent<Event>)
    }
    return handler(...args)
  }
}
function isDOMEvent(event: unknown): event is Event {
  return typeof Event !== 'undefined' && event instanceof Event
}
