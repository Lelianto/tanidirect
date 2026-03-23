'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store'
import { formatWaktu, timeAgo } from '@/lib/utils/date'
import {
  Truck, MapPin, Send, Clock, Package,
  CheckCircle2, Circle, Camera, User, ArrowRight,
  Filter,
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

function getNextStatuses(current: StatusPengiriman): StatusPengiriman[] {
  const idx = STATUS_ORDER.indexOf(current)
  return STATUS_ORDER.slice(idx + 1)
}

export default function AdminPengirimanPage() {
  const user = useAuthStore((s) => s.user)
  const [pengirimanList, setPengirimanList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('Semua Status')

  // Event dialog
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedCurrent, setSelectedCurrent] = useState<StatusPengiriman>('disiapkan')
  const [newStatus, setNewStatus] = useState<StatusPengiriman | ''>('')
  const [newCatatan, setNewCatatan] = useState('')
  const [newLokasiTeks, setNewLokasiTeks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const url = filterStatus === 'Semua Status'
        ? '/api/admin/pengiriman'
        : `/api/admin/pengiriman?status=${filterStatus}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setPengirimanList(data.pengiriman || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function openEventDialog(p: any) {
    setSelectedId(p.id)
    setSelectedCurrent(p.current_status)
    const next = getNextStatuses(p.current_status)
    setNewStatus(next[0] || '')
    setNewCatatan('')
    setNewLokasiTeks('')
    setEventDialogOpen(true)
  }

  async function submitEvent() {
    if (!selectedId || !newStatus || !user) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/pengiriman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pengiriman_id: selectedId,
          status: newStatus,
          catatan: newCatatan || null,
          lokasi_teks: newLokasiTeks || null,
          admin_id: user.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEventDialogOpen(false)
        fetchData()
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  const activeCount = pengirimanList.filter(p => p.current_status !== 'diterima').length

  return (
    <>
      <TopBar title="Manajemen Pengiriman" />
      <div className="p-4 lg:p-6 space-y-4 max-w-5xl">
        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua Status">Semua Status</SelectItem>
              {STATUS_ORDER.map(s => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {activeCount} aktif / {pengirimanList.length} total
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Memuat...</div>
        ) : pengirimanList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Truck className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tidak ada pengiriman</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pengirimanList.map((p) => {
              const tx = p.transaksi
              const statusConf = STATUS_CONFIG[p.current_status as StatusPengiriman] || STATUS_CONFIG.disiapkan
              const isDone = p.current_status === 'diterima'
              const currentIdx = STATUS_ORDER.indexOf(p.current_status)

              return (
                <Card key={p.id} className="shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${statusConf.color} text-xs font-medium`}>
                            {statusConf.label}
                          </Badge>
                          {isDone && (
                            <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700">Selesai</Badge>
                          )}
                        </div>
                        {tx && (
                          <p className="text-sm font-semibold">
                            {tx.komoditas} — Grade {tx.grade}
                          </p>
                        )}
                      </div>
                      {!isDone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEventDialog(p)}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Update
                        </Button>
                      )}
                    </div>

                    {/* Route + parties */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-tani-green shrink-0" />
                        <span className="truncate">{p.alamat_asal}</span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <MapPin className="h-3 w-3 text-tani-blue shrink-0" />
                        <span className="truncate">{p.alamat_tujuan}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>Poktan: <strong>{p.poktan?.nama_poktan || '-'}</strong></span>
                        <span>Supplier: <strong>{p.supplier?.nama_perusahaan || '-'}</strong></span>
                      </div>
                    </div>

                    {/* Progress mini */}
                    <div className="flex items-center gap-0.5">
                      {STATUS_ORDER.map((s, i) => (
                        <div key={s} className={`h-1.5 flex-1 rounded-full ${
                          i <= currentIdx ? 'bg-emerald-600' : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>

                    {/* Pengirim */}
                    {p.pengirim_nama && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {p.pengirim_nama}
                        {p.pengirim_telepon && <> · {p.pengirim_telepon}</>}
                        {p.kendaraan_info && <> · {p.kendaraan_info}</>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={(open) => { if (!open) setEventDialogOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status (Admin)</DialogTitle>
            <DialogDescription>
              Perbarui status pengiriman sebagai fallback admin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status Baru</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as StatusPengiriman)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {getNextStatuses(selectedCurrent).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lokasi (opsional)</Label>
              <Input
                placeholder="Lokasi saat ini"
                value={newLokasiTeks}
                onChange={(e) => setNewLokasiTeks(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                placeholder="Catatan update"
                value={newCatatan}
                onChange={(e) => setNewCatatan(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Batal</Button>
            <Button
              className="bg-tani-green hover:bg-tani-green/90 text-white"
              disabled={!newStatus || submitting}
              onClick={submitEvent}
            >
              {submitting ? 'Mengirim...' : 'Kirim Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
