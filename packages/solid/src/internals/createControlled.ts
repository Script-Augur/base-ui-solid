import { createMemo, createSignal } from 'solid-js'

import type { Accessor } from 'solid-js'

/**
 * Creates a Solid signal that works in both controlled and uncontrolled modes,
 * matching Base UI's controlled-prop pattern.
 *
 * When `options.value` returns a defined value, reads come from that accessor
 * and writes only call `onChange`. Otherwise the internal signal (seeded by
 * `defaultValue`) owns the state and `onChange` still fires on updates.
 *
 * @typeParam T - Value type managed by the controlled signal.
 * @param options - Controlled / uncontrolled wiring.
 * @returns A `[value, valueAssign]` tuple, like `createSignal`.
 *
 * Prefer naming the setter with the same stem as the value (`open` /
 * `openAssign`) so renames stay searchable — see `AGENTS.md`.
 *
 * @example
 * ```tsx
 * import { createSignal } from "solid-js"
 * import { createControlled } from "@script-augur/base-ui-solid"
 *
 * // Uncontrolled (internal state + optional onChange)
 * const [open, openAssign] = createControlled({
 *   defaultValue: false,
 *   onChange: (next) => console.log("open?", next),
 * })
 *
 * // Controlled (parent owns state)
 * const [checked, checkedAssign] = createSignal(false)
 * const [value, valueAssign] = createControlled({
 *   value: checked,
 *   defaultValue: false,
 *   onChange: checkedAssign,
 * })
 * ```
 */
export function createControlled<T>(
  options: CreateControlledOptions<T>
): ControlledSignal<T> {
  const [uncontrolled, uncontrolledAssign] = createSignal(options.defaultValue)
  const isControlled = createMemo(() => options.value?.() !== undefined)

  const getValue: Accessor<T> = () => {
    return isControlled() ? (options.value!() as T) : uncontrolled()
  }

  const valueAssign: ControlledSetter<T> = next => {
    const resolved =
      typeof next === 'function' ? (next as (prev: T) => T)(getValue()) : next
    if (!isControlled()) uncontrolledAssign(() => resolved)

    options.onChange?.(resolved)
  }

  return [getValue, valueAssign]
}

/**
 * Options for {@link createControlled}.
 *
 * @typeParam T - Value type managed by the controlled signal.
 */
export interface CreateControlledOptions<T> {
  /**
   * Controlled value accessor. When it returns a defined value, the signal is
   * controlled and mirrors this accessor.
   */
  value?: Accessor<T | undefined>
  /**
   * Initial value used while uncontrolled.
   */
  defaultValue: T
  /**
   * Called whenever the value should change (controlled or uncontrolled).
   *
   * @param value - Next value.
   */
  onChange?: (value: T) => void
}

/**
 * Setter returned by {@link createControlled}. Accepts a next value or an
 * updater function of the previous value (Solid `createSignal` style).
 *
 * @typeParam T - Value type managed by the controlled signal.
 */
export type ControlledSetter<T> = (next: T | ((prev: T) => T)) => void

/**
 * Tuple returned by {@link createControlled}: `[value, valueAssign]`.
 *
 * @typeParam T - Value type managed by the controlled signal.
 */
export type ControlledSignal<T> = [Accessor<T>, ControlledSetter<T>]
