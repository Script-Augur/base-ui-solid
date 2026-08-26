export * as Tabs from './index.parts'

export { TabsRoot } from './root/TabsRoot'
export { TabsRootDataAttributes } from './root/TabsRootDataAttributes'
export { TabsRootContext, useTabsRootContext } from './root/TabsRootContext'
export { TabsList } from './list/TabsList'
export { TabsListDataAttributes } from './list/TabsListDataAttributes'
export { TabsListContext, useTabsListContext } from './list/TabsListContext'
export { TabTrigger } from './trigger/TabTrigger'
export { TabTriggerDataAttributes } from './trigger/TabTriggerDataAttributes'
export { TabsPanel } from './panel/TabsPanel'
export { TabsPanelDataAttributes } from './panel/TabsPanelDataAttributes'
export { TabsIndicator } from './indicator/TabsIndicator'
export { TabsIndicatorDataAttributes } from './indicator/TabsIndicatorDataAttributes'
export { TabsIndicatorCssVars } from './indicator/TabsIndicatorCssVars'

export type {
  TabsRootChangeEventDetails,
  TabsRootChangeEventReason,
  TabsRootProps,
  TabsRootState,
  TabsValue,
} from './root/TabsRoot'
export type { TabsRootContextValue } from './root/TabsRootContext'
export type { TabsListProps, TabsListState } from './list/TabsList'
export type { TabsListContextValue } from './list/TabsListContext'
export type {
  TabsActivationDirection,
  TabTriggerMetadata,
  TabsIndicatorPosition,
  TabTriggerProps,
  TabsIndicatorSize,
  TabTriggerState,
} from './trigger/TabTrigger'
export type { TabsPanelProps, TabsPanelState } from './panel/TabsPanel'
export type {
  TabsIndicatorProps,
  TabsIndicatorState,
} from './indicator/TabsIndicator'
