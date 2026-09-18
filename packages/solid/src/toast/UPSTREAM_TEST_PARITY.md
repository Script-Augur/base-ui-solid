# Toast upstream test parity

Pinned upstream: `@base-ui/react@1.7.0` (`packages/react/src/toast/**`).

## Summary

| Area                                                              | Status                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| `ToastStore` metadata, limit flags, close-all, updateKey          | **Covered**                                              |
| Store default auto-dismiss (Provider `timeout`, fake rAF)         | **Covered** (default path only — see below)              |
| Provider / `useToastManager` add · close · promise success        | **Covered**                                              |
| `createToastManager` bridge add / update / close                  | **Covered** (no manager `promise()` / manager close-all) |
| Viewport expand (`data-expanded` on mouse enter)                  | **Covered**                                              |
| Root Close + Title/Description `aria-*` ids                       | **Covered**                                              |
| `store.select` Solid tracking                                     | **Covered** (`createEffect` consumer)                    |
| Positioner + Arrow mount with anchor                              | **Smoke only** (Lite stubs — see below)                  |
| Full Root swipe / pointer / iOS matrix                            | **Deferred**                                             |
| Full Viewport F6 / focus-guard / touch / window-blur              | **Deferred**                                             |
| Positioner collision / available·anchor CSS vars / `anchorHidden` | **Lite stubs** (not implemented)                         |
| `describeConformance` / `*.spec.tsx`                              | **Not ported** (React harness)                           |
| High-priority SR announcement edge cases                          | **Deferred**                                             |

## Covered here (`Toast.test.tsx`)

- Store metadata sync, ending-height ignore, close-all, limit flags, updateKey
- Provider add + **default 5s auto-dismiss only** (fake rAF). Does **not** cover pause-on-hover, resume-on-leave, window blur/focus, `timeout: 0` never-dismiss, or `type: 'loading'` timer skip
- Manager `close()` without id closes all (via Provider / `useToastManager`, not only the imperative manager)
- Limit marks older toasts `limited`
- `promise()` loading → success description (via `useToastManager`, not `createToastManager.promise`)
- Viewport `data-expanded` on mouse enter
- Close button dismisses; title/description ids on root
- `createToastManager` **add / update / close** bridge only
- `store.select` re-runs a `createEffect` tracking consumer after `addToast`
- Positioner + Arrow mount against an anchor element (jsdom; placement static)

## Positioner / Arrow Lite stubs

Public surface includes Positioner + Arrow for API shape parity with 1.7.0. Behavior is **Lite** via `useFloating` (flip/shift/offset/arrow only; jsdom uses static `0,0` placement):

| Declared API                                                                                                                    | Solid behavior                 |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `--available-width` / `--available-height` (`ToastPositionerCssVars`)                                                           | **Not written** onto styles    |
| `--anchor-width` / `--anchor-height`                                                                                            | **Not written** onto styles    |
| `--transform-origin`                                                                                                            | Written (align + side)         |
| `state.anchorHidden` → `data-anchor-hidden`                                                                                     | Always `false`                 |
| `collisionBoundary`, `collisionPadding`, `arrowPadding`, `sticky`, `alignOffset`, `disableAnchorTracking`, `collisionAvoidance` | Accepted then ignored (`void`) |

Do **not** style against `--available-*` / `--anchor-*` or rely on `data-anchor-hidden` until a follow-up wires size/hide middleware.

## Untested parts (no suite coverage yet)

- `Toast.Content` (`data-behind` / `data-expanded`)
- `Toast.Action` / `actionProps` merge
- `Toast.Portal` container mounting
- Positioner collision / CSS-var / `anchorHidden` behavior (stubs only)
- Arrow uncentered / arrow CSS placement matrix
- High-priority visually hidden `role="alert"` region
- F6 / focus-guard / shift-tab restore / document pointerdown outside viewport
- Swipe dismiss directions, reverse-cancel, damping, ignore selectors
- `createToastManager.promise` and manager-driven close-all
- `recalculateHeight(flushSync)` — Solid has no React `flushSync`; arg ignored (Lite)

## Deferred (upstream still source of truth)

- Swipe dismiss directions, reverse-cancel, damping, ignore selectors
- Touch pause / document pointerdown outside viewport
- F6 focus viewport, focus guards, shift-tab restore
- Window blur / focus timer pause-resume edge cases
- Full anchored positioner size middleware + arrow uncentered matrix
- Action renderable-children + `actionProps` merge edge cases
- Enum sync / type-level `*.spec.tsx`

Do **not** treat the Solid suite as complete parity with upstream Root/Viewport/Positioner tests.
