# Context Menu — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` Context Menu (`Root`, `Trigger`,
plus Menu re-exports: `Portal`, `Positioner`, `Popup`, `Arrow`, `Backdrop`,
`Group`, `GroupLabel`, `Item`, `LinkItem`, `CheckboxItem`(+Indicator),
`RadioGroup`, `RadioItem`(+Indicator), `SubmenuRoot`, `SubmenuTrigger`,
`Separator`).

Base: Menu PR branch (`cursor/port-menu-c6a4`) — store-first open pipeline.
Context Menu is a thin wrapper: cursor/long-press `Trigger` +
`ContextMenuRootContext` for anchor/refs; nested `Menu.Root` with
`parent.type === 'context-menu'`.

## Covered here

| Behavior | Status |
| -------- | ------ |
| Right-click (`contextmenu`) opens at cursor | covered |
| Controlled `open` + `onOpenChange` (`trigger-press`) | covered |
| Escape dismiss | covered |
| Item click closes | covered |
| Modal scroll lock | covered |
| Portal mount | covered |
| `role=menu` / `role=menuitem` | covered |
| Trigger `data-popup-open` / `data-pressed` | covered |
| `disabled` blocks open | covered |
| Popup `data-rootownerid` | covered |
| SubmenuRoot + SubmenuTrigger (via Menu re-export) | covered |

## Deferred / Lite / partial

| Behavior | Notes |
| -------- | ----- |
| Touch long-press open (500ms) + move cancel | Code present on Trigger; jsdom touch matrix limited — not asserted |
| Mouseup-after-open cancel (`cancel-open`) when release outside | Wired (AbortController + grace); flaky in jsdom — deferred assertion |
| Outside-press 500ms grace after open | Root implements; not separately tested beyond open path |
| Item mouseup-to-select / initialCursorPoint click-guard | Upstream `useMenuItemCommonProps` polish — Lite click-only |
| InternalBackdrop + `internalBackdropRef` | Not rendered in Solid Menu Positioner yet; backdropRef wired |
| Full Floating UI collision / shift for cursor menus | Lite `useFloating` + fixed strategy |
| Detached `createHandle` on Context Menu | Omitted from Root props (upstream 1.7.0) |
| Menubar | Sibling package — out of scope |

## Explicitly out of this PR

- Menubar package
- Full Floating UI interaction merge (inherits Menu Lite)
