'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store'
import { formatRupiah, formatKg, formatNumber } from '@/lib/utils/currency'
import { formatTanggalSingkat } from '@/lib/utils/date'
import { toast } from 'sonner'
import {
  ArrowLeftRight, Scale, Coins, Package, Loader2,
  CheckCircle, Banknote,
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'Semua Status', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'menunggu_konfirmasi', label: 'Menunggu Konfirmasi' },
  { value: 'dikonfirmasi', label: 'Dikonfirmasi' },
  { value: 'dalam_pengiriman', label: 'Dalam Pengiriman' },
  { value: 'tiba_di_gudang', label: 'Tiba di Gudang' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
  { value: 'sengketa', label: 'Sengketa' },
]
const KOMODITAS_OPTIONS = ['Semua Komoditas', 'Tomat', 'Cabai Merah', 'Kubis', 'Wortel', 'Kentang']

export default function AdminTransaksiPage() {
  const adminUser = useAuthStore((s) => s.user)
  const [filterStatus, setFilterStatus] = useState('Semua Status')
  const [filterKomoditas, setFilterKomoditas] = useState('Semua Komoditas')
  const [allTransaksi, setAllTransaksi] = useState<any[]>([])

  // Settlement state
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<any>(null)
  const [settlementBreakdown, setSettlementBreakdown] = useState<any>(null)
  const [loadingBreakdown, setLoadingBreakdown] = useState(false)
  const [processing, setProcessing] = useState(false)

  const fetchTransaksi = useCallback(() => {
    fetch('/api/admin/transaksi')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAllTransaksi(data.transaksi || [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchTransaksi()
  }, [fetchTransaksi])

  const transaksi = useMemo(() => {
    return allTransaksi.filter((t: any) => {
      if (filterStatus !== 'Semua Status' && t.status !== filterStatus) return false
      if (filterKomoditas !== 'Semua Komoditas' && t.komoditas !== filterKomoditas) return false
      return true
    })
  }, [allTransaksi, filterStatus, filterKomoditas])

  const totalTransaksi = allTransaksi.length
  const totalVolume = allTransaksi.reduce((sum: number, t: any) => sum + (t.volume_aktual_kg || t.volume_estimasi_kg), 0)
  const totalKomisi = allTransaksi.reduce((sum: number, t: any) => sum + (t.komisi_platform || 0), 0)

  async function openSettlementDialog(tx: any) {
    setSelectedTx(tx)
    setSettlementDialogOpen(true)
    setLoadingBreakdown(true)
    try {
      const res = await fetch(`/api/admin/settlement?transaksi_id=${tx.id}`)
      if (res.ok) {
        const data = await res.json()
        setSettlementBreakdown(data.breakdown)
      }
    } catch {
      // use calculated values
    } finally {
      setLoadingBreakdown(false)
    }
  }

  async function handleSettlement() {
    if (!selectedTx || !adminUser) return
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaksi_id: selectedTx.id,
          admin_id: adminUser.id,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal memproses settlement')
      }
      const data = await res.json()
      toast.success(`Settlement berhasil! Dana petani: ${formatRupiah(data.settlement.dana_petani)}`)
      setSettlementDialogOpen(false)
      setSelectedTx(null)
      setSettlementBreakdown(null)
      fetchTransaksi()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memproses settlement')
    } finally {
      setProcessing(false)
    }
  }

  function canSettle(t: any) {
    return t.status === 'selesai' && !t.settled_at
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Semua Transaksi" />

      <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Total Transaksi"
            value={formatNumber(totalTransaksi)}
            icon={<ArrowLeftRight className="h-5 w-5" />}
          />
          <StatCard
            title="Total Volume"
            value={formatKg(totalVolume)}
            icon={<Scale className="h-5 w-5" />}
          />
          <StatCard
            title="Total Komisi"
            value={formatRupiah(totalKomisi)}
            icon={<Coins className="h-5 w-5" />}
            trend="up"
            trendValue="+8%"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterStatus} onValueChange={(v: string | null) => setFilterStatus(v ?? "")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} label={o.label}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterKomoditas} onValueChange={(v: string | null) => setFilterKomoditas(v ?? "")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KOMODITAS_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground self-center">
            {transaksi.length} transaksi
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Komoditas</TableHead>
                  <TableHead>Poktan</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Nilai</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaksi.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id.toUpperCase()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{t.komoditas}</span>
                        <StatusBadge status={t.grade} />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{t.poktan?.nama_poktan || '-'}</TableCell>
                    <TableCell className="text-sm">{t.supplier?.nama_perusahaan || '-'}</TableCell>
                    <TableCell className="text-right text-sm">
                      {formatKg(t.volume_aktual_kg || t.volume_estimasi_kg)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {t.total_nilai ? formatRupiah(t.total_nilai) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <StatusBadge status={t.status} />
                        {t.settled_at && (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0">
                            <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                            Settled
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTanggalSingkat(t.created_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      {canSettle(t) && (
                        <Button
                          size="sm"
                          className="bg-tani-green hover:bg-tani-green/90 text-white text-xs"
                          onClick={() => openSettlementDialog(t)}
                        >
                          <Banknote className="h-3.5 w-3.5 mr-1" />
                          Settle
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {transaksi.map((t) => (
            <Card key={t.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                        {t.komoditas}
                      </span>
                      <StatusBadge status={t.grade} />
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {t.id.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={t.status} />
                    {t.settled_at && (
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0">
                        <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                        Settled
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                  <div>
                    <span className="text-muted-foreground">Poktan: </span>
                    <span className="font-medium">{t.poktan?.nama_poktan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Supplier: </span>
                    <span className="font-medium">{t.supplier?.nama_perusahaan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume: </span>
                    <span className="font-medium">{formatKg(t.volume_aktual_kg || t.volume_estimasi_kg)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tanggal: </span>
                    <span className="font-medium">{formatTanggalSingkat(t.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Nilai Transaksi</span>
                  <span className="font-bold text-sm text-tani-green">
                    {t.total_nilai ? formatRupiah(t.total_nilai) : '-'}
                  </span>
                </div>

                {canSettle(t) && (
                  <Button
                    className="w-full mt-3 bg-tani-green hover:bg-tani-green/90 text-white"
                    onClick={() => openSettlementDialog(t)}
                  >
                    <Banknote className="h-4 w-4 mr-2" />
                    Proses Settlement
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {transaksi.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tidak ada transaksi ditemukan</p>
          </div>
        )}
      </div>

      {/* Settlement Dialog */}
      <Dialog open={settlementDialogOpen} onOpenChange={(v: boolean) => setSettlementDialogOpen(v)}>
        <DialogContent className="max-w-[calc(100%-4rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-tani-green" />
              Proses Settlement
            </DialogTitle>
            <DialogDescription>
              Review breakdown transaksi sebelum memproses settlement.
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-3">
              {/* Transaksi info */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Transaksi</p>
                <p className="font-semibold text-sm">{selectedTx.komoditas} Grade {selectedTx.grade}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTx.poktan?.nama_poktan} → {selectedTx.supplier?.nama_perusahaan}
                </p>
              </div>

              {loadingBreakdown ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : settlementBreakdown ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Nilai</span>
                    <span className="font-bold">{formatRupiah(settlementBreakdown.total_nilai)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Komisi Platform (2%)</span>
                    <span className="text-amber-600 font-medium">- {formatRupiah(settlementBreakdown.komisi_platform)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fee QA (Rp 50/kg)</span>
                    <span className="text-blue-600 font-medium">- {formatRupiah(settlementBreakdown.fee_qa)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Dana untuk Petani</span>
                    <span className="font-bold text-tani-green">{formatRupiah(settlementBreakdown.dana_petani)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Gagal memuat breakdown
                </p>
              )}

              <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-800">
                <p className="font-medium mb-1">Yang akan terjadi:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Kontribusi petani akan dibuat berdasarkan proporsi lahan</li>
                  <li>Komisi platform akan dicatat</li>
                  <li>Notifikasi dikirim ke supplier dan poktan</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSettlementDialogOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button
              className="flex-1 bg-tani-green hover:bg-tani-green/90 text-white"
              onClick={handleSettlement}
              disabled={processing || loadingBreakdown}
            >
              {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Konfirmasi Settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
