'use client'

import { Badge } from '@/components/ui/badge'
import { ShieldCheck } from 'lucide-react'
import type { TrustLevel } from '@/types'

const TRUST_CONFIG: Record<TrustLevel, { label: string; className: string }> = {
  unverified: { label: 'Unverified', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  verified: { label: 'Verified', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  bronze: { label: 'Bronze', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  silver: { label: 'Silver', className: 'bg-gray-200 text-gray-800 hover:bg-gray-200' },
  gold: { label: 'Gold', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  platinum: { label: 'Platinum', className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100' },
}

interface TrustScoreBadgeProps {
  level: TrustLevel
  size?: 'sm' | 'md'
}

export function TrustScoreBadge({ level, size = 'sm' }: TrustScoreBadgeProps) {
  const config = TRUST_CONFIG[level]
  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm'
  const iconSize = size === 'sm' ? 12 : 14

  return (
    <Badge variant="secondary" className={`${config.className} ${sizeClass} font-medium gap-1`}>
      <ShieldCheck size={iconSize} />
      {config.label}
    </Badge>
  )
}
