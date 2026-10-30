import { notifyMutationError } from '$lib/api/client'
import { toast } from '$lib/stores/toast'

interface DeleteOptions {
  name: string
  /** Extra paragraph below the confirm question. */
  warning?: string
  deleteFn: () => Promise<unknown>
  onSuccess?: () => void | Promise<void>
  successMessage?: string
  errorMessage?: string
}

export async function deleteWithConfirm({
  name,
  warning,
  deleteFn,
  onSuccess,
  successMessage = 'Verwijderd',
  errorMessage = 'Verwijderen mislukt',
}: DeleteOptions): Promise<void> {
  const question = `Weet je zeker dat je "${name}" wilt verwijderen?`
  if (!confirm(warning ? `${question}\n\n${warning}` : question)) return

  try {
    await deleteFn()
    toast.success(successMessage)
    await onSuccess?.()
  } catch (err) {
    notifyMutationError(err, errorMessage)
  }
}
