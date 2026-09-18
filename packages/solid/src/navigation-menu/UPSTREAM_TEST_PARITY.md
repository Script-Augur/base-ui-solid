# Navigation Menu — upstream test parity

Upstream reference: `@base-ui/react@1.7.0` `NavigationMenu` (`Root`, `List`,
`Item`, `Content`, `Trigger`, `Portal`, `Positioner`, `Viewport`, `Backdrop`,
`Popup`, `Arrow`, `Link`, `Icon`).

This port is a **Lite** Navigation Menu (same approach as Popover / Preview
Card): no `FloatingTree` / `useHover` / `useClick` / `safePolygon` from
floating-ui-react. Status rows below match what `NavigationMenu.test.tsx`
actually asserts unless marked deferred / untested.

## Covered here (asserted)

| Behavior                                                                  | Status         |
| ------------------------------------------------------------------------- | -------------- |
| Controlled / uncontrolled `value` + `onValueChange`                       | covered        |
| `onValueChange` `cancel()`                                                | covered        |
| Open derived from `value != null`                                         | covered        |
| Trigger click toggle                                                      | covered        |
| Trigger `aria-controls` → popup id when active                            | covered        |
| Escape dismiss via List                                                   | covered        |
| Outside-press dismiss (trigger-only ignore; list chrome dismisses)        | covered        |
| Link `closeOnClick` with `link-press` reason                              | covered        |
| Trigger hover open after `delay`                                          | covered (Lite) |
| Lite hover bridge: popup/positioner/viewport `pointerenter` cancels close | covered (Lite) |
| Hover leave closes when pointer never reaches popup                       | covered (Lite) |
| Patient click / `stickIfOpen` after hover-open                            | covered (Lite) |
| Horizontal open key `ArrowDown`                                           | covered        |
| Vertical open key `ArrowRight` / RTL `ArrowLeft`                          | covered        |
| Nested triggers do not intercept arrow-open keys                          | covered        |
| Trigger blur → `focusOut` via Lite `isOutsideMenuEvent`                   | covered        |

## Present but untested / partial

| Behavior                                                 | Notes                                                      |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| Content portals into Viewport when active                | Wired; exercised indirectly by open tests                  |
| Content `keepMounted`                                    | Wired; no dedicated assertion                              |
| Positioner `useFloating` against active trigger          | Wired; no placement matrix tests                           |
| Portal / Backdrop / Arrow / Icon                         | Exported / rendered; no dedicated assertions               |
| List `CompositeRoot` arrow-key roving                    | Wired for top-level lists; no dedicated assertion          |
| Nested root via parent context + nested link-press close | Nested arrow skip tested; link-press parent close untested |
| Basic popup size CSS vars / MutationObserver auto-size   | Wired Lite; untested                                       |

## Deferred

| Behavior                                                                    | Notes                                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Full `FloatingTree` / `FloatingNode` nesting                                | Nested detection uses optional parent Root context only                |
| `safePolygon` hover close                                                   | Lite bridge cancels close on floating `pointerenter`; no polygon       |
| Full floating-ui `useHover` / `useClick` interaction stack                  | Manual timers + click toggle                                           |
| Nested `FloatingNode` content trees                                         | Content uses Solid `Portal` into Viewport only                         |
| Full auto-size matrix (interrupted mutation resize, animation finish reset) | Lite CSS vars + MutationObserver                                       |
| Focus guards inside Viewport / Popup                                        | Deferred — keyboard open leaves focus on Trigger (no focus-into-popup) |
| `viewportInert` / viewport target element split                             | Deferred                                                               |
| Close transition fixed-size freeze on positioner                            | Deferred                                                               |
| `collisionAvoidance` / sticky / boundary matrix                             | Accepted for API parity; Floating UI flip/shift defaults               |
| Intentional vs sloppy outside-press                                         | Solid uses `pointerdown`                                               |
| Shadow DOM outside-press matrix                                             | jsdom coverage limited                                                 |
| Full `onOpenChangeComplete` animation matrix                                | Wired via `createOpenChangeComplete`; CSS cases deferred               |
