'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store'
import { useKomoditasConfig } from '@/hooks/useKomoditasConfig'
import { toast } from 'sonner'
import {
  Store, Plus, Send, Trash2,
  Loader2, Wheat, Calendar, Weight, ImagePlus, X,
} from 'lucide-react'
import Image from 'next/image'
import type { CatatanPanen, StatusPanen } from '@/types'
import { GRADE_LABELS, GRADE_COLORS } from '@/lib/constants/komoditas'

const STATUS_CONFIG: Record<StatusPanen, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  tersedia: { label: 'Tersedia', color: 'bg-green-100 text-green-700' },
  terjual: { label: 'Terjual', color: 'bg-blue-100 text-blue-700' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700' },
}

export default function PoktanPanenPage() {
  const user = useAuthStore((s) => s.user)
  const { namaList: komoditasOptions } = useKomoditasConfig()
  const [catatanList, setCatatanList] = useState<CatatanPanen[]>([])
  const [stats, setStats] = useState({ total: 0, totalVolume: 0, volumeTersedia: 0, listingAktif: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('semua')

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    komoditas: '', grade: 'B', volume_panen_kg: '', tanggal_panen: '', catatan: '',
  })
  const [fotoFiles, setFotoFiles] = useState<File[]>([])
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Publish dialog
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishTarget, setPublishTarget] = useState<CatatanPanen | null>(null)
  const [publishHarga, setPublishHarga] = useState('')
  const [publishing, setPublishing] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/poktan/panen?user_id=${user.id}`)
      const data = await res.json()
      if (data.success) {
        setCatatanList(data.catatan_panen || [])
        setStats(data.stats)
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

  function handleFotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const total = fotoFiles.length + files.length
    if (total > 3) {
      toast.error('Maksimal 3 foto')
      return
    }

    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`File "${f.name}" melebihi 5MB`)
        return
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        toast.error(`File "${f.name}" harus JPG, PNG, atau WebP`)
        return
      }
    }

    const newFiles = [...fotoFiles, ...files]
    setFotoFiles(newFiles)
    setFotoPreviews(newFiles.map((f) => URL.createObjectURL(f)))

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  function removeFoto(index: number) {
    URL.revokeObjectURL(fotoPreviews[index])
    const newFiles = fotoFiles.filter((_, i) => i !== index)
    setFotoFiles(newFiles)
    setFotoPreviews(newFiles.map((f) => URL.createObjectURL(f)))
  }

  async function handleCreate() {
    if (!user || !form.komoditas || !form.volume_panen_kg || !form.tanggal_panen) {
      toast.error('Komoditas, volume, dan tanggal panen wajib diisi')
      return
    }
    if (fotoFiles.length === 0) {
      toast.error('Minimal 1 foto produk wajib dilampirkan')
      return
    }

    setSubmitting(true)
    try {
      // 1. Upload photos first
      setUploading(true)
      const formData = new FormData()
      formData.append('user_id', user.id)
      for (const file of fotoFiles) {
        formData.append('files', file)
      }

      const uploadRes = await fetch('/api/poktan/panen/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      setUploading(false)

      if (!uploadData.success) {
        toast.error(uploadData.error || 'Gagal upload foto')
        return
      }

      // 2. Create catatan panen with foto_urls
      const res = await fetch('/api/poktan/panen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          komoditas: form.komoditas,
          grade: form.grade,
          volume_panen_kg: parseFloat(form.volume_panen_kg),
          tanggal_panen: form.tanggal_panen,
          catatan: form.catatan || null,
          foto_urls: uploadData.foto_urls,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Catatan panen berhasil dibuat')
        setCreateOpen(false)
        setForm({ komoditas: '', grade: 'B', volume_panen_kg: '', tanggal_panen: '', catatan: '' })
        setFotoFiles([])
        setFotoPreviews([])
        fetchData()
      } else {
        toast.error(data.error || 'Gagal membuat catatan')
      }
    } catch {
      toast.error('Gagal membuat catatan panen')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  function openPublish(item: CatatanPanen) {
    setPublishTarget(item)
    setPublishHarga(item.harga_per_kg ? String(item.harga_per_kg) : '')
    setPublishOpen(true)
  }

  async function handlePublish() {
    if (!publishTarget || !publishHarga || !user) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/poktan/panen/${publishTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          user_id: user.id,
          harga_per_kg: parseFloat(publishHarga),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Berhasil diterbitkan ke katalog!')
        setPublishOpen(false)
        fetchData()
      } else {
        toast.error(data.error || 'Gagal publish')
      }
    } catch {
      toast.error('Gagal menerbitkan ke katalog')
    } finally {
      setPublishing(false)
    }
  }

  async function handleDelete(item: CatatanPanen) {
    if (!user || !confirm('Hapus catatan panen ini?')) return
    try {
      const res = await fetch(`/api/poktan/panen/${item.id}?user_id=${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Catatan panen dihapus')
        fetchData()
      } else {
        toast.error(data.error || 'Gagal menghapus')
      }
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  async function handleMarkStatus(item: CatatanPanen, action: 'terjual' | 'expired') {
    if (!user) return
    try {
      const res = await fetch(`/api/poktan/panen/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, user_id: user.id }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Status diubah ke ${action}`)
        fetchData()
      } else {
        toast.error(data.error || 'Gagal mengubah status')
      }
    } catch {
      toast.error('Gagal mengubah status')
    }
  }

  const filtered = activeTab === 'semua'
    ? catatanList
    : catatanList.filter((c) => c.status === activeTab)

  return (
    <>
      <TopBar title="Catatan Panen" />

      <div className="p-4 lg:p-6 space-y-4 max-w-4xl">
        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-heading)]">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Catatan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-heading)] text-tani-green">
                {stats.volumeTersedia.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-muted-foreground">Volume Tersedia (kg)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-heading)] text-tani-blue">
                {stats.listingAktif}
              </p>
              <p className="text-xs text-muted-foreground">Listing Aktif</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs + Add Button */}
        <div className="flex items-center justify-between gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="semua">Semua</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="tersedia">Tersedia</TabsTrigger>
              <TabsTrigger value="terjual">Terjual</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Catat Panen
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wheat className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada catatan panen</p>
            <p className="text-xs mt-1">Klik &quot;Catat Panen&quot; untuk memulai</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const sc = STATUS_CONFIG[item.status]
              const gc = GRADE_COLORS[item.grade] || GRADE_COLORS.B
              const volumeSisa = Number(item.volume_panen_kg) - Number(item.volume_terjual_kg)

              return (
                <Card key={item.id} className="shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${sc.color} text-xs font-medium`}>{sc.label}</Badge>
                          <Badge className={`${gc} text-xs`}>Grade {item.grade} — {GRADE_LABELS[item.grade]}</Badge>
                        </div>
                        <p className="text-sm font-semibold font-[family-name:var(--font-heading)]">
                          {item.komoditas}
                        </p>
                      </div>
                      {item.harga_per_kg && (
                        <p className="text-sm font-bold text-tani-green whitespace-nowrap">
                          Rp {Number(item.harga_per_kg).toLocaleString('id-ID')}/kg
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Weight className="h-3 w-3" />
                        {Number(item.volume_panen_kg).toLocaleString('id-ID')} kg
                        {item.status === 'tersedia' && (
                          <span className="text-tani-green ml-1">({volumeSisa.toLocaleString('id-ID')} kg tersedia)</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.tanggal_panen}
                      </span>
                    </div>

                    {item.foto_urls && item.foto_urls.length > 0 && (
                      <div className="flex gap-1.5">
                        {item.foto_urls.map((url, i) => (
                          <div key={i} className="w-12 h-12 rounded overflow-hidden border">
                            <Image
                              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/platform-assets/${url}`}
                              alt={`Foto ${i + 1}`}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {item.catatan && (
                      <p className="text-xs text-muted-foreground">{item.catatan}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {item.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-tani-green hover:bg-tani-green/90 text-white"
                            onClick={() => openPublish(item)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Terbitkan ke Katalog
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {item.status === 'tersedia' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleMarkStatus(item, 'terjual')}
                          >
                            Tandai Terjual
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleMarkStatus(item, 'expired')}
                          >
                            Expired
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog: Catat Panen Baru */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setCreateOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Panen Baru</DialogTitle>
            <DialogDescription>
              Catat hasil panen untuk dipublish ke katalog supplier
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Komoditas</Label>
              <Select value={form.komoditas} onValueChange={(v) => setForm({ ...form, komoditas: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih komoditas" />
                </SelectTrigger>
                <SelectContent>
                  {komoditasOptions.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A — Premium</SelectItem>
                    <SelectItem value="B">B — Standar</SelectItem>
                    <SelectItem value="C">C — Ekonomi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Volume Panen (kg)</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={form.volume_panen_kg}
                  onChange={(e) => setForm({ ...form, volume_panen_kg: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tanggal Panen</Label>
              <Input
                type="date"
                value={form.tanggal_panen}
                onChange={(e) => setForm({ ...form, tanggal_panen: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                placeholder="Catatan tambahan tentang hasil panen"
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Foto Produk <span className="text-red-500">*</span></Label>
              <p className="text-xs text-muted-foreground">Minimal 1, maksimal 3 foto (JPG/PNG/WebP, maks 5MB)</p>
              <div className="flex gap-2 flex-wrap">
                {fotoPreviews.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFoto(i)}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {fotoFiles.length < 3 && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-tani-green/50 transition-colors">
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-0.5">Tambah</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleFotoSelect}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button
              className="bg-tani-green hover:bg-tani-green/90 text-white"
              disabled={submitting}
              onClick={handleCreate}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {uploading ? 'Mengupload foto...' : submitting ? 'Menyimpan...' : 'Simpan Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Publish ke Katalog */}
      <Dialog open={publishOpen} onOpenChange={(open) => { if (!open) setPublishOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terbitkan ke Katalog</DialogTitle>
            <DialogDescription>
              Tentukan harga jual per kg untuk mempublish ke katalog supplier
            </DialogDescription>
          </DialogHeader>

          {publishTarget && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                <p className="font-semibold">{publishTarget.komoditas} — Grade {publishTarget.grade}</p>
                <p className="text-muted-foreground">
                  Volume: {Number(publishTarget.volume_panen_kg).toLocaleString('id-ID')} kg
                </p>
                <p className="text-muted-foreground">
                  Tanggal panen: {publishTarget.tanggal_panen}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Harga per kg (Rp)</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={publishHarga}
                  onChange={(e) => setPublishHarga(e.target.value)}
                />
              </div>

              {publishHarga && (
                <div className="bg-tani-green/5 border border-tani-green/20 rounded-lg p-3 text-sm">
                  <p className="font-medium text-tani-green">Estimasi Total Nilai</p>
                  <p className="text-lg font-bold">
                    Rp {(Number(publishTarget.volume_panen_kg) * parseFloat(publishHarga || '0')).toLocaleString('id-ID')}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>Batal</Button>
            <Button
              className="bg-tani-green hover:bg-tani-green/90 text-white"
              disabled={publishing || !publishHarga}
              onClick={handlePublish}
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Store className="h-4 w-4 mr-1" />}
              {publishing ? 'Menerbitkan...' : 'Terbitkan ke Katalog'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
