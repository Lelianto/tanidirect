'use client'

import { useState, useEffect } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { formatTanggal } from '@/lib/utils/date'
import { formatRupiah } from '@/lib/utils/currency'
import type { Dispute } from '@/types'
import {
  AlertTriangle, Clock, FileWarning, Scale, MessageSquare,
} from 'lucide-react'

export default function AdminDisputePage() {
  const [activeTab, setActiveTab] = useState('diajukan')
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [resolusi, setResolusi] = useState('')
  const [keputusan, setKeputusan] = useState('')
  const [kompensasi, setKompensasi] = useState(0)
  const [allDisputes, setAllDisputes] = useState<Dispute[]>([])

  useEffect(() => {
    fetch('/api/admin/disputes')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAllDisputes(data.disputes || [])
      })
      .catch(() => {})
  }, [])

  const filterByTab = (tab: string) => {
    return allDisputes.filter((d) => d.status === tab)
  }

  const aktifCount = allDisputes.filter((d) => d.status !== 'selesai').length
  const slaCount = allDisputes.filter((d) => {
    if (d.status === 'selesai') return false
    const deadline = new Date(d.sla_deadline)
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()
    return diff > 0 && diff < 24 * 60 * 60 * 1000
  }).length
  const eskalasi = allDisputes.filter((d) => d.status === 'eskalasi').length
  const selesaiBulanIni = allDisputes.filter((d) => d.status === 'selesai').length

  const getSLAText = (dispute: Dispute) => {
    if (dispute.status === 'selesai') return 'Selesai'
    const deadline = new Date(dispute.sla_deadline)
    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    if (diffMs < 0) return 'Melewati SLA'
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays > 0) return `${diffDays} hari ${diffHours % 24} jam tersisa`
    return `${diffHours} jam tersisa`
  }

  const handleDetail = (dispute: Dispute) => {
    setSelectedDispute(dispute)
    setResolusi('')
    setKeputusan('')
    setKompensasi(0)
    setDialogOpen(true)
  }

  const renderDisputeCard = (dispute: Dispute) => (
    <Card key={dispute.id} className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div>
              <p className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                {dispute.id}
              </p>
              <p className="text-xs text-muted-foreground">
                Transaksi: {dispute.transaksi_id}
              </p>
            </div>
          </div>
          <StatusBadge status={dispute.kategori} />
        </div>

        <div className="mb-2">
          <p className="text-xs text-muted-foreground">Pelapor</p>
          <p className="text-sm font-medium">{dispute.pelapor_nama}</p>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{getSLAText(dispute)}</span>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm line-clamp-2">{dispute.deskripsi}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>Diajukan: {formatTanggal(dispute.created_at)}</span>
        </div>

        <Button
          className="w-full bg-tani-green hover:bg-tani-green/90 text-white"
          size="sm"
          onClick={() => handleDetail(dispute)}
        >
          <FileWarning className="h-4 w-4 mr-1" />
          Detail
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Dispute Dashboard" />

      <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
        {/* StatCards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Aktif"
            value={String(aktifCount)}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <StatCard
            title="Mendekati SLA"
            value={String(slaCount)}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatCard
            title="Eskalasi"
            value={String(eskalasi)}
            icon={<Scale className="h-5 w-5" />}
          />
          <StatCard
            title="Selesai Bulan Ini"
            value={String(selesaiBulanIni)}
            icon={<MessageSquare className="h-5 w-5" />}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="diajukan" className="text-xs sm:text-sm">Diajukan</TabsTrigger>
            <TabsTrigger value="investigasi" className="text-xs sm:text-sm">Investigasi</TabsTrigger>
            <TabsTrigger value="mediasi" className="text-xs sm:text-sm">Mediasi</TabsTrigger>
            <TabsTrigger value="eskalasi" className="text-xs sm:text-sm">Eskalasi</TabsTrigger>
            <TabsTrigger value="selesai" className="text-xs sm:text-sm">Selesai</TabsTrigger>
          </TabsList>

          {['diajukan', 'investigasi', 'mediasi', 'eskalasi', 'selesai'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {filterByTab(tab).map(renderDisputeCard)}
              {filterByTab(tab).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Scale className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tidak ada dispute dengan status {tab}</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v: boolean) => setDialogOpen(v)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-heading)]">
              Detail Dispute {selectedDispute?.id}
            </DialogTitle>
            <DialogDescription>
              {selectedDispute?.pelapor_nama} vs {selectedDispute?.terlapor_nama}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Deskripsi:</p>
              <p className="text-muted-foreground">{selectedDispute?.deskripsi}</p>
            </div>

            {/* Bukti */}
            <div>
              <p className="text-sm font-medium mb-2">Bukti ({selectedDispute?.bukti.length})</p>
              <div className="space-y-2">
                {selectedDispute?.bukti.map((b) => (
                  <div key={b.id} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2">
                    <FileWarning className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs font-medium">{b.deskripsi}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.tipe} &bull; {b.uploaded_by} &bull; {formatTanggal(b.uploaded_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-sm font-medium mb-2">Timeline</p>
              <div className="relative pl-4 border-l-2 border-gray-200 space-y-3">
                {selectedDispute?.timeline.map((tl) => (
                  <div key={tl.id} className="relative">
                    <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-tani-green border-2 border-white" />
                    <p className="text-xs font-medium">{tl.aksi}</p>
                    <p className="text-xs text-muted-foreground">{tl.oleh} &bull; {formatTanggal(tl.created_at)}</p>
                    {tl.catatan && (
                      <p className="text-xs text-muted-foreground mt-0.5 bg-gray-50 rounded p-1.5">{tl.catatan}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Resolusi */}
            {selectedDispute?.status !== 'selesai' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="keputusan">Keputusan Resolusi</Label>
                  <Select value={keputusan} onValueChange={(v: string | null) => setKeputusan(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih resolusi..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kompensasi" label="Kompensasi untuk pelapor">Kompensasi untuk pelapor</SelectItem>
                      <SelectItem value="tolak" label="Tolak dispute">Tolak dispute</SelectItem>
                      <SelectItem value="mediasi" label="Lanjutkan ke mediasi">Lanjutkan ke mediasi</SelectItem>
                      <SelectItem value="eskalasi" label="Eskalasi ke level atas">Eskalasi ke level atas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolusi">Catatan Resolusi</Label>
                  <Textarea
                    id="resolusi"
                    placeholder="Tuliskan detail resolusi..."
                    value={resolusi}
                    onChange={(e) => setResolusi(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kompensasi">Kompensasi (Rp)</Label>
                  <Input
                    id="kompensasi"
                    type="number"
                    placeholder="0"
                    value={kompensasi}
                    onChange={(e) => setKompensasi(Number(e.target.value))}
                  />
                  {kompensasi > 0 && (
                    <p className="text-xs text-muted-foreground">{formatRupiah(kompensasi)}</p>
                  )}
                </div>
              </>
            )}

            {selectedDispute?.status === 'selesai' && selectedDispute.resolusi && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs font-medium text-green-800 mb-1">Resolusi:</p>
                <p className="text-xs text-green-700">{selectedDispute.resolusi}</p>
                {selectedDispute.kompensasi !== undefined && selectedDispute.kompensasi > 0 && (
                  <p className="text-xs text-green-700 mt-1 font-medium">
                    Kompensasi: {formatRupiah(selectedDispute.kompensasi)}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Tutup
            </Button>
            {selectedDispute?.status !== 'selesai' && (
              <Button
                className="bg-tani-green hover:bg-tani-green/90"
                disabled={!keputusan || !resolusi}
                onClick={() => setDialogOpen(false)}
              >
                Simpan Resolusi
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
