# Internals — upstream test parity

Pinned against `@base-ui/react@1.7.0` (`UPSTREAM.md`).

Sources:

- `packages/react/src/use-render/useRender.test.tsx`
- `packages/react/src/internals/useRenderElement.test.tsx`

## Ported

| Upstream area                   | Solid file              | Notes                                         |
| ------------------------------- | ----------------------- | --------------------------------------------- |
| Default tag / render override   | `createRender.test.tsx` | `defaultTagName` → `defaultElement`           |
| Render callback class merge     | `createRender.test.tsx` | Uses Solid `class`                            |
| Ref forwarding (single + array) | `createRender.test.tsx` | Callback refs + `{ current }` objects         |
| State → `data-*` attributes     | `createRender.test.tsx` | Via `getStateAttributesProps`                 |
| Custom `stateAttributesMapping` | `createRender.test.tsx` |                                               |
| Class/style state functions     | `createRender.test.tsx` |                                               |
| `mergeProps` event prevention   | `createRender.test.tsx` | Native DOM events + `preventBaseUIHandler`    |
| `enabled: false`                | `createRender.test.tsx` | Returns `undefined` (Solid) vs `null` (React) |
| JSX-element `render` prop merge | `createRender.test.tsx` | `Dynamic` instead of `cloneElement`           |
| Default `button` / `img` attrs  | `createRender.test.tsx` | `type="button"`, `alt=""`                     |
| Solid reactive getters          | `createRender.test.tsx` | No upstream equivalent                        |

## Skipped

| Upstream test                                                                      | Reason                                                             |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `warns when render is passed a function with an uppercase name`                    | Dev-only `console.warn` parity deferred; behavior is valid         |
| `warns when render is passed a function with an uppercase acronym prefix`          | Same                                                               |
| `does not warn when render is passed a lowercase callback`                         | Same                                                               |
| `does not warn when render is passed a screaming snake case callback`              | Same                                                               |
| `does not warn when render is passed a callback with an inferred useCallback name` | Same                                                               |
| `does not warn when render is passed as a React element`                           | Same                                                               |
| `handles lazy elements`                                                            | React.lazy / Suspense — no Solid equivalent in this slice          |
| `throws error for invalid render element in development`                           | React `isValidElement` guard — Solid JSX elements differ           |
| `makes obscure single-prop events preventable`                                     | Covered by same merge logic as `onMouseDown`; omitted as duplicate |
| `makes obscure multi-prop array events preventable`                                | Same                                                               |
| `defaultTagName` switch (div→span)                                                 | `createRender.test.tsx`                                            | **Skipped** — `Dynamic` tag swap not reliable in jsdom                          |
| `enabled` toggle across rerenders                                                  | `createRender.test.tsx`                                            | **Skipped** — use parent `Show`/conditional; `enabled: false` lazy path covered |
| `merges className function with render element`                                    | Covered by class merge + render element tests                      |
| `merges style function with render element`                                        | Covered by style merge + render element tests                      |
| `EMPTY_OBJECT mutation safety`                                                     | React frozen-object edge case; Solid uses plain objects            |

## Solid divergences (intentional)

- **`enabled: false`** returns `undefined` instead of React `null`.
- **Attribute name** `class` in Solid JSX vs React `className` (both accepted in merge layer).
- **Reactivity** uses `mergeProps` getters + parent re-render; upstream re-clones elements each render.
- **Components** still pass many `data-*` attrs manually; automatic state mapping is opt-in via `mapStateToDataAttributes: true` (defaults `false`) so existing parts are unchanged.
- **React JSX element `render` prop** → use `render={(props) => <span {...props} />}` or `{ component: 'span', props }` descriptor in Solid.
