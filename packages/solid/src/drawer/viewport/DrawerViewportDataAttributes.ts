export enum DrawerViewportDataAttributes {
  /**
   * Present when the drawer is open.
   */
  open = 'data-open',
  /**
   * Present when the drawer is closed.
   */
  closed = 'data-closed',
  /**
   * Present when the drawer begins animating in.
   */
  startingStyle = 'data-starting-style',
  /**
   * Present when the drawer is animating out.
   */
  endingStyle = 'data-ending-style',
  /**
   * Present when the drawer is nested within another drawer.
   */
  nested = 'data-nested',
  /**
   * Dialog nested-open attribute — **suppressed** on Drawer.Viewport
   * (upstream clears it; drawer nesting uses Popup `data-nested-drawer-open`).
   */
  nestedDialogOpen = 'data-nested-dialog-open',
}
