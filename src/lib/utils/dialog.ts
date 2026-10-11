/** Restore opener focus when a modal is unmounted. */
export function showModal(dialog: HTMLDialogElement): () => void {
  const opener = document.activeElement
  dialog.showModal()
  return () => {
    dialog.close()
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
  }
}
