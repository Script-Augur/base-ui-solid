# Form upstream test parity

Pinned upstream: `@base-ui/react@1.7.0` (`packages/react/src/form/Form.test.tsx`).

Core Form behavior with Field / Fieldset is covered. This is **not** a claim of full upstream suite parity — several control-specific and React-only cases remain deferred.

## Skipped (React-only or deferred controls)

| Upstream case                                       | Reason                                                                                                                                                                           |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `describeConformance`                               | React conformance harness — skipped                                                                                                                                              |
| Checkbox focus / reorder cases                      | Document-order focus covered with Field.Control; Checkbox PR adds control surface + some Field/Form wiring, not Form’s remaining portal/shadow focus cases — those stay deferred |
| Switch unnamed / same-name / control takeover cases | Switch not ported yet; unnamed + same-name covered with `Field.Control` where equivalent                                                                                         |
| `onFormSubmit` NumberField quantity value           | NumberField not ported; covered with `Field.Control` values                                                                                                                      |
| `actionsRef` NumberField validate-by-name           | NumberField not ported; covered with `Field.Control` + custom `validate`                                                                                                         |
| React Strict Mode registration replacement          | React StrictMode double-mount; Solid covers rename / unmount / replace without StrictMode                                                                                        |

## Ported without Checkbox / Base UI Portal

| Upstream case                                             | Solid adaptation                                                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Registration-order focus across disconnected shadow roots | `solid-js/web` `Portal` + `Field.Control` into two open shadow roots (no Checkbox required)               |
| Document-order focus after keyed reorder                  | Solid `<For>` preserves field identity so registry Map order diverges from DOM order (not a plain `.map`) |

## Solid adaptations

- Dynamic prop updates use `createSignal` instead of React `setState`.
- Conditional fields use Solid `Show` instead of React conditional render.
- Form context `errors` remains an `Accessor` (already required by Field).
- `validationMode` on context is exposed via a reactive getter over props.
- Imperative `actionsRef` cleared on unmount (matches Field).

## Parity status

All other upstream behavioral Form cases that only need Field / Fieldset are ported in `Form.test.tsx`. Remaining skips are Checkbox / Switch / NumberField control surfaces and React StrictMode / conformance.
