'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store'
import { formatRupiah } from '@/lib/utils/currency'
import { toast } from 'sonner'
import {
  Wallet, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, Receipt, ArrowRight, Eye, RotateCcw,
} from 'lucide-react'
import Link from 'next/link'
import type { PembayaranEscrow, StatusPembayaran } from '@/types'

const STATUS_CONFIG: Record<StatusPembayaran, { label: string; color: string; icon: React.ReactNode }> = {
  menunggu_pembayaran: { label: 'Menunggu Pembayaran', color: 'bg-amber-100 text-amber-800', icon: <Clock className="h-3 w-3" /> },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', color: 'bg-blue-100 text-blue-800', icon: <Eye className="h-3 w-3" /> },
  terverifikasi: { label: 'Terverifikasi', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
  ditolak: { label: 'Ditolak', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
  refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-800', icon: <RotateCcw className="h-3 w-3" /> },
}

const TAB_MAP = [
  { value: 'semua', label: 'Semua', statuses: null },
  { value: 'belum_bayar', label: 'Belum Bayar', statuses: ['menunggu_pembayaran', 'ditolak'] as StatusPembayaran[] },
  { value: 'proses', label: 'Dalam Proses', statuses: ['menunggu_verifikasi'] as StatusPembayaran[] },
  { value: 'selesai', label: 'Selesai', statuses: ['terverifikasi'] as StatusPembayaran[] },
  { value: 'refunded', label: 'Refunded', statuses: ['refunded'] as StatusPembayaran[] },
]

export default function SupplierPembayaranPage() {
  const user = useAuthStore((s) => s.user)
  const [supplier, setSupplier] = useState<any>(null)
  const [pembayaran, setPembayaran] = useState<PembayaranEscrow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    async function fetchSupplier() {
      try {
        const res = await fetch(`/api/supplier/dashboard?user_id=${user!.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) setSupplier(data.supplier || null)
        }
      } catch {
        // fallback
      }
    }
    fetchSupplier()
  }, [user?.id])

  const fetchPembayaran = useCallback(async () => {
    if (!supplier) return
    setLoading(true)
    try {
      const res = await fetch(`/api/supplier/pembayaran?supplier_id=${supplier.id}`)
      if (res.ok) {
        const data = await res.json()
        setPembayaran(data.pembayaran || [])
      }
    } catch {
      toast.error('Gagal memuat data pembayaran')
    } finally {
      setLoading(false)
    }
  }, [supplier])

  useEffect(() => {
    fetchPembayaran()
  }, [fetchPembayaran])

  const totalVerified = pembayaran
    .filter((p) => p.status === 'terverifikasi')
    .reduce((sum, p) => sum + Number(p.jumlah), 0)

  const pendingCount = pembayaran.filter((p) =>
    ['menunggu_pembayaran', 'ditolak'].includes(p.status)
  ).length

  return (
    <>
      <TopBar title="Pembayaran Escrow" />
      <div className="p-4 lg:p-6 space-y-4 max-w-4xl">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-tani-green" />
                <span className="text-xs text-muted-foreground">Total Terverifikasi</span>
              </div>
              <p className="text-lg font-bold text-tani-green">{formatRupiah(totalVerified)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Perlu Dibayar</span>
              </div>
              <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="semua" className="w-full">
          <TabsList className="w-full overflow-x-auto flex justify-start h-auto p-1 bg-muted/50">
            {TAB_MAP.map((tab) => {
              const count = tab.statuses
                ? pembayaran.filter((p) => tab.statuses!.includes(p.status)).length
                : pembayaran.length
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs px-3 py-1.5 whitespace-nowrap data-[state=active]:bg-white"
                >
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 bg-tani-green/10 text-tani-green text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {TAB_MAP.map((tab) => {
            const filtered = tab.statuses
              ? pembayaran.filter((p) => tab.statuses!.includes(p.status))
              : pembayaran

            return (
              <TabsContent key={tab.value} value={tab.value} className="space-y-3 mt-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Receipt className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">Belum ada pembayaran</p>
                  </div>
                ) : (
                  filtered.map((p) => {
                    const po = p.pre_order
                    const statusCfg = STATUS_CONFIG[p.status]
                    return (
                      <Card key={p.id} className="shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-sm">
                                {po?.komoditas || '-'} Grade {po?.grade || '-'}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                PO: {p.pre_order_id.slice(0, 8)}...
                              </p>
                            </div>
                            <Badge className={`${statusCfg.color} text-[10px] px-2 py-0.5 gap-1`}>
                              {statusCfg.icon}
                              {statusCfg.label}
                            </Badge>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Jenis</p>
                              <p className="font-medium capitalize">
                                {p.jenis_pembayaran === 'deposit' ? 'Deposit 10%' : 'Bayar Full'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Jumlah</p>
                              <p className="font-semibold text-tani-green">{formatRupiah(p.jumlah)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Nilai PO</p>
                              <p className="font-medium">{formatRupiah(p.total_nilai_po)}</p>
                            </div>
                            {p.metode_transfer && (
                              <div>
                                <p className="text-xs text-muted-foreground">Metode</p>
                                <p className="font-medium capitalize">{p.metode_transfer === 'bank' ? 'Transfer Bank' : 'QRIS'}</p>
                              </div>
                            )}
                          </div>

                          {p.status === 'ditolak' && p.admin_catatan && (
                            <div className="bg-red-50 rounded-lg p-3">
                              <p className="text-xs font-medium text-red-800">Alasan Penolakan:</p>
                              <p className="text-xs text-red-700 mt-0.5">{p.admin_catatan}</p>
                            </div>
                          )}

                          {/* Action buttons */}
                          {['menunggu_pembayaran', 'ditolak'].includes(p.status) && (
                            <Link href={`/supplier/pembayaran/${p.id}`}>
                              <Button className="w-full bg-tani-green hover:bg-tani-green/90 text-white gap-2">
                                <Wallet className="h-4 w-4" />
                                {p.status === 'ditolak' ? 'Upload Ulang Bukti' : 'Bayar Sekarang'}
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}

                          {p.status === 'menunggu_verifikasi' && (
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                              <p className="text-xs text-blue-800 font-medium">
                                Bukti transfer sedang diverifikasi oleh admin
                              </p>
                            </div>
                          )}

                          {p.status === 'terverifikasi' && (
                            <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                              <p className="text-xs text-green-800 font-medium">
                                Pembayaran terverifikasi
                                {p.verified_at && ` pada ${new Date(p.verified_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                              </p>
                            </div>
                          )}

                          {p.status === 'refunded' && (
                            <div className="bg-purple-50 rounded-lg p-3 space-y-1">
                              <div className="flex items-center gap-2">
                                <RotateCcw className="h-4 w-4 text-purple-600 shrink-0" />
                                <p className="text-xs text-purple-800 font-medium">
                                  Dana {formatRupiah(p.jumlah)} dikembalikan
                                </p>
                              </div>
                              {p.refund_catatan && (
                                <p className="text-xs text-purple-700 ml-6">{p.refund_catatan}</p>
                              )}
                              {p.refunded_at && (
                                <p className="text-[11px] text-muted-foreground ml-6">
                                  Refund pada {new Date(p.refunded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </>
  )
}
