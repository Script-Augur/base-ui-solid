import { createSignal, createUniqueId } from 'solid-js'

import { LabelableContext, useLabelableContext } from './LabelableContext'

import type { HTMLProps, LabelableContextValue } from './LabelableContext'
import type { JSX, ParentProps } from 'solid-js'

/**
 * Provides label / description association state to nested Field (and later
 * Checkbox, etc.) parts.
 */
export function LabelableProvider(props: LabelableProviderProps): JSX.Element {
  const defaultId = createUniqueId()
  const initialControlId =
    props.controlId === undefined ? defaultId : props.controlId

  const [controlId, controlIdAssign] = createSignal<string | null | undefined>(
    initialControlId
  )
  const [labelId, labelIdAssign] = createSignal<string | undefined>(
    props.labelId
  )
  const [messageIds, messageIdsAssign] = createSignal<Array<string>>([])

  const registrations = new Map<symbol, string | null>()

  const parent = useLabelableContext()

  const registerControlId = (
    source: symbol,
    nextId: string | null | undefined
  ) => {
    if (nextId === undefined) {
      registrations.delete(source)
      return
    }

    registrations.set(source, nextId)

    // Only flush when registering, not when unregistering.
    // This prevents loops during rapid unmount/remount cycles.
    controlIdAssign(prev => {
      if (registrations.size === 0) {
        return undefined
      }

      let nextControlId: string | null | undefined

      for (const id of registrations.values()) {
        if (prev !== undefined && id === prev) {
          return prev
        }

        if (nextControlId === undefined) {
          nextControlId = id
        }
      }

      return nextControlId
    })
  }

  const getDescriptionProps = (externalProps: HTMLProps): HTMLProps => {
    const describedBy = externalProps['aria-describedby']
    const ids =
      typeof describedBy === 'string' && describedBy.length > 0
        ? describedBy.split(' ')
        : []
    ids.push(...parent.messageIds(), ...messageIds())

    return {
      ...externalProps,
      'aria-describedby': Array.from(new Set(ids)).join(' ') || undefined,
    }
  }

  const contextValue: LabelableContextValue = {
    controlId,
    registerControlId,
    labelId,
    labelIdAssign,
    messageIds,
    messageIdsAssign,
    getDescriptionProps,
  }

  return (
    <LabelableContext.Provider value={contextValue}>
      {props.children}
    </LabelableContext.Provider>
  )
}

export interface LabelableProviderProps extends ParentProps {
  controlId?: string | null | undefined
  labelId?: string | undefined
}
