# Popup open-pipeline contract (Solid)

Dialog and Popover Roots currently use a **hybrid** open pipeline. Menu must **not**
copy it blindly.

## Dialog / Popover (current)

1. UI open lives in `createControlled` (`open` / `openAssign`).
2. A `SolidStore` holds handle/trigger state (`activeTriggerElement`, payload, …).
3. Root defines a closure `setOpen` that:
   - calls `onOpenChange`
   - updates `openAssign`
   - applies `setPopupOpenState` + `store.update`
4. After construction, Root **overwrites** `store.setOpen = setOpen` so handle /
   detached triggers that call `store.setOpen` share the same pipeline.

Class-level `DialogStore.setOpen` / `PopoverStore.setOpen` exist for inert handle
fallbacks and as a reference implementation; once a Root attaches, the Root
closure is authoritative. Do not treat the class body as the live Menu template.

## Menu (required)

Upstream Menu is store-first:

- `MenuStore.setOpen` emits through `floatingRootContext` (`events.emit('setOpen', …)`
  / `dispatchOpenChange`).
- There is **no** second controlled open signal owning the pipeline.
- Shared helpers (`applyPopupOpenChange`) stay on the store / floating path.

**Do not** overwrite `store.setOpen` from a Menu Root with a `createControlled`
bridge. Wire `floatingRootContext` (see `MENU_GAPS.md`) and keep open as a store
(+ floating) concern; derive UI from `store.select('open')` / `useState('open')`.

## Shared rules for all overlays

- Store `activeTriggerElement` + `triggerElements` are the source of truth for
  the live reference. Root `triggerElement` is synced from the store via
  `createActiveTriggerElementSync` so Portal / Positioner / focus / dismiss stay
  correct for detached triggers.
- Outside-press must ignore registered triggers (`isEventOnPopupTrigger`).
