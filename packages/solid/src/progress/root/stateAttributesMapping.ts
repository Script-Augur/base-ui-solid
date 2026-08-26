import type { ProgressStatus } from './ProgressRoot'

export const progressStateAttributesMapping = {
  status(value: ProgressStatus): Record<string, string> {
    return { [`data-${value}`]: '' }
  },
}
