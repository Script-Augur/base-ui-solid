# Menu foundation gaps (popup store)

This folder ports shared createHandle / popup-store pieces from
`@base-ui/react@1.7.0`. Dialog/Popover can ship on the hybrid open bridge
(`OPEN_PIPELINE.md`). Menu fills the floating path below (see Menu PR).

## Already in place for Menu

| Piece | Status |
| ----- | ------ |
| `BasePopupHandle` / attach stack | done |
| `PopupTriggerMap` + trigger data forwarding | done |
| `SolidStore` / `NullStore` / `select` / `useState` | done |
| `SolidStore.observe` (selector or projector) | done |
| `PopupStoreState.floatingRootContext` / `floatingId` slots | typed + defaulted |
| Active-trigger sync + outside-press helper | done |
| `FloatingRootStore` / `createPopupFloatingRootContext` / `getEmptyRootContext` | done (Menu PR) |
| `FloatingTreeStore` + event emitter | done (Menu PR) |
| `createSyncedFloatingRootContext` | done (Menu PR) |

## Still deferred / Lite in Menu

| Upstream | Gap | Notes |
| -------- | --- | ----- |
| Full `useListNavigation` / `useTypeahead` / `useDismiss` floating hooks | Lite keyboard + typeahead + Solid `createDismiss` in MenuRoot | Full Floating UI interaction merge deferred |
| `useTriggerFocusGuards` / `inlineRect` | Not ported | Context-menu positioning polish |
| `applyPopupOpenChange` shared helper | Menu Root owns setOpen (upstream also inlines Menu specifics) | Optional consolidate later |
| Full `FloatingTree` React component / node ids | Lite tree store + **Menu writes `floatingNodeId` / `floatingParentNodeId`** + submenu parent observe | Full FloatingNode / safePolygon deferred; Menubar / Context Menu own more |
| Menu `Handle.open(triggerId: string)` | **done** — required string id | |

## Rule

Do **not** fork `PopupStoreState` in `menu/store` to invent parallel floating
fields. Extend the shared types here (or fill `floatingRootContext`) so Dialog /
Popover / Menu stay one family.
