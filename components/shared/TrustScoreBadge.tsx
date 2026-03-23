'use client'

import { Badge } from '@/components/ui/badge'
import { ShieldCheck } from 'lucide-react'
import type { TrustLevel } from '@/types'

const TRUST_CONFIG: Record<TrustLevel, { label: string; className: string }> = {
  unverified: { label: 'Belum Verifikasi', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  baru: { label: 'Baru', className: 'bg-gray-200 text-gray-800 hover:bg-gray-200' },
  terpercaya: { label: 'Terpercaya', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  andalan: { label: 'Andalan', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  bintang: { label: 'Bintang', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
}

interface TrustScoreBadgeProps {
  level: TrustLevel
  score?: number
  size?: 'sm' | 'md'
}

export function TrustScoreBadge({ level, score, size = 'sm' }: TrustScoreBadgeProps) {
  const config = TRUST_CONFIG[level]
  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm'
  const iconSize = size === 'sm' ? 12 : 14

  return (
    <Badge variant="secondary" className={`${config.className} ${sizeClass} font-medium gap-1`}>
      <ShieldCheck size={iconSize} />
      {config.label}
      {score !== undefined && ` (${score})`}
    </Badge>
  )
}
