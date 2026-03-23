'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatWaktu, timeAgo } from '@/lib/utils/date'
import { formatKg } from '@/lib/utils/currency'
import {
  Truck, MapPin, Phone, User, Clock, Package,
  CheckCircle2, Circle, Camera, ArrowRight,
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

export default function SupplierPengirimanDetailPage() {
  const params = useParams()
  const transaksiId = params.id as string
  const [pengiriman, setPengiriman] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!transaksiId) return
    fetch(`/api/supplier/pengiriman/${transaksiId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success) setPengiriman(data.pengiriman)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [transaksiId])

  if (loading) {
    return (
      <>
        <TopBar title="Tracking Pengiriman" />
        <div className="p-4 text-center text-sm text-muted-foreground py-12">Memuat...</div>
      </>
    )
  }

  if (!pengiriman) {
    return (
      <>
        <TopBar title="Tracking Pengiriman" />
        <div className="p-4 text-center py-12 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Pengiriman belum tersedia</p>
          <p className="text-xs mt-1">Pengiriman akan muncul setelah poktan memulai proses pengiriman</p>
        </div>
      </>
    )
  }

  const tx = pengiriman.transaksi
  const statusConf = STATUS_CONFIG[pengiriman.current_status as StatusPengiriman]
  const currentIdx = STATUS_ORDER.indexOf(pengiriman.current_status)
  const events = pengiriman.events || []

  return (
    <>
      <TopBar title="Tracking Pengiriman" />
      <div className="p-4 lg:p-6 space-y-4 max-w-3xl">
        {/* Status Card */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={`${statusConf?.color} text-xs font-medium`}>
                {statusConf?.label || pengiriman.current_status}
              </Badge>
              {tx && <StatusBadge status={tx.status} />}
            </div>

            {tx && (
              <div>
                <p className="text-sm font-semibold font-[family-name:var(--font-heading)]">
                  {tx.komoditas} — Grade {tx.grade}
                </p>
                <p className="text-xs text-muted-foreground">
                  Volume: {formatKg(tx.volume_aktual_kg || tx.volume_estimasi_kg)}
                </p>
              </div>
            )}

            {/* Route */}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-tani-green shrink-0" />
              <span className="truncate text-xs">{pengiriman.alamat_asal}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <MapPin className="h-4 w-4 text-tani-blue shrink-0" />
              <span className="truncate text-xs">{pengiriman.alamat_tujuan}</span>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-1">
              {STATUS_ORDER.map((s, i) => (
                <div key={s} className="flex items-center flex-1 gap-1">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i <= currentIdx
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-400 border border-gray-300'
                  } ${i === currentIdx ? 'ring-2 ring-emerald-300' : ''}`}>
                    {i <= currentIdx ? '✓' : i + 1}
                  </div>
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={`h-1 flex-1 rounded-full ${
                      i < currentIdx ? 'bg-emerald-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {STATUS_ORDER.map((s) => (
                <span key={s} className="flex-1 text-[10px] text-center text-muted-foreground leading-tight">
                  {STATUS_CONFIG[s].label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pengirim Info */}
        {pengiriman.pengirim_nama && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4 text-tani-green" />
                Info Pengirim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Nama</p>
                  <p className="font-medium">{pengiriman.pengirim_nama}</p>
                </div>
                {pengiriman.pengirim_telepon && (
                  <div>
                    <p className="text-xs text-muted-foreground">Telepon</p>
                    <a href={`tel:${pengiriman.pengirim_telepon}`} className="font-medium text-tani-blue flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {pengiriman.pengirim_telepon}
                    </a>
                  </div>
                )}
                {pengiriman.kendaraan_info && (
                  <div>
                    <p className="text-xs text-muted-foreground">Kendaraan</p>
                    <p className="font-medium">{pengiriman.kendaraan_info}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-tani-green" />
              Timeline Pengiriman
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Belum ada update dari poktan
              </p>
            ) : (
              <div className="relative pl-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />

                {events.map((ev: any, i: number) => {
                  const evConf = STATUS_CONFIG[ev.status as StatusPengiriman]
                  const isLast = i === events.length - 1
                  return (
                    <div key={ev.id} className="relative pb-4 last:pb-0">
                      <div className={`absolute -left-6 top-1 h-[22px] w-[22px] rounded-full flex items-center justify-center ${
                        isLast ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-emerald-600 text-emerald-600'
                      }`}>
                        {isLast ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-2 w-2 fill-current" />}
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 ml-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${evConf?.color || 'bg-gray-100'} text-[10px] px-1.5 py-0`}>
                            {evConf?.label || ev.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo(ev.created_at)}
                          </span>
                        </div>

                        {ev.catatan && <p className="text-sm mt-1">{ev.catatan}</p>}

                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                          {ev.lokasi_teks && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              {ev.lokasi_teks}
                            </span>
                          )}
                          {ev.foto_url && (
                            <span className="flex items-center gap-0.5">
                              <Camera className="h-2.5 w-2.5" />
                              Foto
                            </span>
                          )}
                          {ev.user && (
                            <span className="flex items-center gap-0.5 ml-auto">
                              <User className="h-2.5 w-2.5" />
                              {ev.user.nama_lengkap}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatWaktu(ev.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {pengiriman.catatan_alamat && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Catatan Pengiriman</p>
              <p className="text-sm">{pengiriman.catatan_alamat}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
