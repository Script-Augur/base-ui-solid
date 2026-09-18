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
| Lite ArrowDown/Up list navigation | covered |
| Lite typeahead (single-char buffer) | covered |
| `createHandle` + detached trigger open/close | covered |
| Group / GroupLabel | covered |
| CheckboxItem / RadioGroup / RadioItem (lite) | covered |
| SubmenuRoot + SubmenuTrigger (parent list nav, click open, `aria-controls`) | covered |
| Vertical ArrowRight open / ArrowLeft close submenu | covered |
| Nested `data-nested` via lite `floatingParentNodeId` | covered |
| Separator re-export in menu popup | covered |
| `preventUnmountOnClose` clears on reopen | covered |

## Deferred / Lite / partial

| Behavior | Notes |
| -------- | ----- |
| Full Floating UI `useListNavigation` / `useTypeahead` / `useDismiss` merge | Lite keyboard + Solid `createDismiss`; interaction prop merge deferred |
| Full `FloatingTree` / `FloatingNode` / `safePolygon` | Lite node id sync + `FloatingTreeStore` register; hover close is delay-based |
| `useTriggerFocusGuards` / `inlineRect` | Not ported (context-menu polish) |
| Menubar / Context Menu parent branches | Context Menu: types + parent wiring in this stack; package is `context-menu/`. Menubar still deferred |
| Multi-trigger Viewport content transitions | Lite Viewport mounts children only |
| Payload children render-prop (`children({ payload })`) | Deferred — Solid `children` is always a function; use store payload via handle later |
| Adaptive origin middleware | Accepted for API parity; unused |
| Full modal/touch iOS scroll-lock nuances | Approximated via shared `createScrollLock` |
| Hover-open `safePolygon` / patient click matrix | Lite pointerenter/leave + delay |
| CompositeList index guessing vs manual register | Items register via Root `registerItem` / parent store for SubmenuTrigger |
| ToolbarRootContext coupling in Popup | Out of scope |
| Shadow DOM outside-press matrix | jsdom coverage limited |
| Full animation / `onOpenChangeComplete` exit matrix | Wired via `createOpenChangeComplete`; CSS cases deferred |
| Detached trigger reference identity / outside-press-on-trigger | Smoke open/close covered; stronger matrix deferred |

## Explicitly out of this PR

- Context Menu package (see `context-menu/` — chained PR)
- Menubar package
