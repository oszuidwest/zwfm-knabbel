import { toast } from '$lib/stores/toast'

interface DeleteOptions {
  name: string
  deleteFn: () => Promise<unknown>
  onSuccess?: () => void | Promise<void>
  successMessage?: string
  errorMessage?: string
}

/**
 * Handles delete operation with confirmation and toast notifications
 */
export async function deleteWithConfirm({
  name,
  deleteFn,
  onSuccess,
  successMessage = 'Verwijderd',
  errorMessage = 'Verwijderen mislukt',
}: DeleteOptions): Promise<void> {
  if (!confirm(`Weet je zeker dat je "${name}" wilt verwijderen?`)) return

  try {
    await deleteFn()
    toast.success(successMessage)
    await onSuccess?.()
  } catch {
    toast.error(errorMessage)
  }
}
