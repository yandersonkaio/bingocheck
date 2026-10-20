import { useTranslation } from 'react-i18next'

import type { BingoStatus } from '@/lib/database'

interface BingoStatusBadgeProps {
  status: BingoStatus
  className?: string
}

const statusStyles: Record<BingoStatus, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-status-active text-status-active-foreground',
  finished: 'bg-status-finished text-status-finished-foreground',
}

const dotStyles: Record<BingoStatus, string> = {
  not_started: 'bg-muted-foreground/60',
  in_progress: 'bg-status-active-foreground animate-pulse',
  finished: 'bg-status-finished-foreground',
}

export function BingoStatusBadge({
  status,
  className = '',
}: BingoStatusBadgeProps) {
  const { t } = useTranslation()

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]} ${className}`}
    >
      <span className={`size-1.5 shrink-0 rounded-full ${dotStyles[status]}`} />

      {t(`bingos.status.${status}`)}
    </span>
  )
}
