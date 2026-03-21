'use client'

import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { GRADE_COLORS } from '@/lib/constants/komoditas'
import { formatRupiah, formatKg } from '@/lib/utils/currency'
import { formatTanggalSingkat } from '@/lib/utils/date'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'

interface KomoditasCardProps {
  komoditas: string
  grade: string
  volume_kg: number
  harga_per_kg: number
  status: string
  tanggal?: string
  supplierNama?: string
  poktanNama?: string
  onClick?: () => void
  isNew?: boolean
}

export function KomoditasCard({
  komoditas,
  grade,
  volume_kg,
  harga_per_kg,
  status,
  tanggal,
  supplierNama,
  poktanNama,
  onClick,
  isNew,
}: KomoditasCardProps) {
  return (
    <Card
      className={`shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-[0.99] ${onClick ? '' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{komoditas}</h3>
              <Badge className={`${GRADE_COLORS[grade] || 'bg-slate-100 text-slate-700'} text-[10px] px-1.5 py-0`}>
                Grade {grade}
              </Badge>
              {isNew && (
                <Badge className="bg-tani-blue text-white text-[10px] px-1.5 py-0 hover:bg-tani-blue">
                  Baru
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatKg(volume_kg)}</span>
              <span className="text-foreground font-medium">{formatRupiah(harga_per_kg)}/kg</span>
            </div>
            {(supplierNama || poktanNama) && (
              <p className="text-xs text-muted-foreground truncate">
                {supplierNama || poktanNama}
              </p>
            )}
            {tanggal && (
              <p className="text-[11px] text-muted-foreground">
                {formatTanggalSingkat(tanggal)}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <StatusBadge status={status} />
            {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
