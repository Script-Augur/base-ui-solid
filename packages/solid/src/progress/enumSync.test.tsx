/**
 * Port of `@base-ui/react` Progress enum sync tests (v1.7.0).
 */
import { describe, expect, it } from 'vitest'

import { ProgressIndicatorDataAttributes } from './indicator/ProgressIndicatorDataAttributes'
import { ProgressLabelDataAttributes } from './label/ProgressLabelDataAttributes'
import { ProgressRootDataAttributes } from './root/ProgressRootDataAttributes'
import { progressStateAttributesMapping } from './root/stateAttributesMapping'
import { ProgressTrackDataAttributes } from './track/ProgressTrackDataAttributes'
import { ProgressValueDataAttributes } from './value/ProgressValueDataAttributes'

const partDataAttributes = [
  ['Root', ProgressRootDataAttributes],
  ['Indicator', ProgressIndicatorDataAttributes],
  ['Label', ProgressLabelDataAttributes],
  ['Track', ProgressTrackDataAttributes],
  ['Value', ProgressValueDataAttributes],
] as const

describe('Progress enum sync', () => {
  describe.each(partDataAttributes)('%s', (_part, dataAttributes) => {
    it.each(['indeterminate', 'progressing', 'complete'] as const)(
      'names the %s data attribute per Progress%sDataAttributes',
      status => {
        const emitted = progressStateAttributesMapping.status(status)

        expect(Object.keys(emitted)).toEqual([dataAttributes[status]])
      }
    )
  })
})
