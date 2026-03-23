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
  Truck, MapPin, Phone, Send, Package, Clock,
  ChevronDown, ChevronUp, User, Camera, MessageSquare,
  CheckCircle2, Circle, ArrowRight,
} from 'lucide-react'
import type { StatusPengiriman } from '@/types'

const STATUS_CONFIG: Record<StatusPengiriman, { label: string; color: string; icon: typeof Package }> = {
  disiapkan: { label: 'Disiapkan', color: 'bg-gray-100 text-gray-700', icon: Package },
  dijemput: { label: 'Dijemput', color: 'bg-blue-100 text-blue-700', icon: Truck },
  dalam_perjalanan: { label: 'Dalam Perjalanan', color: 'bg-amber-100 text-amber-700', icon: Truck },
  tiba_di_tujuan: { label: 'Tiba di Tujuan', color: 'bg-emerald-100 text-emerald-700', icon: MapPin },
  diterima: { label: 'Diterima', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
}

const STATUS_ORDER: StatusPengiriman[] = [
  'disiapkan', 'dijemput', 'dalam_perjalanan', 'tiba_di_tujuan', 'diterima',
]

function getNextStatuses(current: StatusPengiriman): StatusPengiriman[] {
  const idx = STATUS_ORDER.indexOf(current)
  return STATUS_ORDER.slice(idx + 1)
}

export default function PoktanPengirimanPage() {
  const user = useAuthStore((s) => s.user)
  const [pengirimanList, setPengirimanList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Event dialog
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [selectedPengiriman, setSelectedPengiriman] = useState<any>(null)
  const [newStatus, setNewStatus] = useState<StatusPengiriman | ''>('')
  const [newCatatan, setNewCatatan] = useState('')
  const [newLokasiTeks, setNewLokasiTeks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Info dialog (edit pengirim)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [pengirimNama, setPengirimNama] = useState('')
  const [pengirimTelepon, setPengirimTelepon] = useState('')
  const [kendaraanInfo, setKendaraanInfo] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/poktan/pengiriman?user_id=${user.id}`)
      const data = await res.json()
      if (data.success) {
        setPengirimanList(data.pengiriman || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function openEventDialog(p: any) {
    setSelectedPengiriman(p)
    const next = getNextStatuses(p.current_status)
    setNewStatus(next[0] || '')
    setNewCatatan('')
    setNewLokasiTeks('')
    setEventDialogOpen(true)
  }

  async function submitEvent() {
    if (!selectedPengiriman || !newStatus || !user) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/poktan/pengiriman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pengiriman_id: selectedPengiriman.id,
          status: newStatus,
          catatan: newCatatan || null,
          lokasi_teks: newLokasiTeks || null,
          user_id: user.id,
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

  function openInfoDialog(p: any) {
    setSelectedPengiriman(p)
    setPengirimNama(p.pengirim_nama || '')
    setPengirimTelepon(p.pengirim_telepon || '')
    setKendaraanInfo(p.kendaraan_info || '')
    setInfoDialogOpen(true)
  }

  async function saveInfo() {
    if (!selectedPengiriman || !user) return
    setSavingInfo(true)
    try {
      const res = await fetch('/api/poktan/pengiriman', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pengiriman_id: selectedPengiriman.id,
          user_id: user.id,
          pengirim_nama: pengirimNama,
          pengirim_telepon: pengirimTelepon,
          kendaraan_info: kendaraanInfo,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setInfoDialogOpen(false)
        fetchData()
      }
    } catch {
      // silent
    } finally {
      setSavingInfo(false)
    }
  }

  const activeCount = pengirimanList.filter(p => p.current_status !== 'diterima').length

  return (
    <>
      <TopBar title="Pengiriman" />
      <div className="p-4 lg:p-6 space-y-4 max-w-4xl">
        <p className="text-sm text-muted-foreground">
          {activeCount} pengiriman aktif
        </p>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Memuat...</div>
        ) : pengirimanList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Truck className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada pengiriman</p>
            <p className="text-xs mt-1">Pengiriman otomatis dibuat saat transaksi memasuki status &quot;Dalam Pengiriman&quot;</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pengirimanList.map((p) => {
              const tx = p.transaksi
              const statusConf = STATUS_CONFIG[p.current_status as StatusPengiriman] || STATUS_CONFIG.disiapkan
              const isExpanded = expandedId === p.id
              const nextStatuses = getNextStatuses(p.current_status)
              const isDone = p.current_status === 'diterima'

              return (
                <Card key={p.id} className="shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${statusConf.color} text-xs font-medium`}>
                            <statusConf.icon className="h-3 w-3 mr-1" />
                            {statusConf.label}
                          </Badge>
                          {isDone && (
                            <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700">
                              Selesai
                            </Badge>
                          )}
                        </div>
                        {tx && (
                          <p className="text-sm font-semibold font-[family-name:var(--font-heading)]">
                            {tx.komoditas} — Grade {tx.grade}
                          </p>
                        )}
                      </div>
                      {tx && (
                        <StatusBadge status={tx.status} />
                      )}
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-tani-green shrink-0" />
                      <span className="truncate text-xs">{p.alamat_asal}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <MapPin className="h-4 w-4 text-tani-blue shrink-0" />
                      <span className="truncate text-xs">{p.alamat_tujuan}</span>
                    </div>

                    {/* Pengirim info */}
                    {p.pengirim_nama && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{p.pengirim_nama}</span>
                        {p.pengirim_telepon && (
                          <>
                            <Phone className="h-3 w-3 ml-2" />
                            <span>{p.pengirim_telepon}</span>
                          </>
                        )}
                        {p.kendaraan_info && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                            {p.kendaraan_info}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Progress steps */}
                    <div className="flex items-center gap-1">
                      {STATUS_ORDER.map((s, i) => {
                        const currentIdx = STATUS_ORDER.indexOf(p.current_status)
                        const isCompleted = i <= currentIdx
                        const isCurrent = i === currentIdx
                        return (
                          <div key={s} className="flex items-center flex-1 gap-1">
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-100 text-gray-400 border border-gray-300'
                              } ${isCurrent ? 'ring-2 ring-emerald-300' : ''}`}
                            >
                              {isCompleted ? '✓' : i + 1}
                            </div>
                            {i < STATUS_ORDER.length - 1 && (
                              <div className={`h-1 flex-1 rounded-full ${
                                i < currentIdx ? 'bg-emerald-600' : 'bg-gray-200'
                              }`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      {STATUS_ORDER.map((s) => (
                        <span key={s} className="flex-1 text-[10px] text-center text-muted-foreground leading-tight">
                          {STATUS_CONFIG[s].label}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                        {isExpanded ? 'Tutup' : 'Timeline'}
                        {p.events?.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">{p.events.length}</Badge>
                        )}
                      </Button>
                      {!isDone && (
                        <Button
                          size="sm"
                          className="flex-1 bg-tani-green hover:bg-tani-green/90 text-white"
                          onClick={() => openEventDialog(p)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Update Status
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInfoDialog(p)}
                      >
                        <Truck className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Expanded: Timeline */}
                    {isExpanded && (
                      <>
                        <Separator />
                        <div className="space-y-0">
                          {(p.events || []).length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">
                              Belum ada update. Klik &quot;Update Status&quot; untuk memulai.
                            </p>
                          ) : (
                            <div className="relative pl-6">
                              {/* Timeline line */}
                              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />

                              {(p.events as any[]).map((ev, i) => {
                                const evConf = STATUS_CONFIG[ev.status as StatusPengiriman]
                                const isLast = i === p.events.length - 1
                                return (
                                  <div key={ev.id} className="relative pb-4 last:pb-0">
                                    {/* Dot */}
                                    <div className={`absolute -left-6 top-1 h-[22px] w-[22px] rounded-full flex items-center justify-center ${
                                      isLast ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-emerald-600 text-emerald-600'
                                    }`}>
                                      {isLast ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-2 w-2 fill-current" />}
                                    </div>

                                    {/* Content */}
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

                                      {ev.catatan && (
                                        <p className="text-sm mt-1">{ev.catatan}</p>
                                      )}

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

                                      <p className="text-[10px] text-muted-foreground mt-1">
                                        {formatWaktu(ev.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog: Add Event */}
      <Dialog open={eventDialogOpen} onOpenChange={(open) => { if (!open) setEventDialogOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status Pengiriman</DialogTitle>
            <DialogDescription>
              {selectedPengiriman?.transaksi?.komoditas} — {selectedPengiriman?.alamat_asal} → {selectedPengiriman?.alamat_tujuan}
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
                  {selectedPengiriman && getNextStatuses(selectedPengiriman.current_status).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lokasi Saat Ini (opsional)</Label>
              <Input
                placeholder="Contoh: Gudang Poktan Sejahtera, Garut"
                value={newLokasiTeks}
                onChange={(e) => setNewLokasiTeks(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                placeholder="Contoh: Barang sudah dimuat ke pickup, berangkat jam 2 siang"
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
              <Send className="h-4 w-4 mr-1" />
              {submitting ? 'Mengirim...' : 'Kirim Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Pengirim Info */}
      <Dialog open={infoDialogOpen} onOpenChange={(open) => { if (!open) setInfoDialogOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Info Pengirim</DialogTitle>
            <DialogDescription>
              Isi informasi pengirim / transporter
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Pengirim</Label>
              <Input
                placeholder="Contoh: Pak Joko"
                value={pengirimNama}
                onChange={(e) => setPengirimNama(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>No. Telepon</Label>
              <Input
                placeholder="Contoh: 08123456789"
                value={pengirimTelepon}
                onChange={(e) => setPengirimTelepon(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kendaraan</Label>
              <Input
                placeholder="Contoh: Pickup L300 B 1234 XY"
                value={kendaraanInfo}
                onChange={(e) => setKendaraanInfo(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoDialogOpen(false)}>Batal</Button>
            <Button
              className="bg-tani-green hover:bg-tani-green/90 text-white"
              disabled={savingInfo}
              onClick={saveInfo}
            >
              {savingInfo ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
