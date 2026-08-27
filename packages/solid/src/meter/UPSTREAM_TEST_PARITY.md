# Meter upstream test parity

Pinned upstream: `@base-ui/react@1.7.0` (`packages/react/src/meter`).

## Skipped (React-only or not applicable in Solid/jsdom)

| Upstream file                       | Case                  | Reason                                                                                       |
| ----------------------------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| `*/Meter*.test.tsx`                 | `describeConformance` | React conformance harness — skipped for all parts (Root, Track, Indicator, Label, Value)     |
| `indicator/MeterIndicator.test.tsx` | `internal styles` (2) | Browser computed-style assertions (`describe.skipIf(isJSDOM)`) — cover manually in Storybook |

## Solid adaptations

- Dynamic prop updates use `createSignal` instead of React `setProps`.
- Context guard tests use synchronous `expect(() => render(...)).toThrow(...)`.
- Label association test uses Solid `Show` instead of React conditional render.

## Parity status

All other upstream behavioral cases in `MeterRoot.test.tsx`, `MeterIndicator.test.tsx`, `MeterLabel.test.tsx`, and `MeterValue.test.tsx` are ported. `MeterTrack.test.tsx` is conformance-only upstream.
