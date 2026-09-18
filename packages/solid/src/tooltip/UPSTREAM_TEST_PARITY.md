# Tooltip — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `Tooltip` (`Root`, `Trigger`,
`Portal`, `Positioner`, `Popup`, `Arrow`, `Provider`, `Viewport`,
`createHandle`). No `Backdrop` / `Title` / `Description` / `Close` in the
upstream Tooltip surface.

## Covered here

| Behavior | Status |
| -------- | ------ |
| Hover opens after delay (mouse only, not touch) | covered |
| Focus opens only on keyboard / `:focus-visible` (pointer click-focus refused) | covered |
| Blur closes focus-opened tooltips; focus into popup / focusable child keeps open | covered |
| Does not open on click / pointer+focus alone | covered |
| Controlled `open` + `onOpenChange` reason (`trigger-hover`, `trigger-focus`) | covered |
| `onOpenChange` `cancel()` | covered |
| Escape dismiss | covered |
| Outside press dismiss | covered |
| `disabled` (Root) closes an open tooltip | covered |
| Portal mount (`data-base-ui-portal`) | covered |
| Positioner mounts; Arrow registers with positioner | covered |
| Viewport renders when mounted | covered |
| `closeOnClick` (default true): cancels pending open / closes open | covered |
| `closeOnClick={false}`: click before delay still allows open | covered |
| `actionsRef.close` / `actionsRef.unmount` | covered |
| `preventUnmountOnClose` | covered |
| `defaultOpen` | covered |
| Unhover closes after open (including `defaultOpen` with null reason) | covered |
| Hoverable popup: leave without enter closes; enter cancels scheduled close | covered |
| `disableHoverablePopup`: popup enter does not cancel close; positioner inert | covered |
| `Provider`: sibling exclusive-open (previous closes with `none`) | covered |
| `Provider`: adjacent tooltip opens instantly while group active | covered |
| `Provider`: full delay required again after `timeout` with open-count 0 | covered |
| Popup `FOCUSABLE_POPUP_PROPS` (`tabIndex={-1}`, `data-base-ui-focusable`) | covered |
| `createHandle` / `Handle` exported (stub) | stub |

## Deferred / partial

| Behavior | Notes |
| -------- | ----- |
| Detached triggers / `Tooltip.createHandle` multi-trigger wiring | Requires popup-handle store; same deferral as Popover/Dialog |
| Full `FloatingDelayGroup` per-trigger delay overrides across a shared floating tree | Lite uses provider-level instant-phase + open-count + sibling close; not a shared floating-ui delay ref |
| `safePolygon` hover geometry for the hoverable popup | Lite uses pointerenter/pointerleave + `closeDelay` timers on Trigger and Popup |
| `trackCursorAxis` client-point positioning | Prop accepted for API parity; **no cursor-point tracking is wired**. Positioner still anchors to the trigger. Inert when axis is `'both'` (matches upstream) or `disableHoverablePopup` / closed |
| Nested-trigger detection (`data-base-ui-tooltip-trigger` walk) | Attribute is emitted on enabled triggers; no nested hover handoff |
| `Viewport` multi-trigger content morph animations | Lite Viewport mounts children only |
| Full animation / `onOpenChangeComplete` exit matrix | Wired via `createOpenChangeComplete`; CSS timing cases deferred |
| Shadow DOM outside-press matrix | jsdom coverage limited |
| Payload children render function (`children` as `({ payload }) => …`) | Not ported |
| Safari modality special-cases beyond keyboard/pointer tracking | Lite uses document keydown vs mouse/pen pointerdown modality + `:focus-visible` when supported |
