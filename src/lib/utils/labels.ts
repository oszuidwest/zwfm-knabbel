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
  draft: 'badge-warning',
  active: 'badge-success',
  expired: 'badge-error',
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
