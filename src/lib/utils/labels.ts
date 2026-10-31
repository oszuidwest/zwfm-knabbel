import { WEEKDAY_BITS } from '$lib/types'

export const roleLabels: Record<string, string> = {
  admin: 'Beheerder',
  editor: 'Redacteur',
  viewer: 'Kijker',
}

export const roleOptions = [
  { value: 'viewer', label: roleLabels.viewer },
  { value: 'editor', label: roleLabels.editor },
  { value: 'admin', label: roleLabels.admin },
]

export function getRoleLabel(role: string | undefined): string {
  return roleLabels[role ?? 'viewer'] ?? 'Kijker'
}

export const statusLabels: Record<string, string> = {
  draft: 'Concept',
  active: 'Actief',
  expired: 'Verlopen',
}

export const statusOptions = [
  { value: 'draft', label: statusLabels.draft },
  { value: 'active', label: statusLabels.active },
  { value: 'expired', label: statusLabels.expired },
]

export const statusColors: Record<string, string> = {
  draft: 'badge-soft',
  active: 'badge-soft badge-success',
  expired: 'badge-soft badge-error',
}

export const weekdayLabels: Record<string, string> = {
  monday: 'Ma',
  tuesday: 'Di',
  wednesday: 'Wo',
  thursday: 'Do',
  friday: 'Vr',
  saturday: 'Za',
  sunday: 'Zo',
}

export function formatWeekdays(mask: number): string {
  if ((mask & 127) === 127) return 'Elke dag'
  const days = Object.entries(weekdayLabels)
    .filter(([day]) => mask & WEEKDAY_BITS[day as keyof typeof WEEKDAY_BITS])
    .map(([, label]) => label)
  return days.join(', ') || 'Geen dagen'
}
