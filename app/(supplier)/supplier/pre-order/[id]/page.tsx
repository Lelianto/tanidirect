'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store'
import {
  dummyPreOrders, dummyPoktan, dummyTransaksi,
  dummyQAInspeksi, dummyLogistik, dummyUsers,
} from '@/lib/dummy'
import { formatRupiah, formatKg } from '@/lib/utils/currency'
import { formatTanggal, formatWaktu, timeAgo } from '@/lib/utils/date'
import { GRADE_COLORS } from '@/lib/constants/komoditas'
import {
  ArrowLeft, MapPin, Calendar, Truck, ClipboardCheck,
  CheckCircle, XCircle, Clock, Package, Star, AlertCircle,
  Phone, User,
} from 'lucide-react'
import Link from 'next/link'

const TIMELINE_STEPS: { status: string; label: string; icon: React.ReactNode }[] = [
  { status: 'open', label: 'Pre-Order Dibuat', icon: <Package className="h-4 w-4" /> },
  { status: 'matched', label: 'Poktan Matched', icon: <CheckCircle className="h-4 w-4" /> },
  { status: 'confirmed', label: 'Dikonfirmasi', icon: <ClipboardCheck className="h-4 w-4" /> },
  { status: 'fulfilled', label: 'Terpenuhi', icon: <Star className="h-4 w-4" /> },
]

const STATUS_ORDER: Record<string, number> = {
  open: 0,
  matched: 1,
  confirmed: 2,
  fulfilled: 3,
  cancelled: -1,
}

