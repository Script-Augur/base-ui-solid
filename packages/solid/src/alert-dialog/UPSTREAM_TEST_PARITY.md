# Alert Dialog — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `AlertDialog` (thin wrapper over
`Dialog` via `useRenderDialogRoot('alert-dialog', …)`).

## Covered here

| Behavior                                                         | Status  |
| ---------------------------------------------------------------- | ------- |
| `role="alertdialog"` on popup                                    | covered |
| Forced `modal={true}` + scroll lock / internal backdrop          | covered |
| Forced `disablePointerDismissal` (no backdrop / outside dismiss) | covered |
| Trigger opens / Close closes                                     | covered |
| Controlled `open` + `onOpenChange` reasons                       | covered |
| Escape dismiss                                                   | covered |
| `onOpenChange` `cancel()`                                        | covered |
| `aria-labelledby` / `aria-describedby`                           | covered |
| Viewport wraps popup                                             | covered |
| Trigger `aria-haspopup="dialog"`                                 | covered |
| `details.preventUnmountOnClose` + `actionsRef.unmount` / `close` | covered |
| Root context exposes modal / disablePointerDismissal / role      | covered |
| `createHandle` / detached trigger + payload children             | covered |

## Deferred / partial

Alert Dialog **inherits Dialog Lite gaps** (focus-manager Lite, Lite
transitions, etc.) in addition to the Alert-specific rows below.

| Behavior                                                          | Notes                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Multi-trigger ARIA sync (`triggerId` / `defaultTriggerId`)        | Basic wiring via shared popup-handle store                                |
| Full `onOpenChangeComplete` animation matrix                      | Inherited from Dialog Lite transitions                                    |
| Focus-manager / floating-ui depth                                 | Inherited Dialog Lite gap                                                 |
| `popupConformanceTests` suite                                     | Not ported; key ARIA / open-close cases covered above                     |
| Intentional vs sloppy outside-press                               | N/A — pointer dismissal forced off                                        |
