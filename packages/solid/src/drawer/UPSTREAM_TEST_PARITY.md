# Drawer — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `Drawer` (`Provider`, `Root`,
`Trigger`, `Portal`, `Backdrop`, `Viewport`, `Popup`, `Content`, `Title`,
`Description`, `Close`, `SwipeArea`, `Indent`, `IndentBackground`,
`VirtualKeyboardProvider`, `createHandle`).

Solid ports Dialog open/dismiss via `useRenderDialogRoot('drawer')` and adds
Drawer-specific context + CSS/data hooks. **This is a Lite port** for gesture /
snap / virtual-keyboard depth.

## Covered here

| Behavior | Status |
| --- | --- |
| Trigger opens / Close closes | covered |
| Controlled `open` + `onOpenChange` reason | covered |
| `onOpenChange` `cancel()` | covered |
| Escape dismiss | covered |
| Outside / backdrop pointer dismiss | covered |
| Modal scroll lock (inherited Dialog) | covered (via Dialog) |
| Portal mount | covered |
| `aria-labelledby` / `aria-describedby` | covered |
| `role="dialog"` + `aria-modal` | covered |
| Popup `data-swipe-direction` / `data-expanded` / open attrs | covered |
| `snapPoints` → expanded when last point active | covered |
| Content `data-drawer-content` | covered |
| SwipeArea opposite direction + closed attrs (no gesture) | covered |
| Provider → Indent / IndentBackground `data-active` | covered |
| `createHandle` / detached trigger + payload children | covered |
| Element children stable when detached trigger writes payload | covered |
| `actionsRef.close` | covered |
| VirtualKeyboardProvider passthrough mount | covered |
| Drawer root context (`swipeDirection`, `expanded`, `swiping`) | covered |

## Deferred / partial (Lite)

| Behavior | Notes |
| --- | --- |
| Swipe-to-dismiss on Viewport / Popup | No `useSwipeDismiss`; CSS vars idle (`0px` / `1`) |
| Snap-point drag / velocity / `snapToSequentialPoints` | Props + context accepted; no pointer pipeline |
| SwipeArea open gesture | Renders attrs only; no movement / open |
| Nested drawer swipe progress / `nestedDrawerSwiping` | Presence/height reporting wired; gesture progress idle |
| CloseWatcher (Android back) | Not ported |
| VirtualKeyboardProvider realignment | Passthrough stub |
| Indent visual-store swipeProgress during drag | Idle `0`; height sync from popup measure only |
| Full FloatingFocusManager / touch openMethod | Inherited Dialog Lite gaps |
| Payload children TS union | Same Solid note as Dialog (`JSX.Element` + arity gate) |
| `popupConformanceTests` suite | Not ported; key cases above |

Drawer **inherits Dialog Lite gaps** (focus-manager Lite, Lite transitions,
intentional vs sloppy outside-press, etc.).
