import { splitProps } from 'solid-js'

import { MenuItem } from '../item/MenuItem'

import type { MenuItemProps, MenuItemState } from '../item/MenuItem'
import type { JSX } from 'solid-js'

/**
 * A menu item rendered as a link (`<a>`).
 * `closeOnClick` defaults to `false`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuLinkItem(componentProps: MenuLinkItemProps): JSX.Element {
  const [local, rest] = splitProps(componentProps, ['closeOnClick', 'render'])

  return (
    <MenuItem
      {...rest}
      closeOnClick={local.closeOnClick ?? false}
      nativeButton={false}
      render={
        local.render ??
        ((props: Record<string, unknown>) => <a {...props} />)
      }
    />
  )
}

/** Props for {@link MenuLinkItem}. */
export type MenuLinkItemProps = Omit<MenuItemProps, 'nativeButton'> &
  JSX.AnchorHTMLAttributes<HTMLAnchorElement> & {
    /**
     * @default false
     */
    closeOnClick?: boolean
  }

/** Public state for {@link MenuLinkItem}. */
export type MenuLinkItemState = MenuItemState
