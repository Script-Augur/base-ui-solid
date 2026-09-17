# Popover — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `Popover` (`Root`, `Trigger`,
`Portal`, `Positioner`, `Popup`, `Arrow`, `Backdrop`, `Title`, `Description`,
`Close`, `Viewport`, `createHandle`).

## Covered here

| Behavior                                               | Status  |
| ------------------------------------------------------ | ------- |
| Trigger opens / Close closes                           | covered |
| Controlled `open` + `onOpenChange` reason              | covered |
| `onOpenChange` `cancel()`                              | covered |
| Escape dismiss (topmost only)                          | covered |
| Outside / backdrop pointer dismiss                     | covered |
| Modal scroll lock (`modal === true`)                   | covered |
| Non-modal: no scroll lock                              | covered |
| Portal mount (`data-base-ui-portal`)                   | covered |
| `aria-labelledby` / `aria-describedby`                 | covered |
| Nested popovers + Escape targets topmost               | covered |
| Internal backdrop when `modal === true`                | covered |
| `details.preventUnmountOnClose` + `actionsRef.unmount` | covered |
| `actionsRef.close`                                     | covered |
| Positioner mounts with Floating UI placement           | covered |
| Arrow registers with positioner                        | covered |
| Viewport renders when mounted                          | covered |
| Trigger `openOnHover` + `delay` / `closeDelay` (Lite)  | covered |
| Trigger click-toggle close                             | covered |
| Patient click after hover-open (`stickIfOpen`)         | covered |
| `createHandle` / `Handle` exported (stub)              | stub    |

## Deferred / partial

| Behavior                                                             | Notes                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Non-modal focus guards + `aria-owns`                                 | Wired via Portal; no dedicated Popover suite coverage yet          |
| Focus trap when `modal === true` + Close part                        | Wired via `createFocusTrap`; no dedicated suite coverage yet       |
| `modal="trap-focus"` (trap on, no scroll)                            | Wired; no dedicated suite coverage yet                             |
| Restore focus to trigger on close                                    | Wired; no dedicated suite coverage yet                             |
| `Popup` `initialFocus` / `finalFocus`                                | Wired; no dedicated suite coverage yet                             |
| `Popover.createHandle` / detached triggers / `triggerId` / `payload` | Requires popup-handle store; same deferral as Dialog               |
| Multi-trigger / Viewport content transitions                         | Lite Viewport mounts children only                                 |
| Intentional vs sloppy outside-press (mousedown vs click)             | Solid uses `pointerdown`; matches Lite dismiss helper              |
| Shadow DOM outside-press matrix                                      | jsdom coverage limited                                             |
| Full `FloatingFocusManager` / `safePolygon` hover close              | Lite pointerenter/leave + delay; no safe polygon                   |
| Touch modal scroll-lock (near-full-width)                            | Deferred                                                           |
| `collisionAvoidance` / sticky / boundary matrix                      | Accepted for API parity; Floating UI flip/shift defaults           |
| `inline-start` / `inline-end` direction remapping                    | Maps to left/right (LTR)                                           |
| Nested menu / combobox focus handoff                                 | Out of scope for this PR                                           |
| Payload children render function                                     | Not ported                                                         |
| Full animation / `onOpenChangeComplete` exit matrix                  | Wired via `createOpenChangeComplete`; CSS animation cases deferred |