export default function PreOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const preOrder = dummyPreOrders.find((po) => po.id === id)
  const poktan = preOrder?.poktan_matched_id
    ? dummyPoktan.find((p) => p.id === preOrder.poktan_matched_id)
    : null
  const transaksi = preOrder
    ? dummyTransaksi.find((t) => t.pre_order_id === preOrder.id)
    : null
  const qaInspeksi = transaksi
    ? dummyQAInspeksi.filter((qa) => qa.transaksi_id === transaksi.id)
    : []
  const logistik = transaksi
    ? dummyLogistik.filter((lg) => lg.transaksi_id === transaksi.id)
    : []

  const currentStep = preOrder ? STATUS_ORDER[preOrder.status] ?? -1 : 0

  if (!preOrder) {
    return (
      <>
        <TopBar title="Detail Pre-Order" />
        <div className="p-4 flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Pre-order tidak ditemukan</p>
          <Link href="/supplier/pre-order">
            <Button variant="outline" className="mt-4">Kembali</Button>
          </Link>
        </div>
      </>
    )
  }

  const totalNilai = preOrder.volume_kg * preOrder.harga_penawaran_per_kg

  return (
    <>
      <TopBar title="Detail Pre-Order" />
      <div className="p-4 lg:p-6 space-y-4 max-w-3xl">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{preOrder.komoditas}</h2>
              <Badge className={`${GRADE_COLORS[preOrder.grade] || ''} text-[10px] px-1.5 py-0`}>
                Grade {preOrder.grade}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">ID: {preOrder.id}</p>
          </div>
          <StatusBadge status={preOrder.status} />
        </div>

        {/* Timeline */}
        {preOrder.status !== 'cancelled' && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative ml-2">
                {TIMELINE_STEPS.map((step, i) => {
                  const isActive = i <= currentStep
                  const isCurrent = i === currentStep
                  return (
                    <div key={step.status} className="flex gap-3 pb-6 last:pb-0">
                      {/* Vertical line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                            isCurrent
                              ? 'bg-tani-green text-white ring-4 ring-tani-green/20'
                              : isActive
                              ? 'bg-tani-green text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {step.icon}
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-[24px] ${isActive ? 'bg-tani-green' : 'bg-muted'}`} />
                        )}
                      </div>
                      {/* Content */}
                      <div className="pt-1">
                        <p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {timeAgo(preOrder.updated_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {preOrder.status === 'cancelled' && (
          <Card className="shadow-sm border-red-200 bg-red-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-tani-red shrink-0" />
              <div>
                <p className="text-sm font-medium text-tani-red">Pre-Order Dibatalkan</p>
                <p className="text-xs text-muted-foreground">{timeAgo(preOrder.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pre-Order Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Informasi Pre-Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Komoditas</p>
                <p className="font-medium">{preOrder.komoditas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Grade</p>
                <p className="font-medium">Grade {preOrder.grade}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="font-medium">{formatKg(preOrder.volume_kg)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Harga/kg</p>
                <p className="font-medium">{formatRupiah(preOrder.harga_penawaran_per_kg)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Nilai</p>
                <p className="font-semibold text-tani-green">{formatRupiah(totalNilai)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deposit</p>
                <p className="font-medium">{formatRupiah(preOrder.deposit_dibayar)}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Dibutuhkan:</span>
              <span className="font-medium">{formatTanggal(preOrder.tanggal_dibutuhkan)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tujuan:</span>
              <span className="font-medium">{preOrder.wilayah_tujuan}</span>
            </div>
            {preOrder.catatan_spesifikasi && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Catatan Spesifikasi</p>
                <p className="text-sm">{preOrder.catatan_spesifikasi}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Poktan Info (if matched) */}
        {poktan && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Poktan yang Ditugaskan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{poktan.nama_poktan}</p>
                  <p className="text-xs text-muted-foreground">{poktan.kode_poktan}</p>
                </div>
                {poktan.is_qa_certified && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px]">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    QA Certified
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Rating QA</p>
                  <p className="font-medium flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    {poktan.skor_qa}/100
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ketepatan</p>
                  <p className="font-medium">{poktan.skor_ketepatan}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lokasi</p>
                  <p className="font-medium">{poktan.desa}, {poktan.kabupaten}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Transaksi</p>
                  <p className="font-medium">{poktan.total_transaksi}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QA Inspection */}
        {qaInspeksi.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Hasil Inspeksi QA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {qaInspeksi.map((qa) => (
                <div key={qa.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={qa.status} />
                    {qa.skor_kualitas !== undefined && (
                      <span className="text-sm font-semibold">
                        Skor: <span className={qa.skor_kualitas >= 80 ? 'text-tani-green' : 'text-tani-amber'}>{qa.skor_kualitas}/100</span>
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    {qa.grade_hasil && (
                      <div>
                        <p className="text-xs text-muted-foreground">Grade Hasil</p>
                        <p className="font-medium">Grade {qa.grade_hasil}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Volume Inspeksi</p>
                      <p className="font-medium">{qa.volume_inspeksi_kg ? formatKg(qa.volume_inspeksi_kg) : '-'}</p>
                    </div>
                    {qa.penyimpangan_persen !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">Penyimpangan</p>
                        <p className="font-medium">{qa.penyimpangan_persen}%</p>
                      </div>
                    )}
                  </div>
                  {qa.catatan_inspektor && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Catatan Inspektor</p>
                      <p className="text-sm">{qa.catatan_inspektor}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Logistik Tracking */}
        {logistik.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tracking Logistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logistik.map((lg) => (
                <div key={lg.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs capitalize">
                      {lg.tier.replace(/_/g, ' ')}
                    </Badge>
                    <StatusBadge status={lg.status.replace(/_/g, ' ')} />
                  </div>
                  <div className="text-sm space-y-1.5">
                    <div className="flex items-start gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{lg.transporter_nama}</p>
                        {lg.kendaraan_plat && <p className="text-xs text-muted-foreground">{lg.kendaraan_plat}</p>}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-tani-green shrink-0 mt-0.5" />
                      <span>{lg.titik_asal}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-tani-red shrink-0 mt-0.5" />
                      <span>{lg.titik_tujuan}</span>
                    </div>
                    {lg.estimasi_tiba && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          ETA: {formatWaktu(lg.estimasi_tiba)}
                        </span>
                      </div>
                    )}
                    {lg.last_update_posisi && (
                      <div className="bg-blue-50 rounded-lg p-2.5 text-xs">
                        <span className="text-tani-blue font-medium">Update terakhir:</span>{' '}
                        {lg.last_update_posisi}
                        {lg.last_update_at && (
                          <span className="text-muted-foreground"> ({timeAgo(lg.last_update_at)})</span>
                        )}
                      </div>
                    )}
                  </div>
                  {logistik.indexOf(lg) < logistik.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pb-6">
          {transaksi && ['dalam_pengiriman', 'tiba_di_gudang'].includes(transaksi.status) && (
            <Button className="flex-1 bg-tani-green hover:bg-tani-green/90 text-white">
              <CheckCircle className="h-4 w-4 mr-2" />
              Konfirmasi Kedatangan
            </Button>
          )}
          {['open', 'matched'].includes(preOrder.status) && (
            <Button variant="outline" className="flex-1 border-tani-red text-tani-red hover:bg-red-50">
              <XCircle className="h-4 w-4 mr-2" />
              Batalkan Pre-Order
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
