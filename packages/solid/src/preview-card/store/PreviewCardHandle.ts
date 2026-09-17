/**
 * Detached preview card handle — deferred pending popup-handle store (same as Dialog).
 *
 * @see UPSTREAM_TEST_PARITY.md
 */
export class PreviewCardHandle<TPayload = unknown> {
  /** @internal Payload type phantom. */
  declare readonly _payload?: TPayload

  /**
   * Opens the associated preview card. No-op until handle store is ported.
   */
  open(_triggerId?: string | null, _payload?: TPayload): void {
    // Deferred — see UPSTREAM_TEST_PARITY.md
  }

  /**
   * Closes the associated preview card. No-op until handle store is ported.
   */
  close(): void {
    // Deferred — see UPSTREAM_TEST_PARITY.md
  }
}

/**
 * Creates a {@link PreviewCardHandle} for detached triggers.
 *
 * Deferred: returns a stub handle. Full `createHandle` / multi-trigger wiring
 * matches Dialog — follow-up with Menu / Tooltip.
 *
 * @typeParam TPayload - Optional payload forwarded from the active trigger.
 * @returns A stub {@link PreviewCardHandle}.
 */
export function createPreviewCardHandle<
  TPayload = unknown,
>(): PreviewCardHandle<TPayload> {
  return new PreviewCardHandle<TPayload>()
}
