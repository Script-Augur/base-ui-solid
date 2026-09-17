# Tooltip — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `Tooltip` (`Root`, `Trigger`,
`Portal`, `Positioner`, `Popup`, `Arrow`, `Provider`, `Viewport`,
`createHandle`). No `Backdrop` / `Title` / `Description` / `Close` in the
upstream Tooltip surface.

## Covered here

| Behavior                                                        | Status  |
| ---------------------------------------------------------------- | ------- |
| Hover opens after delay (mouse only, not touch)                  | covered |
| Focus opens immediately; blur closes a focus-opened tooltip      | covered |
| Does not open on click alone                                     | covered |
| Controlled `open` + `onOpenChange` reason (`trigger-hover`, `trigger-focus`) | covered |
| `onOpenChange` `cancel()`                                        | covered |
| Escape dismiss                                                   | covered |
| Outside press dismiss                                            | covered |
| `disabled` (Root) closes an open tooltip and blocks reopening    | covered |
| Portal mount (`data-base-ui-portal`)                              | covered |
| Positioner mounts; Arrow registers with positioner                | covered |
| Viewport renders when mounted                                     | covered |
| `closeOnClick` (default true): cancels pending open / closes open | covered |
| `closeOnClick={false}`: click before delay still allows open      | covered |
| `actionsRef.close` / `actionsRef.unmount`                         | covered |
| `preventUnmountOnClose`                                           | covered |
| `defaultOpen`                                                     | covered |
| Hoverable popup: pointer moving from trigger into popup keeps it open (when `disableHoverablePopup` is false) | covered |
| `Provider`: adjacent tooltip opens instantly within `timeout`      | covered |
| `Provider`: full delay required again after `timeout` elapses     | covered |
| `createHandle` / `Handle` exported (stub)                          | stub    |

## Deferred / partial

| Behavior                                                              | Notes                                                                 |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Detached triggers / `Tooltip.createHandle` multi-trigger wiring        | Requires popup-handle store; same deferral as Popover/Dialog           |
| Full `FloatingDelayGroup` (per-trigger delay overrides across a shared floating tree) | Lite uses a single provider-level instant-phase signal + timeout instead |
| `safePolygon` hover geometry for the hoverable popup                   | Lite uses simple pointerenter/pointerleave + `closeDelay` timers on Trigger and Popup, no polygon geometry |
| `trackCursorAxis` full client-point positioning fidelity               | The cursor point is tracked on `TooltipRootContext`, but the Positioner still anchors to the trigger and goes `inert` (`pointer-events: none` + `inert` attribute) whenever `trackCursorAxis !== 'none'`, rather than following the pointer |
| Nested-trigger detection (`data-base-ui-tooltip-trigger` walk for parent/child hover handoff) | The data attribute is emitted on enabled triggers for future use, but no nested-trigger hover bridging logic is implemented |
| `Viewport` multi-trigger content morph animations                      | Lite Viewport mounts children only, matching `Popover.Viewport`        |
| Full animation / `onOpenChangeComplete` exit matrix                    | Wired via `createOpenChangeComplete`; CSS animation timing cases deferred |
| `instant` semantics beyond `'delay'` / `'focus'` / `'dismiss'` / `'tracking-cursor'` | Matches the Lite instant-type enum used by `Popover`; upstream's exact instant-phase edge cases (e.g. simultaneous dismiss + regroup) are not exhaustively covered |
| Shadow DOM outside-press matrix                                        | jsdom coverage limited, same as Popover                                |
| Payload children render function (`children` as `({ payload }) => …`)  | Not ported                                                              |
