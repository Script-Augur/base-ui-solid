import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useDialogRootContext } from "../dialog/root/DialogRootContext"

import { AlertDialog } from "./index"

import type {
  AlertDialogRootActions,
  AlertDialogRootChangeEventDetails,
  AlertDialogRootProps,
} from "./root/AlertDialogRoot"

afterEach(() => {
  cleanup()
  document.body.style.overflow = ""
  document.body.style.paddingRight = ""
})

describe("AlertDialog", () => {
  it("opens from the trigger and closes from Close", () => {
    render(() => <BasicAlertDialog />)

    expect(screen.queryByTestId("popup")).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Open" }))
    expect(screen.getByTestId("popup")).toBeVisible()
    expect(screen.getByRole("alertdialog")).toHaveAttribute(
      "aria-modal",
      "true",
    )

    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByTestId("popup")).toBeNull()
  })

  it("uses role=alertdialog and wires labelledby / describedby", () => {
    render(() => <BasicAlertDialog defaultOpen />)

    const popup = screen.getByRole("alertdialog")
    const title = screen.getByText("Title")
    const description = screen.getByText("Description")

    expect(popup.getAttribute("aria-labelledby")).toBe(title.id)
    expect(popup.getAttribute("aria-describedby")).toBe(description.id)
  })

  it("forces modal + disablePointerDismissal (no outside-press dismiss)", () => {
    const onOpenChange = vi.fn()
    render(() => <BasicAlertDialog defaultOpen onOpenChange={onOpenChange} />)

    expect(document.body.style.overflow).toBe("hidden")
    expect(document.querySelector("[data-base-ui-inert]")).not.toBeNull()

    fireEvent.pointerDown(screen.getByTestId("backdrop"), { button: 0 })
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole("alertdialog")).toBeVisible()

    const internal = document.querySelector("[data-base-ui-inert]")
    if (internal) {
      fireEvent.pointerDown(internal, { button: 0 })
    }
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("exposes forced root state via Dialog context", () => {
    render(() => (
      <AlertDialog.Root defaultOpen>
        <AlertDialogState data-testid="state" />
        <AlertDialog.Portal>
          <AlertDialog.Popup>Content</AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ))

    const state = screen.getByTestId("state")
    expect(state).toHaveAttribute("data-modal", "true")
    expect(state).toHaveAttribute("data-disable-pointer-dismissal", "true")
    expect(state).toHaveAttribute("data-role", "alertdialog")
  })

  it("supports controlled open + onOpenChange reasons", () => {
    const [open, openAssign] = createSignal(false)
    const onOpenChange = vi.fn(
      (next: boolean, _details: AlertDialogRootChangeEventDetails) => {
        openAssign(next)
      },
    )

    render(() => <BasicAlertDialog open={open()} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole("button", { name: "Open" }))
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe("trigger-press")

    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(onOpenChange.mock.calls[1]?.[0]).toBe(false)
    expect(onOpenChange.mock.calls[1]?.[1]?.reason).toBe("close-press")
  })

  it("closes on Escape with escape-key reason", () => {
    const onOpenChange = vi.fn()
    render(() => <BasicAlertDialog defaultOpen onOpenChange={onOpenChange} />)

    fireEvent.keyDown(document, { key: "Escape" })
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0]?.[1]?.reason).toBe("escape-key")
  })

  it("respects onOpenChange cancel()", () => {
    render(() => (
      <BasicAlertDialog
        onOpenChange={(_open, details) => {
          details.cancel()
        }}
      />
    ))

    fireEvent.click(screen.getByRole("button", { name: "Open" }))
    expect(screen.queryByTestId("popup")).toBeNull()
  })

  it("exposes preventUnmountOnClose + actionsRef.unmount", async () => {
    const actionsRef: AlertDialogRootActions = {
      unmount: () => {},
      close: () => {},
    }
    const onOpenChange = vi.fn(
      (_open: boolean, details: AlertDialogRootChangeEventDetails) => {
        details.preventUnmountOnClose?.()
      },
    )

    render(() => (
      <AlertDialog.Root
        defaultOpen
        onOpenChange={onOpenChange}
        actionsRef={actionsRef}
      >
        <AlertDialog.Trigger>Open</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Popup data-testid="popup">
            <AlertDialog.Close>Close</AlertDialog.Close>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ))

    expect(screen.getByTestId("popup")).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.getByTestId("popup")).toBeVisible()
    actionsRef.unmount()
    await waitFor(() => {
      expect(screen.queryByTestId("popup")).toBeNull()
    })
  })

  it("closes via actionsRef.close", async () => {
    const actionsRef: AlertDialogRootActions = {
      unmount: () => {},
      close: () => {},
    }

    render(() => (
      <AlertDialog.Root defaultOpen actionsRef={actionsRef}>
        <AlertDialog.Portal>
          <AlertDialog.Popup data-testid="popup" />
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ))

    expect(screen.getByTestId("popup")).toBeVisible()
    actionsRef.close()
    await waitFor(() => {
      expect(screen.queryByTestId("popup")).toBeNull()
    })
  })

  it("renders Viewport when mounted", () => {
    render(() => (
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Portal>
          <AlertDialog.Viewport data-testid="viewport">
            <AlertDialog.Popup data-testid="popup">Content</AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ))

    expect(screen.getByTestId("viewport")).toBeVisible()
    expect(screen.getByTestId("viewport")).toContainElement(
      screen.getByRole("alertdialog"),
    )
  })

  it("sets aria-haspopup=dialog on the trigger", () => {
    render(() => <BasicAlertDialog />)
    expect(screen.getByRole("button", { name: "Open" })).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    )
  })

  it("ignores cast modal / disablePointerDismissal overrides", () => {
    const onOpenChange = vi.fn()
    render(() => (
      <AlertDialog.Root
        defaultOpen
        onOpenChange={onOpenChange}
        {...({
          modal: false,
          disablePointerDismissal: false,
        } as AlertDialogRootProps)}
      >
        <AlertDialogState data-testid="state" />
        <AlertDialog.Portal>
          <AlertDialog.Backdrop data-testid="backdrop" />
          <AlertDialog.Popup data-testid="popup">Content</AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ))

    const state = screen.getByTestId("state")
    expect(state).toHaveAttribute("data-modal", "true")
    expect(state).toHaveAttribute("data-disable-pointer-dismissal", "true")
    expect(state).toHaveAttribute("data-role", "alertdialog")
    expect(document.body.style.overflow).toBe("hidden")

    fireEvent.pointerDown(screen.getByTestId("backdrop"), { button: 0 })
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole("alertdialog")).toBeVisible()
  })
})

function BasicAlertDialog(props: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (
    open: boolean,
    details: AlertDialogRootChangeEventDetails,
  ) => void
}) {
  return (
    <AlertDialog.Root {...props}>
      <AlertDialog.Trigger>Open</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop data-testid="backdrop" />
        <AlertDialog.Popup data-testid="popup">
          <AlertDialog.Title>Title</AlertDialog.Title>
          <AlertDialog.Description>Description</AlertDialog.Description>
          <AlertDialog.Close>Close</AlertDialog.Close>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

function AlertDialogState(props: { "data-testid"?: string }) {
  const context = useDialogRootContext()
  return (
    <div
      data-testid={props["data-testid"]}
      data-modal={String(context.modal())}
      data-disable-pointer-dismissal={String(context.disablePointerDismissal())}
      data-role={context.role()}
    />
  )
}
