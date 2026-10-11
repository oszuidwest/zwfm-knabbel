/**
 * showModal is an attachment that opens a <dialog> as a modal while it is
 * mounted. A modal dialog makes the page behind it inert and keeps Tab inside.
 * These dialogs are removed rather than closed, so the teardown returns focus
 * to the element that opened them.
 */
export function showModal(dialog: HTMLDialogElement): () => void {
  const opener = document.activeElement
  dialog.showModal()
  return () => {
    dialog.close()
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
  }
}
