interface BadgeProps {
  label: string
  variant?: 'cyan' | 'green' | 'amber' | 'rose' | 'purple' | 'neutral' | 'confirmed' | 'cancelled' | 'OA' | 'Interview' | 'PPT'
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{label}</span>
}

export function PurposeBadge({ purpose }: { purpose: string }) {
  const v = purpose as BadgeProps['variant']
  const labels: Record<string, string> = { OA: 'Online Assessment', Interview: 'Interview', PPT: 'Pre-Placement Talk' }
  return <Badge label={labels[purpose] ?? purpose} variant={v} />
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge label={status.charAt(0).toUpperCase() + status.slice(1)} variant={status as BadgeProps['variant']} />
}
