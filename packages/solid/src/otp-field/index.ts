export * as OTPField from './index.parts'

export type * from './root/OTPFieldRoot'
export type * from './input/OTPFieldInput'

export { OTPFieldRoot } from './root/OTPFieldRoot'
export { OTPFieldRootDataAttributes } from './root/OTPFieldRootDataAttributes'
export {
  OTPFieldRootContext,
  useOTPFieldRootContext,
  getOTPFieldInputState,
} from './root/OTPFieldRootContext'
export { OTPFieldInput } from './input/OTPFieldInput'
export { OTPFieldInputDataAttributes } from './input/OTPFieldInputDataAttributes'
