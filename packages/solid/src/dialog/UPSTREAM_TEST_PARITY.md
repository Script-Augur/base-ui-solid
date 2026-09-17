# Dialog — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `Dialog` (`Root`, `Trigger`,
`Portal`, `Backdrop`, `Viewport`, `Popup`, `Title`, `Description`, `Close`).

## Covered here

| Behavior                                               | Status  |
| ------------------------------------------------------ | ------- |
| Trigger opens / Close closes                           | covered |
| Controlled `open` + `onOpenChange` reason              | covered |
| `onOpenChange` `cancel()`                              | covered |
| Escape dismiss (topmost only)                          | covered |
| Outside / backdrop pointer dismiss                     | covered |
| Outside press without backdrop                         | covered |
| `disablePointerDismissal`                              | covered |
| Modal scroll lock                                      | covered |
| Non-modal: no scroll lock                              | covered |
| Portal mount (`data-base-ui-portal`)                   | covered |
| `aria-labelledby` / `aria-describedby`                 | covered |
| Nested dialogs + Escape targets topmost                | covered |
| Nested outside-press (topmost)                         | covered |
| `data-nested` on nested popup                          | covered |
| Internal backdrop when `modal === true`                | covered |
| Non-modal focus guards + `aria-owns`                   | covered |
| Focus trap Tab cycle                                   | covered |
| Restore focus to trigger on close                      | covered |
| `Popup` `initialFocus` HTMLElement/`false`             | covered |
| `Popup` `finalFocus` HTMLElement/`false`               | covered |
| `modal="trap-focus"` (trap on, no scroll)              | covered |
| `details.preventUnmountOnClose` + `actionsRef.unmount` | covered |
| Viewport renders when mounted                          | covered |
| `createHandle` / detached trigger open/close           | covered |

## Deferred / partial

| Behavior                                                     | Notes                                                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `Dialog.createHandle` payload children render function       | Handle + detached triggers covered; payload children render-prop deferred    |
| Multi-trigger ARIA sync edge cases                           | Basic `triggerId` / active trigger wired via popup store                     |
| `actionsRef.unmount` + exit-animation handoff edge cases     | `actionsRef` + `preventUnmountOnClose` wired; full animation matrix deferred |
| Intentional vs sloppy outside-press (mousedown vs click)     | Solid uses `pointerdown`; matches Lite dismiss helper                        |
| Shadow DOM outside-press matrix                              | jsdom coverage limited                                                       |
| Full `FloatingFocusManager` openMethod / touch initial focus | Uses `createFocusTrap`; touch→popup-self default not ported                  |
| `modal="trap-focus"` `markOthers` / `aria-hidden` on outside | Trap on, scroll lock off; no inert/aria-hidden siblings (Lite)               |
| `aria-modal` for `trap-focus`                                | Only set when `modal === true` (upstream FloatingFocusManager differs)       |
| Before-guard always `popup.focus()`                          | Upstream may use inside-guard / prev-tabbable; Lite simplification           |
| Payload children render function                             | Not ported                                                                   |
| Viewport scrollable positioning stories                      | Part exported; light coverage via compound usage                             |
