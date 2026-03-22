'use client'

import { useState, useEffect, useMemo } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { KomoditasCard } from '@/components/shared/KomoditasCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { useAuthStore } from '@/store'
import { formatRupiah, formatKg } from '@/lib/utils/currency'
import { formatTanggalSingkat } from '@/lib/utils/date'
import { GRADE_COLORS } from '@/lib/constants/komoditas'
import {
  ShoppingCart, FileCheck, CheckCircle, History,
  Filter, Send,
} from 'lucide-react'
import type { PreOrder } from '@/types'

export default function PreOrderPage() {
  const user = useAuthStore((s) => s.user)

  const [poktan, setPoktan] = useState<any>(null)
  const [matchedPreOrders, setMatchedPreOrders] = useState<any[]>([])
  const [openPreOrders, setOpenPreOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetch(`/api/poktan/pre-order?user_id=${user.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success) {
          setPoktan(data.poktan)
          setMatchedPreOrders(data.matched_pre_orders || [])
          setOpenPreOrders(data.open_pre_orders || [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // Filters
  const [filterKomoditas, setFilterKomoditas] = useState<string>('semua')
  const [filterGrade, setFilterGrade] = useState<string>('semua')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PreOrder | null>(null)
  const [volumeSanggup, setVolumeSanggup] = useState('')
  const [tanggalEstimasi, setTanggalEstimasi] = useState('')
  const [catatanPenawaran, setCatatanPenawaran] = useState('')

  function getSupplierName(po: any) {
    return po.supplier?.nama_perusahaan || '-'
  }

  // Combine all pre-orders for filtering
  const allPreOrders = useMemo(() => [...openPreOrders, ...matchedPreOrders], [openPreOrders, matchedPreOrders])

  // Pre-orders filtered by tabs
  const poTersedia = useMemo(() => {
    let list = openPreOrders.filter((po: any) => po.status === 'open')
    if (filterKomoditas !== 'semua') {
      list = list.filter((po: any) => po.komoditas === filterKomoditas)
    }
    if (filterGrade !== 'semua') {
      list = list.filter((po: any) => po.grade === filterGrade)
    }
    return list
  }, [openPreOrders, filterKomoditas, filterGrade])

  const poDiajukan = matchedPreOrders.filter(
    (po: any) => po.status === 'matched'
  )
  const poDisetujui = matchedPreOrders.filter(
    (po: any) => po.status === 'confirmed'
  )
  const poRiwayat = matchedPreOrders.filter(
    (po: any) => ['fulfilled', 'cancelled'].includes(po.status)
  )

  const komoditasOptions = [...new Set(openPreOrders.filter((po: any) => po.status === 'open').map((po: any) => po.komoditas))]

  function openKirimPenawaran(po: PreOrder) {
    setSelectedPO(po)
    setVolumeSanggup(String(po.volume_kg))
    setTanggalEstimasi('')
    setCatatanPenawaran('')
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setSelectedPO(null)
  }

  function renderPOCard(po: PreOrder, showKirimPenawaran = false) {
    return (
      <Card key={po.id} className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">{po.komoditas}</h3>
                <Badge
                  className={`${GRADE_COLORS[po.grade] || 'bg-slate-100 text-slate-700'} text-[10px] px-1.5 py-0`}
                >
                  Grade {po.grade}
                </Badge>
                <StatusBadge status={po.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatKg(po.volume_kg)}</span>
                <span className="text-foreground font-medium">
                  {formatRupiah(po.harga_penawaran_per_kg)}/kg
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Supplier: {getSupplierName(po)}
              </p>
              <p className="text-xs text-muted-foreground">
                Tujuan: {po.wilayah_tujuan}
              </p>
              <p className="text-xs text-muted-foreground">
                Dibutuhkan: {formatTanggalSingkat(po.tanggal_dibutuhkan)}
              </p>
              {po.catatan_spesifikasi && (
                <p className="text-xs text-muted-foreground italic line-clamp-2">
                  &quot;{po.catatan_spesifikasi}&quot;
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <p className="text-xs text-muted-foreground">Total Nilai</p>
              <p className="text-sm font-semibold text-tani-green">
                {formatRupiah(po.volume_kg * po.harga_penawaran_per_kg)}
              </p>
              {showKirimPenawaran && (
                <Button
                  size="sm"
                  className="bg-tani-green hover:bg-tani-green/90 text-white mt-1"
                  onClick={() => openKirimPenawaran(po)}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Kirim Penawaran
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <TopBar title="Permintaan Supplier" />
      <div className="p-4 lg:p-6 space-y-6 max-w-5xl">
        <Tabs defaultValue={0}>
          <TabsList className="w-full">
            <TabsTrigger value={0}>
              <ShoppingCart className="h-4 w-4" />
              Tersedia ({poTersedia.length})
            </TabsTrigger>
            <TabsTrigger value={1}>
              <Send className="h-4 w-4" />
              Terkirim ({poDiajukan.length})
            </TabsTrigger>
            <TabsTrigger value={2}>
              <CheckCircle className="h-4 w-4" />
              Disetujui ({poDisetujui.length})
            </TabsTrigger>
            <TabsTrigger value={3}>
              <History className="h-4 w-4" />
              Riwayat
            </TabsTrigger>
          </TabsList>

          {/* Tab: Tersedia */}
          <TabsContent value={0}>
            <div className="space-y-4 mt-4">
              {/* Filters */}
              <Card className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterKomoditas} onValueChange={(v: string | null) => setFilterKomoditas(v ?? "")}>
                      <SelectTrigger className="w-auto">
                        <SelectValue placeholder="Komoditas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua" label="Semua Komoditas">Semua Komoditas</SelectItem>
                        {komoditasOptions.map((k) => (
                          <SelectItem key={k} value={k}>{k}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterGrade} onValueChange={(v: string | null) => setFilterGrade(v ?? "")}>
                      <SelectTrigger className="w-auto">
                        <SelectValue placeholder="Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua" label="Semua Grade">Semua Grade</SelectItem>
                        <SelectItem value="A" label="Grade A">Grade A</SelectItem>
                        <SelectItem value="B" label="Grade B">Grade B</SelectItem>
                        <SelectItem value="C" label="Grade C">Grade C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {poTersedia.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Tidak ada permintaan yang cocok dengan komoditas poktan Anda
                  </p>
                ) : (
                  poTersedia.map((po) => renderPOCard(po, true))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Penawaran Terkirim */}
          <TabsContent value={1}>
            <div className="space-y-3 mt-4">
              {poDiajukan.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada penawaran yang terkirim
                </p>
              ) : (
                poDiajukan.map((po) => renderPOCard(po))
              )}
            </div>
          </TabsContent>

          {/* Tab: Disetujui */}
          <TabsContent value={2}>
            <div className="space-y-3 mt-4">
              {poDisetujui.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada penawaran yang disetujui
                </p>
              ) : (
                poDisetujui.map((po) => renderPOCard(po))
              )}
            </div>
          </TabsContent>

          {/* Tab: Riwayat */}
          <TabsContent value={3}>
            <div className="space-y-3 mt-4">
              {poRiwayat.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada riwayat permintaan
                </p>
              ) : (
                poRiwayat.map((po) => renderPOCard(po))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Kirim Penawaran */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim Penawaran</DialogTitle>
            <DialogDescription>
              {selectedPO && (
                <>
                  {selectedPO.komoditas} Grade {selectedPO.grade} — {formatKg(selectedPO.volume_kg)} @ {formatRupiah(selectedPO.harga_penawaran_per_kg)}/kg
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Volume yang Disanggupi (kg)</Label>
              <Input
                type="number"
                placeholder="Masukkan volume yang bisa Anda penuhi"
                value={volumeSanggup}
                onChange={(e) => setVolumeSanggup(e.target.value)}
              />
              {selectedPO && Number(volumeSanggup) > selectedPO.volume_kg && (
                <p className="text-xs text-tani-amber">
                  Volume melebihi permintaan ({formatKg(selectedPO.volume_kg)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tanggal Estimasi Kirim</Label>
              <Input
                type="date"
                value={tanggalEstimasi}
                onChange={(e) => setTanggalEstimasi(e.target.value)}
              />
              {selectedPO && tanggalEstimasi && new Date(tanggalEstimasi) > new Date(selectedPO.tanggal_dibutuhkan) && (
                <p className="text-xs text-tani-amber">
                  Tanggal melebihi batas dibutuhkan ({formatTanggalSingkat(selectedPO.tanggal_dibutuhkan)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                placeholder="Informasi tambahan untuk supplier..."
                value={catatanPenawaran}
                onChange={(e) => setCatatanPenawaran(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Batal
            </Button>
            <Button
              className="bg-tani-green hover:bg-tani-green/90 text-white"
              disabled={!volumeSanggup || !tanggalEstimasi}
              onClick={closeDialog}
            >
              <Send className="h-4 w-4 mr-1" />
              Kirim Penawaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
