/**
 * Returns the default button a browser uses for implicit form submission.
 *
 * Useful for custom form controls that need to mirror native Enter key behavior.
 * Clicking the returned submitter preserves browser semantics such as the
 * submitter's click event, `SubmitEvent.submitter`, and submitter-specific
 * attributes.
 *
 * Follows the controls exposed by `form.elements`, which includes controls
 * associated through the `form` attribute. Disabled submitters can be returned
 * because the default button is determined before disabled state is considered;
 * clicking a disabled submitter is a no-op.
 *
 * Matches `@base-ui/utils/getDefaultFormSubmitter`.
 *
 * @param form - Form whose default submitter should be resolved.
 * @returns The default submit control, or `null` when none exists.
 */
export function getDefaultFormSubmitter(
  form: HTMLFormElement | null
): DefaultFormSubmitter | null {
  if (!form) {
    return null
  }

  for (const candidate of form.elements) {
    const tagName = candidate.tagName
    if (tagName === 'BUTTON' || tagName === 'INPUT') {
      const button = candidate as DefaultFormSubmitter

      // Intentionally excludes input[type="image"]: Chromium omits it from
      // form.elements, so supporting it would require separate traversal.
      if (button.type === 'submit') {
        return button
      }
    }
  }

  return null
}
export type DefaultFormSubmitter = HTMLButtonElement | HTMLInputElement
