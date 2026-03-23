'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store'
import { timeAgo } from '@/lib/utils/date'
import { formatKg } from '@/lib/utils/currency'
import {
  Truck, MapPin, Package, ArrowRight, ChevronRight,
} from 'lucide-react'
import type { StatusPengiriman } from '@/types'

const STATUS_CONFIG: Record<StatusPengiriman, { label: string; color: string }> = {
  disiapkan: { label: 'Disiapkan', color: 'bg-gray-100 text-gray-700' },
  dijemput: { label: 'Dijemput', color: 'bg-blue-100 text-blue-700' },
  dalam_perjalanan: { label: 'Dalam Perjalanan', color: 'bg-amber-100 text-amber-700' },
  tiba_di_tujuan: { label: 'Tiba di Tujuan', color: 'bg-emerald-100 text-emerald-700' },
  diterima: { label: 'Diterima', color: 'bg-green-100 text-green-800' },
}

const STATUS_ORDER: StatusPengiriman[] = [
  'disiapkan', 'dijemput', 'dalam_perjalanan', 'tiba_di_tujuan', 'diterima',
]

export default function SupplierPengirimanListPage() {
  const user = useAuthStore((s) => s.user)
  const [pengirimanList, setPengirimanList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    // Use admin endpoint filtered by supplier — or we need a supplier list endpoint
    // For now, fetch all transaksi for this supplier and check pengiriman
    fetch(`/api/supplier/dashboard?user_id=${user.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(async (data) => {
        if (!data?.success) return
        // Fetch pengiriman for each transaksi that has one
        const transaksiIds: string[] = (data.transaksi || [])
          .filter((t: any) => ['dalam_pengiriman', 'tiba_di_gudang', 'selesai'].includes(t.status))
          .map((t: any) => t.id)

        const results = await Promise.all(
          transaksiIds.map(txId =>
            fetch(`/api/supplier/pengiriman/${txId}`)
              .then(r => r.ok ? r.json() : null)
              .then(d => (d?.success ? d.pengiriman : null))
              .catch(() => null)
          )
        )
        setPengirimanList(results.filter(Boolean))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  return (
    <>
      <TopBar title="Pengiriman" />
      <div className="p-4 lg:p-6 space-y-4 max-w-4xl">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Memuat...</div>
        ) : pengirimanList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Truck className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada pengiriman</p>
            <p className="text-xs mt-1">Pengiriman akan muncul setelah poktan memulai proses pengiriman</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pengirimanList.map((p) => {
              const tx = p.transaksi
              const statusConf = STATUS_CONFIG[p.current_status as StatusPengiriman] || STATUS_CONFIG.disiapkan
              const currentIdx = STATUS_ORDER.indexOf(p.current_status)

              return (
                <Link key={p.id} href={`/supplier/pengiriman/${p.transaksi_id}`}>
                  <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={`${statusConf.color} text-xs font-medium`}>
                              {statusConf.label}
                            </Badge>
                            {tx && <StatusBadge status={tx.status} />}
                          </div>
                          {tx && (
                            <p className="text-sm font-semibold">
                              {tx.komoditas} — {formatKg(tx.volume_aktual_kg || tx.volume_estimasi_kg)}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-tani-green" />
                        <span className="truncate">{p.alamat_asal}</span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <MapPin className="h-3 w-3 text-tani-blue" />
                        <span className="truncate">{p.alamat_tujuan}</span>
                      </div>

                      {/* Mini progress */}
                      <div className="flex items-center gap-0.5">
                        {STATUS_ORDER.map((s, i) => (
                          <div key={s} className={`h-1.5 flex-1 rounded-full ${
                            i <= currentIdx ? 'bg-emerald-600' : 'bg-gray-200'
                          }`} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
