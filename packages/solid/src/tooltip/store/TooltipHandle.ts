/**
 * Detached tooltip handle — deferred pending popup-handle store (same as
 * Popover / Dialog).
 *
 * @see UPSTREAM_TEST_PARITY.md
 */
export class TooltipHandle<TPayload = unknown> {
  /** @internal Payload type phantom. */
  declare readonly _payload?: TPayload

  /**
   * Opens the associated tooltip. No-op until handle store is ported.
   */
  open(_triggerId?: string | null, _payload?: TPayload): void {
    // Deferred — see UPSTREAM_TEST_PARITY.md
  }

  /**
   * Closes the associated tooltip. No-op until handle store is ported.
   */
  close(): void {
    // Deferred — see UPSTREAM_TEST_PARITY.md
  }
}

/**
 * Creates a {@link TooltipHandle} for detached triggers.
 *
 * Deferred: returns a stub handle. Full `createHandle` / multi-trigger wiring
 * matches Popover — follow-up with Menu / Preview Card.
 *
 * @typeParam TPayload - Optional payload forwarded from the active trigger.
 * @returns A stub {@link TooltipHandle}.
 */
export function createTooltipHandle<
  TPayload = unknown,
>(): TooltipHandle<TPayload> {
  return new TooltipHandle<TPayload>()
}
