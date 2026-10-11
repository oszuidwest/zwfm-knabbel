/** Restore opener focus when a modal is unmounted. */
export function showModal(dialog: HTMLDialogElement): () => void {
  const opener = document.activeElement
  dialog.showModal()
  // Svelte removes the dialog before this runs, which already takes it out of the top layer.
  // close() would only fire a late close event, and the browser's own focus return has no effect.
  return () => {
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
  }
}
