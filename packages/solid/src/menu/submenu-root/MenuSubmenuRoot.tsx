import { splitProps } from 'solid-js'

import { MenuRoot } from '../root/MenuRoot'
import { useMenuRootContext } from '../root/MenuRootContext'

import { MenuSubmenuRootContext } from './MenuSubmenuRootContext'

import type { MenuRootProps } from '../root/MenuRoot'
import type { JSX } from 'solid-js'

/**
 * Groups all parts of a submenu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 *
 * @param componentProps - Submenu root props (same as Root minus modal/handle/trigger ids).
 * @returns Nested menu context.
 */
export function MenuSubmenuRoot(
  componentProps: MenuSubmenuRootProps
): JSX.Element {
  const parent = useMenuRootContext()
  const [local, rest] = splitProps(componentProps, [])

  void local

  return (
    <MenuSubmenuRootContext.Provider value={{ parentMenu: parent.store }}>
      <MenuRoot {...rest} modal={undefined} handle={undefined} />
    </MenuSubmenuRootContext.Provider>
  )
}

/** Props for {@link MenuSubmenuRoot}. */
export type MenuSubmenuRootProps = Omit<
  MenuRootProps,
  'modal' | 'handle' | 'triggerId' | 'defaultTriggerId'
>
