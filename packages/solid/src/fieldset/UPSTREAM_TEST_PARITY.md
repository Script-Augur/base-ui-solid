# Fieldset upstream test parity

Pinned upstream: `@base-ui/react@1.7.0` (`packages/react/src/fieldset`).

## Skipped (React-only or not applicable in Solid/jsdom)

| Upstream file                    | Case                                                                | Reason                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `root/FieldsetRoot.test.tsx`     | `describeConformance`                                               | React conformance harness — skipped                                                                      |
| `root/FieldsetRoot.test.tsx`     | `passes disabled to rendered Base UI roots` (Radio/Checkbox/Slider) | Those components are not ported yet; covered once Form controls land                                     |
| `legend/FieldsetLegend.test.tsx` | `describeConformance`                                               | React conformance harness — skipped                                                                      |
| `legend/FieldsetLegend.test.tsx` | SSR hydrate association (`skipIf(isJSDOM)`)                         | Solid has no React `hydrate` harness; client “no legend → no `aria-labelledby`” is covered in unit tests |

## Solid adaptations

- Dynamic prop updates use `createSignal` instead of React `setState`.
- Legend show/hide uses Solid `Show` instead of React conditional render.
- Context guard tests use synchronous `expect(() => render(...)).toThrow(...)`.

## Parity status

All other upstream behavioral cases in `FieldsetRoot.test.tsx` and `FieldsetLegend.test.tsx` are ported. Upstream also emits `data-disabled` on Root and Legend via state attributes; Solid adds explicit client tests for that behavior.
