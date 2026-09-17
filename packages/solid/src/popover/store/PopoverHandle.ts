/**
 * Detached popover handle — deferred pending popup-handle store (same as Dialog).
 *
 * @see UPSTREAM_TEST_PARITY.md
 */
export class PopoverHandle<TPayload = unknown> {
  /** @internal Payload type phantom. */
  declare readonly _payload?: TPayload

  /**
   * Opens the associated popover. No-op until handle store is ported.
   */
  open(_triggerId?: string | null, _payload?: TPayload): void {
    // Deferred — see UPSTREAM_TEST_PARITY.md
  }

  /**
   * Closes the associated popover. No-op until handle store is ported.
   */
  close(): void {
    // Deferred — see UPSTREAM_TEST_PARITY.md
  }
}

/**
 * Creates a {@link PopoverHandle} for detached triggers.
 *
 * Deferred: returns a stub handle. Full `createHandle` / multi-trigger wiring
 * matches Dialog — follow-up with Menu / Preview Card.
 *
 * @typeParam TPayload - Optional payload forwarded from the active trigger.
 * @returns A stub {@link PopoverHandle}.
 */
export function createPopoverHandle<
  TPayload = unknown,
>(): PopoverHandle<TPayload> {
  return new PopoverHandle<TPayload>()
}
