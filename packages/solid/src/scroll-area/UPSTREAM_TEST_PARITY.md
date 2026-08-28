# Scroll Area upstream test parity

Pinned upstream: `@base-ui/react@1.7.0` (`packages/react/src/scroll-area`, verified `git describe` → `v1.7.0`).

## Skipped (React-only or not applicable in Solid/jsdom)

| Upstream file                            | Case                                                   | Reason                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `*/ScrollArea*.test.tsx`                 | `describeConformance`                                  | React conformance harness — skipped for Root, Viewport, Content, Scrollbar, Thumb, Corner                                          |
| `root/ScrollAreaRoot.test.tsx`           | `sizing` suite                                         | Browser layout (`describe.skipIf(isJSDOM)`) — Storybook: VerticalOverflow / BothAxes                                               |
| `root/ScrollAreaRoot.test.tsx`           | `overflow data attributes` suite                       | Browser layout / RTL metrics — Storybook: OverflowEdgesQA, Rtl                                                                     |
| `root/ScrollAreaRoot.test.tsx`           | `context stability`                                    | React re-render counting — Solid updates are fine-grained; not ported                                                              |
| `viewport/ScrollAreaViewport.test.tsx`   | touch modality `data-scrolling` cases (2)              | jsdom/`fireEvent` does not reliably deliver `pointerType` to Solid handlers — Storybook QA                                         |
| `viewport/ScrollAreaViewport.test.tsx`   | `subtree animations`                                   | Browser `getAnimations` — Storybook / future browser suite                                                                         |
| `viewport/ScrollAreaViewport.test.tsx`   | `overflow data attributes (viewport)`                  | Browser layout — Storybook: OverflowEdgesQA                                                                                        |
| `viewport/ScrollAreaViewport.test.tsx`   | `overscroll feedback`                                  | Safari rubber-band / layout — Storybook QA                                                                                         |
| `scrollbar/ScrollAreaScrollbar.test.tsx` | wheel scroll/clamp/preventDefault/mark-scrolling (7)   | jsdom + Solid `createEffect` wheel binding is unreliable in the suite harness (isolated dispatch works); Storybook: BothAxes / Rtl |
| `scrollbar/ScrollAreaScrollbar.test.tsx` | `ignores non-primary pointer presses`                  | jsdom lacks `PointerEvent` / `button` delivery to Solid handlers — Storybook                                                       |
| `thumb/ScrollAreaThumb.test.tsx`         | `ignores non-primary pointer presses`                  | Same jsdom PointerEvent limitation — Storybook                                                                                     |
| `scrollbar/ScrollAreaScrollbar.test.tsx` | `track click by axis`                                  | Browser geometry — Storybook: BothAxes                                                                                             |
| `scrollbar/ScrollAreaScrollbar.test.tsx` | `scroll snap on track press`                           | Browser layout — Storybook                                                                                                         |
| `scrollbar/ScrollAreaScrollbar.test.tsx` | `non-positive thumb offset`                            | Browser geometry — Storybook                                                                                                       |
| `scrollbar/ScrollAreaScrollbar.test.tsx` | `data overflow attributes`                             | Browser layout — Storybook: OverflowEdgesQA                                                                                        |
| `scrollbar/ScrollAreaScrollbar.test.tsx` | `registers after horizontal scrollbar becomes visible` | Browser-only wheel registration case                                                                                               |
| `thumb/ScrollAreaThumb.test.tsx`         | `horizontal dragging`                                  | Browser layout / RTL drag — Storybook: HorizontalOverflow, Rtl                                                                     |
| `thumb/ScrollAreaThumb.test.tsx`         | complex drag layout cases under `skipIf(isJSDOM)`      | Same                                                                                                                               |
| `content/ScrollAreaContent.test.tsx`     | `recomputes overflow when observed content resizes`    | Browser ResizeObserver layout — Storybook                                                                                          |
| `corner/ScrollAreaCorner.test.tsx`       | `interactions`                                         | Browser computed corner size — Storybook: BothAxes                                                                                 |
| `enumSync.test.tsx`                      | overflow CSS vars on viewport                          | Upstream `it.skipIf(isJSDOM)` — Storybook: OverflowEdgesQA                                                                         |

## Intentionally omitted props (document as Solid divergence)

| Upstream API                                                           | Status                                                                                                                  |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| CSP `nonce` / `disableStyleElements` on scrollbar stylesheet injection | Omitted — no CSP provider in this package yet. Style tag is injected via `ensureDisableScrollbarStyle()` without nonce. |

## Solid adaptations

- Signal naming uses `[foo, fooAssign]` (see `AGENTS.md`).
- DOM refs are a mutable `refs` bag on root context (not React `RefObject`).
- Pointer handlers use native `PointerEvent` (Solid does not wrap synthetic events); track clicks use `getTarget(event)` directly.
- `Timeout` from `@script-augur/base-ui-utils` (rAF-based); scroll-timeout tests use a controllable rAF clock (`test-utils.ts`).
- Dynamic mount/unmount cases use `createSignal` + `Show` instead of React `useState` / `flushSync`.
- Context guard tests use synchronous `expect(() => render(...)).toThrow(...)`.
- `normalizeScrollOffset` / `SCROLL_EDGE_TOLERANCE_PX` live in `@script-augur/base-ui-utils`.
- WebKit engine check for CSS `registerProperty` uses a minimal `platform.engine.webkit` stub in utils.

## Parity status

Ported jsdom-runnable behavioral cases for Root (`data-scrolling`), Viewport (context + most `data-scrolling` + unmount), Scrollbar (hovering, track press guards, remaining wheel edge cases that don’t need scroll mutation), Thumb (context, unmount, snap latching, cancel, `data-scrolling`), Content (context + custom render), Corner (smoke), and enum sync (jsdom cases). Browser-only suites and flaky jsdom wheel/pointer cases are skipped with Storybook coverage noted above.
