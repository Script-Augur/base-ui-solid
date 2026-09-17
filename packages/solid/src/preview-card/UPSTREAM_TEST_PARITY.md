# Preview Card — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `PreviewCard` (`Root`, `Trigger`,
`Portal`, `Positioner`, `Popup`, `Arrow`, `Backdrop`, `Viewport`,
`createHandle`).

## Covered here

| Behavior                                              | Status  |
| ----------------------------------------------------- | ------- |
| Trigger hover-open after `delay` (default 600)        | covered |
| Trigger hover-close after `closeDelay` (default 300)  | covered |
| Trigger focus-open (`trigger-focus`)                  | covered |
| Controlled `open` + `onOpenChange` reason             | covered |
| `onOpenChange` `cancel()`                             | covered |
| Escape dismiss (topmost only)                         | covered |
| Outside pointer dismiss                               | covered |
| Portal mount (`data-base-ui-portal`)                  | covered |
| `actionsRef.close` / `unmount`                        | covered |
| Positioner mounts with Floating UI placement          | covered |
| Arrow registers with positioner                       | covered |
| Viewport renders when mounted                         | covered |
| Popup focusable props (`tabindex=-1`, focusable attr) | covered |
| Popup hover bridge (Lite pointerenter keeps open)     | covered |
| `createHandle` / `Handle` exported (stub)             | stub    |

## Deferred / partial

| Behavior                                                                 | Notes                                                                            |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `PreviewCard.createHandle` / detached triggers / `triggerId` / `payload` | Requires popup-handle store; same deferral as Dialog / Popover                   |
| Multi-trigger / Viewport content transitions                             | Lite Viewport mounts children only                                               |
| Full `safePolygon` hover close                                           | Lite pointerenter/leave on trigger + popup; no polygon                           |
| `useHoverFloatingInteraction` close-while-over-popup fidelity            | Lite bridge via popup pointer handlers                                           |
| Intentional vs sloppy outside-press (mousedown vs click)                 | Solid uses `pointerdown`; matches Lite dismiss helper                            |
| Shadow DOM outside-press matrix                                          | jsdom coverage limited                                                           |
| `collisionAvoidance` / sticky / boundary matrix                          | Accepted for API parity; Floating UI flip/shift defaults                         |
| `inline-start` / `inline-end` direction remapping                        | Maps to left/right (LTR)                                                         |
| Payload children render function                                         | Not ported                                                                       |
| Full animation / `onOpenChangeComplete` exit matrix                      | Wired via `createOpenChangeComplete`; CSS animation cases deferred               |
| Focus-blur close edge cases / focus delay matrix                         | Blur closes when reason was `trigger-focus`; broader matrix deferred             |
| Touch pointer ignored for hover (`mouseOnly`)                            | Wired on trigger (`pointerType === 'touch'`); jsdom PointerEvent matrix deferred |
