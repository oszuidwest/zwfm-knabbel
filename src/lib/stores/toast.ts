import { writable } from 'svelte/store'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([])
  let nextId = 0
  const timers = new Map<number, ReturnType<typeof setTimeout>>()

  function add(type: ToastType, message: string, duration = 3000): void {
    const id = nextId++
    update(toasts => [...toasts, { id, type, message }])

    if (duration > 0) {
      timers.set(
        id,
        setTimeout(() => remove(id), duration)
      )
    }
  }

  function remove(id: number): void {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    update(toasts => toasts.filter(t => t.id !== id))
  }

  return {
    subscribe,
    success: (message: string, duration?: number) => add('success', message, duration),
    error: (message: string, duration?: number) => add('error', message, duration),
    info: (message: string, duration?: number) => add('info', message, duration),
    warning: (message: string, duration?: number) => add('warning', message, duration),
    remove,
  }
}

export const toast = createToastStore()
