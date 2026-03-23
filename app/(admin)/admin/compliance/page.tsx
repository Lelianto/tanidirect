'use client'

import { useState, useEffect } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { formatTanggal } from '@/lib/utils/date'
import { toast } from 'sonner'
import type { AnomaliLog } from '@/types'
import {
  ShieldAlert, AlertTriangle, Clock, CheckCircle2, FileWarning, Loader2,
} from 'lucide-react'

export default function AdminCompliancePage() {
  const [activeTab, setActiveTab] = useState('open')
  const [selectedAnomali, setSelectedAnomali] = useState<AnomaliLog | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [keputusan, setKeputusan] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [anomaliWithPoktan, setAnomaliWithPoktan] = useState<(AnomaliLog & { poktan?: any })[]>([])

  useEffect(() => {
    fetch('/api/admin/compliance')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAnomaliWithPoktan(data.anomali || [])
      })
      .catch(() => {})
  }, [])

  const filterByTab = (tab: string) => {
    return anomaliWithPoktan.filter((a) => {
      if (tab === 'open') return a.status_tindak_lanjut === 'open'
      if (tab === 'ditangani') return a.status_tindak_lanjut === 'ditangani'
      return a.status_tindak_lanjut === 'selesai'
    })
  }

  const openCount = anomaliWithPoktan.filter((a) => a.status_tindak_lanjut === 'open').length
  const handlingCount = anomaliWithPoktan.filter((a) => a.status_tindak_lanjut === 'ditangani').length
  const doneCount = anomaliWithPoktan.filter((a) => a.status_tindak_lanjut === 'selesai').length

  const handleTangani = (anomali: AnomaliLog) => {
    setSelectedAnomali(anomali)
    setCatatan('')
    setKeputusan('')
    setDialogOpen(true)
  }

  const risikoIcon = (risiko: string) => {
    switch (risiko) {
      case 'kritis': return <ShieldAlert className="h-4 w-4 text-red-600" />
      case 'tinggi': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'sedang': return <FileWarning className="h-4 w-4 text-amber-600" />
      default: return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
  }

  const renderAnomaliCard = (a: AnomaliLog & { poktan?: any }) => (
    <Card key={a.id} className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {risikoIcon(a.tingkat_risiko)}
            <div>
              <p className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                {a.poktan?.nama_poktan || 'Poktan tidak ditemukan'}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.poktan?.kabupaten}, {a.poktan?.provinsi}
              </p>
            </div>
          </div>
          <StatusBadge status={a.tingkat_risiko} />
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Kode: {(a.temuan as Record<string, unknown>).kategori as string}
          </p>
          <p className="text-sm">
            {(a.temuan as Record<string, unknown>).deskripsi as string}
          </p>
        </div>

        {a.rekomendasi && (
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Rekomendasi:</p>
            <p className="text-xs text-foreground">{a.rekomendasi}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Scan: {formatTanggal(a.scanned_at)}</span>
        </div>

        {a.status_tindak_lanjut === 'selesai' && (
          <div className="mt-3 pt-3 border-t space-y-1">
            <div className="flex items-center gap-1 text-xs text-green-700">
              <CheckCircle2 className="h-3 w-3" />
              <span>Diselesaikan: {a.resolved_at ? formatTanggal(a.resolved_at) : '-'}</span>
            </div>
            {a.catatan_admin && (
              <p className="text-xs text-muted-foreground bg-green-50 rounded p-2">
                {a.catatan_admin}
              </p>
            )}
          </div>
        )}

        {a.status_tindak_lanjut === 'open' && (
          <Button
            className="w-full mt-3 bg-tani-amber hover:bg-tani-amber/90 text-white"
            size="sm"
            onClick={() => handleTangani(a)}
          >
            <ShieldAlert className="h-4 w-4 mr-1" />
            Tangani
          </Button>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Compliance & Anomali" />

      <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="open" className="text-xs sm:text-sm">
              Perlu Tindakan
              {openCount > 0 && (
                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-tani-red text-[10px] font-bold text-white">
                  {openCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ditangani" className="text-xs sm:text-sm">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Ditangani
              {handlingCount > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({handlingCount})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="selesai" className="text-xs sm:text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Selesai
              <span className="ml-1.5 text-xs text-muted-foreground">({doneCount})</span>
            </TabsTrigger>
          </TabsList>

          {['open', 'ditangani', 'selesai'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {filterByTab(tab).map(renderAnomaliCard)}
              {filterByTab(tab).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {tab === 'open' ? 'Tidak ada anomali yang perlu ditangani' :
                     tab === 'ditangani' ? 'Tidak ada anomali yang sedang ditangani' :
                     'Belum ada anomali yang selesai'}
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Tangani Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v: boolean) => setDialogOpen(v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-heading)]">
              Tangani Anomali
            </DialogTitle>
            <DialogDescription>
              {selectedAnomali?.poktan?.nama_poktan} &mdash;{' '}
              {(selectedAnomali?.temuan as Record<string, unknown>)?.kategori as string}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Temuan:</p>
              <p className="text-muted-foreground">
                {(selectedAnomali?.temuan as Record<string, unknown>)?.deskripsi as string}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keputusan">Keputusan</Label>
              <Select value={keputusan} onValueChange={(v: string | null) => setKeputusan(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih keputusan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear" label="Clear - Tidak ada masalah">Clear - Tidak ada masalah</SelectItem>
                  <SelectItem value="warning" label="Warning - Peringatan">Warning - Peringatan</SelectItem>
                  <SelectItem value="suspend" label="Suspend - Tangguhkan sementara">Suspend - Tangguhkan sementara</SelectItem>
                  <SelectItem value="blacklist" label="Blacklist - Blokir permanen">Blacklist - Blokir permanen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan Investigasi</Label>
              <Textarea
                id="catatan"
                placeholder="Tuliskan catatan investigasi..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-tani-green hover:bg-tani-green/90"
              disabled={!keputusan || !catatan || submitting}
              onClick={async () => {
                if (!selectedAnomali) return
                setSubmitting(true)
                try {
                  const res = await fetch('/api/admin/compliance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      anomali_id: selectedAnomali.id,
                      keputusan,
                      catatan,
                    }),
                  })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error || 'Gagal memproses')
                  setAnomaliWithPoktan((prev) =>
                    prev.map((a) => a.id === selectedAnomali.id
                      ? { ...a, ...data.anomali, poktan: a.poktan }
                      : a
                    )
                  )
                  toast.success('Keputusan compliance berhasil disimpan')
                  setDialogOpen(false)
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Gagal menyimpan keputusan')
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Simpan Keputusan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
