# Dialog — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `Dialog` (`Root`, `Trigger`,
`Portal`, `Backdrop`, `Viewport`, `Popup`, `Title`, `Description`, `Close`).

## Covered here

| Behavior                                  | Status  |
| ----------------------------------------- | ------- |
| Trigger opens / Close closes              | covered |
| Controlled `open` + `onOpenChange` reason | covered |
| `onOpenChange` `cancel()`                 | covered |
| Escape dismiss (topmost only)             | covered |
| Outside / backdrop pointer dismiss        | covered |
| `disablePointerDismissal`                 | covered |
| Modal scroll lock                         | covered |
| Non-modal: no scroll lock                 | covered |
| Portal mount (`data-base-ui-portal`)      | covered |
| `aria-labelledby` / `aria-describedby`    | covered |
| Nested dialogs + Escape targets topmost   | covered |
| `data-nested` on nested popup             | covered |
| Internal backdrop when `modal === true`   | covered |
| Non-modal focus guards + `aria-owns`      | covered |

## Deferred / partial

| Behavior                                                     | Notes                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `Dialog.createHandle` / detached triggers / `triggerId`      | Requires popup-handle store; follow-up with Menu/Popover             |
| `actionsRef.unmount` + exit-animation handoff edge cases     | `actionsRef` wired; full animation-restart matrix not ported         |
| Intentional vs sloppy outside-press (mousedown vs click)     | Solid uses `pointerdown`; matches Lite dismiss helper                |
| Shadow DOM outside-press matrix                              | jsdom coverage limited                                               |
| Full `FloatingFocusManager` openMethod / touch initial focus | Uses `createFocusTrap`; `initialFocus` HTMLElement/`false` supported |
| `modal="trap-focus"` pointer path nuances                    | Focus trap enabled; scroll lock off                                  |
| Payload children render function                             | Not ported                                                           |
| Viewport scrollable positioning stories                      | Part exported; light coverage via compound usage                     |
