'use client'

import { useState, useMemo, useEffect } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { formatRupiah, formatNumber } from '@/lib/utils/currency'
import { formatTanggal } from '@/lib/utils/date'
import type { Kredit } from '@/types'
import { toast } from 'sonner'
import {
  CreditCard, Banknote, Clock, Brain, User, FileText, AlertCircle, Loader2,
} from 'lucide-react'

const AI_KATEGORI_COLOR: Record<string, string> = {
  'Sangat Baik': 'bg-green-100 text-green-800',
  'Baik': 'bg-blue-100 text-blue-800',
  'Cukup': 'bg-amber-100 text-amber-800',
  'Perlu Perhatian': 'bg-red-100 text-red-800',
}

export default function AdminKreditPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedKredit, setSelectedKredit] = useState<(Kredit & { petani?: any; poktan?: any }) | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reviewKeputusan, setReviewKeputusan] = useState('')
  const [reviewJumlah, setReviewJumlah] = useState('')
  const [reviewCatatan, setReviewCatatan] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [allKredit, setAllKredit] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/kredit')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAllKredit(data.kredit || [])
      })
      .catch(() => {})
  }, [])

  const filterByTab = (tab: string) => {
    return allKredit.filter((k: any) => {
      if (tab === 'pending') return k.status === 'pending'
      if (tab === 'aktif') return k.status === 'aktif' || k.status === 'disetujui'
      return k.status === 'lunas' || k.status === 'ditolak'
    })
  }

  const totalPengajuan = allKredit.reduce((sum: number, k: any) => sum + k.jumlah_diajukan, 0)
  const totalOutstanding = allKredit
    .filter((k: any) => k.status === 'aktif')
    .reduce((sum: number, k: any) => sum + (k.jumlah_disetujui || 0), 0)
  const pendingCount = allKredit.filter((k: any) => k.status === 'pending').length

  const handleReview = (kredit: Kredit) => {
    setSelectedKredit(kredit)
    setReviewKeputusan('')
    setReviewJumlah(kredit.jumlah_diajukan.toString())
    setReviewCatatan('')
    setDialogOpen(true)
  }

  const renderKreditCard = (k: Kredit & { petani?: any; poktan?: any }) => (
    <Card key={k.id} className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-tani-blue/10">
              <User className="h-4 w-4 text-tani-blue" />
            </div>
            <div>
              <p className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                {k.petani?.nama_lengkap || 'Petani'}
              </p>
              <p className="text-xs text-muted-foreground">
                {k.petani?.kabupaten}, {k.petani?.provinsi}
              </p>
            </div>
          </div>
          <StatusBadge status={k.status} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
          <div>
            <span className="text-muted-foreground">Jumlah Diajukan</span>
            <p className="font-bold text-sm">{formatRupiah(k.jumlah_diajukan)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Tenor</span>
            <p className="font-bold text-sm">{k.tenor_bulan} bulan</p>
          </div>
          {k.jumlah_disetujui && (
            <div>
              <span className="text-muted-foreground">Disetujui</span>
              <p className="font-bold text-sm text-tani-green">{formatRupiah(k.jumlah_disetujui)}</p>
            </div>
          )}
          {k.tujuan_penggunaan && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Tujuan</span>
              <p className="font-medium">{k.tujuan_penggunaan}</p>
            </div>
          )}
        </div>

        {/* AI Score */}
        {k.ai_skor !== undefined && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5 mb-3">
            <Brain className="h-4 w-4 text-tani-blue shrink-0" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-muted-foreground">AI Skor:</span>
              <span className="font-bold text-sm">{k.ai_skor}</span>
              {k.ai_kategori && (
                <Badge className={`text-[10px] px-1.5 py-0 ${AI_KATEGORI_COLOR[k.ai_kategori] || 'bg-gray-100 text-gray-800'}`}>
                  {k.ai_kategori}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Diajukan: {formatTanggal(k.tanggal_pengajuan)}
          {k.tanggal_keputusan && (
            <> &middot; Keputusan: {formatTanggal(k.tanggal_keputusan)}</>
          )}
        </div>

        {k.status === 'pending' && (
          <Button
            className="w-full mt-3 bg-tani-blue hover:bg-tani-blue/90 text-white"
            size="sm"
            onClick={() => handleReview(k)}
          >
            <FileText className="h-4 w-4 mr-1" />
            Review
          </Button>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Manajemen Kredit" />

      <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Total Pengajuan"
            value={formatRupiah(totalPengajuan)}
            icon={<CreditCard className="h-5 w-5" />}
          />
          <StatCard
            title="Outstanding"
            value={formatRupiah(totalOutstanding)}
            icon={<Banknote className="h-5 w-5" />}
          />
          <StatCard
            title="Pending Review"
            value={formatNumber(pendingCount)}
            icon={<Clock className="h-5 w-5" />}
            subtitle={pendingCount > 0 ? 'perlu ditinjau' : ''}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Pending Review
              {pendingCount > 0 && (
                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-tani-amber text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="aktif" className="text-xs sm:text-sm">
              Aktif
            </TabsTrigger>
            <TabsTrigger value="riwayat" className="text-xs sm:text-sm">
              Riwayat
            </TabsTrigger>
          </TabsList>

          {['pending', 'aktif', 'riwayat'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {filterByTab(tab).map(renderKreditCard)}
              {filterByTab(tab).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {tab === 'pending' ? 'Tidak ada pengajuan kredit pending' :
                     tab === 'aktif' ? 'Tidak ada kredit aktif' :
                     'Belum ada riwayat kredit'}
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v: boolean) => setDialogOpen(v)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-heading)]">
              Review Pengajuan Kredit
            </DialogTitle>
            <DialogDescription>
              Tinjau pengajuan kredit dari {selectedKredit?.petani?.nama_lengkap}
            </DialogDescription>
          </DialogHeader>

          {selectedKredit && (
            <div className="space-y-4">
              {/* AI Result */}
              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-tani-blue" />
                  <span className="font-semibold text-sm">Hasil Analisis AI</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Skor Kredit</span>
                    <p className="font-bold text-lg">{selectedKredit.ai_skor || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Kategori</span>
                    <div className="mt-0.5">
                      {selectedKredit.ai_kategori && (
                        <Badge className={`${AI_KATEGORI_COLOR[selectedKredit.ai_kategori] || ''}`}>
                          {selectedKredit.ai_kategori}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {selectedKredit.ai_skor && selectedKredit.ai_skor < 70 && (
                  <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded p-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>Skor di bawah ambang batas standar. Pertimbangkan dengan hati-hati.</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Petani Info */}
              <div className="space-y-1 text-sm">
                <p className="font-medium">Info Petani</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Nama: </span>
                    <span className="font-medium">{selectedKredit.petani?.nama_lengkap}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lokasi: </span>
                    <span className="font-medium">{selectedKredit.petani?.kabupaten}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Jumlah: </span>
                    <span className="font-medium">{formatRupiah(selectedKredit.jumlah_diajukan)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tenor: </span>
                    <span className="font-medium">{selectedKredit.tenor_bulan} bulan</span>
                  </div>
                  {selectedKredit.tujuan_penggunaan && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Tujuan: </span>
                      <span className="font-medium">{selectedKredit.tujuan_penggunaan}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Review Form */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="review-keputusan">Keputusan</Label>
                  <Select value={reviewKeputusan} onValueChange={(v: string | null) => setReviewKeputusan(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih keputusan..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="setujui" label="Setujui">Setujui</SelectItem>
                      <SelectItem value="tolak" label="Tolak">Tolak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reviewKeputusan === 'setujui' && (
                  <div className="space-y-2">
                    <Label htmlFor="review-jumlah">Jumlah Disetujui (Rp)</Label>
                    <Input
                      id="review-jumlah"
                      type="number"
                      value={reviewJumlah}
                      onChange={(e) => setReviewJumlah(e.target.value)}
                      placeholder="Masukkan jumlah..."
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="review-catatan">Catatan</Label>
                  <Textarea
                    id="review-catatan"
                    placeholder="Catatan review..."
                    value={reviewCatatan}
                    onChange={(e) => setReviewCatatan(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              className={reviewKeputusan === 'tolak'
                ? 'bg-tani-red hover:bg-tani-red/90'
                : 'bg-tani-green hover:bg-tani-green/90'
              }
              disabled={!reviewKeputusan || submitting}
              onClick={async () => {
                if (!selectedKredit) return
                setSubmitting(true)
                try {
                  const res = await fetch('/api/admin/kredit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      kredit_id: selectedKredit.id,
                      keputusan: reviewKeputusan,
                      jumlah_disetujui: reviewKeputusan === 'setujui' ? Number(reviewJumlah) : undefined,
                      catatan: reviewCatatan,
                    }),
                  })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error || 'Gagal memproses')
                  setAllKredit((prev) =>
                    prev.map((k) => k.id === selectedKredit.id
                      ? { ...k, ...data.kredit, petani: k.petani, poktan: k.poktan }
                      : k
                    )
                  )
                  toast.success(reviewKeputusan === 'setujui' ? 'Kredit disetujui' : 'Kredit ditolak')
                  setDialogOpen(false)
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Gagal memproses review')
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              {reviewKeputusan === 'tolak' ? 'Tolak Pengajuan' : 'Setujui Kredit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
