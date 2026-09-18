# Menu — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `Menu` (`Root`, `Trigger`,
`Portal`, `Positioner`, `Popup`, `Arrow`, `Backdrop`, `Viewport`, `Group`,
`GroupLabel`, `Item`, `LinkItem`, `CheckboxItem`(+Indicator), `RadioGroup`,
`RadioItem`(+Indicator), `SubmenuRoot`, `SubmenuTrigger`, `Separator`,
`createHandle`).

Base: popup-handle foundation (`OPEN_PIPELINE.md` / `MENU_GAPS.md`). Menu uses
**store-first** open (`MenuStore.setOpen` → floating `setOpen` events) — not
the Dialog/Popover hybrid `createControlled` overwrite.

## Covered here

| Behavior | Status |
| -------- | ------ |
| Trigger opens / Item closes (`closeOnClick`) | covered |
| Controlled `open` + `onOpenChange` | covered |
| Escape dismiss | covered |
| Outside pointer dismiss | covered |
| Modal scroll lock (top-level) | covered |
| Portal mount | covered |
| `role=menu` / `role=menuitem` | covered |
| Lite arrow-key list navigation + typeahead | covered |
| `createHandle` + detached trigger open/close | covered |
| Group / GroupLabel | covered |
| CheckboxItem / RadioGroup / RadioItem (lite) | covered |
| SubmenuRoot + SubmenuTrigger (basic open) | covered |
| Separator re-export | covered |

## Deferred / Lite / partial

| Behavior | Notes |
| -------- | ----- |
| Full Floating UI `useListNavigation` / `useTypeahead` / `useDismiss` merge | Lite keyboard + Solid `createDismiss`; interaction prop merge deferred |
| Full `FloatingTree` node ids / `FloatingNode` / `safePolygon` | Lite `FloatingTreeStore` + parent observe; hover close is delay-based |
| `useTriggerFocusGuards` / `inlineRect` | Not ported (context-menu polish) |
| Menubar / Context Menu parent branches | Types exist; packages chain after this PR |
| Multi-trigger Viewport content transitions | Lite Viewport mounts children only |
| Payload children render-prop (`children({ payload })`) | Deferred — Solid `children` is always a function; use store payload via handle later |
| Adaptive origin middleware | Accepted for API parity; unused |
| Full modal/touch iOS scroll-lock nuances | Approximated via shared `createScrollLock` |
| Hover-open `safePolygon` / patient click matrix | Lite pointerenter/leave + delay |
| CompositeList index guessing vs manual register | Items register via Root `registerItem` |
| ToolbarRootContext coupling in Popup | Out of scope |
| Shadow DOM outside-press matrix | jsdom coverage limited |
| Full animation / `onOpenChangeComplete` exit matrix | Wired via `createOpenChangeComplete`; CSS cases deferred |

## Explicitly out of this PR

- Context Menu package
- Menubar package
