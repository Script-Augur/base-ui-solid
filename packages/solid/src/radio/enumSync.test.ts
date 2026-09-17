import { describe, expect, it } from 'vitest'

import { RadioRootDataAttributes } from './root/RadioRootDataAttributes'
import { stateAttributesMapping } from './utils/stateAttributesMapping'

// The state-attribute mapping inlines these enum members as string literals so
// `RadioRootDataAttributes` tree-shakes out of the bundle (it is kept for
// types/docs only). Nothing else links the literals to the enum, so re-link
// them here: renaming only one side fails CI.
describe('Radio enum sync', () => {
  it('names the checked/unchecked data-attributes per RadioRootDataAttributes', () => {
    expect(Object.keys(stateAttributesMapping.checked!(true)!)[0]).toBe(
      RadioRootDataAttributes.checked
    )
    expect(Object.keys(stateAttributesMapping.checked!(false)!)[0]).toBe(
      RadioRootDataAttributes.unchecked
    )
  })
})
