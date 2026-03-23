'use client'

import { useState, useEffect, useRef } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Landmark, QrCode, Upload, Loader2, CheckCircle2, ImageIcon, Leaf, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { KomoditasConfig, ZonaKelayakan } from '@/types'

const ZONA_LABELS: Record<ZonaKelayakan, { label: string; color: string }> = {
  antar_pulau: { label: 'Antar Pulau', color: 'bg-green-100 text-green-700' },
  cold_chain: { label: 'Cold Chain', color: 'bg-blue-100 text-blue-700' },
  lokal_saja: { label: 'Lokal Saja', color: 'bg-red-100 text-red-700' },
}

interface RekeningEscrow {
  bank: string
  nomor: string
  atas_nama: string
}

interface QRISConfig {
  image_path: string
  merchant_name: string
}

export default function AdminSettingsPage() {
  const adminUser = useAuthStore((s) => s.user)

  const [rekening, setRekening] = useState<RekeningEscrow>({ bank: '', nomor: '', atas_nama: '' })
  const [qris, setQris] = useState<QRISConfig>({ image_path: '', merchant_name: '' })
  const [qrisPreview, setQrisPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingRekening, setSavingRekening] = useState(false)
  const [uploadingQris, setUploadingQris] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Komoditas config state
  const [komoditasList, setKomoditasList] = useState<KomoditasConfig[]>([])
  const [komoditasDialogOpen, setKomoditasDialogOpen] = useState(false)
  const [editingKomoditas, setEditingKomoditas] = useState<KomoditasConfig | null>(null)
  const [komoditasForm, setKomoditasForm] = useState({
    nama: '', kategori: '', zona: 'antar_pulau' as ZonaKelayakan,
    daya_tahan_hari: 30, susut_persen: 5,
    perlu_cold_chain: false, layak_antar_pulau: true,
    harga_petani_ref: '', harga_jakarta_ref: '', biaya_kapal_ref: '',
    catatan: '',
  })
  const [savingKomoditas, setSavingKomoditas] = useState(false)

  useEffect(() => {
    fetchConfig()
    fetchKomoditasConfig()
  }, [])

  async function fetchConfig() {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Gagal memuat konfigurasi')
      const data = await res.json()
      if (data.rekening_escrow) setRekening(data.rekening_escrow)
      if (data.qris) setQris(data.qris)
    } catch {
      toast.error('Gagal memuat konfigurasi')
    } finally {
      setLoading(false)
    }
  }

  async function fetchKomoditasConfig() {
    try {
      const res = await fetch('/api/admin/komoditas-config')
      const data = await res.json()
      if (data.success) setKomoditasList(data.komoditas_config)
    } catch {
      // silent
    }
  }

  function openKomoditasDialog(item?: KomoditasConfig) {
    if (item) {
      setEditingKomoditas(item)
      setKomoditasForm({
        nama: item.nama,
        kategori: item.kategori || '',
        zona: item.zona || 'antar_pulau',
        daya_tahan_hari: item.daya_tahan_hari,
        susut_persen: item.susut_persen,
        perlu_cold_chain: item.perlu_cold_chain,
        layak_antar_pulau: item.layak_antar_pulau,
        harga_petani_ref: item.harga_petani_ref ? String(item.harga_petani_ref) : '',
        harga_jakarta_ref: item.harga_jakarta_ref ? String(item.harga_jakarta_ref) : '',
        biaya_kapal_ref: item.biaya_kapal_ref ? String(item.biaya_kapal_ref) : '',
        catatan: item.catatan || '',
      })
    } else {
      setEditingKomoditas(null)
      setKomoditasForm({ nama: '', kategori: '', zona: 'antar_pulau', daya_tahan_hari: 30, susut_persen: 5, perlu_cold_chain: false, layak_antar_pulau: true, harga_petani_ref: '', harga_jakarta_ref: '', biaya_kapal_ref: '', catatan: '' })
    }
    setKomoditasDialogOpen(true)
  }

  async function handleSaveKomoditas() {
    if (!komoditasForm.nama) {
      toast.error('Nama komoditas wajib diisi')
      return
    }
    setSavingKomoditas(true)
    try {
      const method = editingKomoditas ? 'PATCH' : 'POST'
      const formData = {
        ...komoditasForm,
        harga_petani_ref: komoditasForm.harga_petani_ref ? parseInt(komoditasForm.harga_petani_ref) : null,
        harga_jakarta_ref: komoditasForm.harga_jakarta_ref ? parseInt(komoditasForm.harga_jakarta_ref) : null,
        biaya_kapal_ref: komoditasForm.biaya_kapal_ref ? parseInt(komoditasForm.biaya_kapal_ref) : null,
      }
      const payload = editingKomoditas
        ? { id: editingKomoditas.id, ...formData }
        : formData

      const res = await fetch('/api/admin/komoditas-config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan')
      toast.success(editingKomoditas ? 'Komoditas berhasil diupdate' : 'Komoditas berhasil ditambahkan')
      setKomoditasDialogOpen(false)
      fetchKomoditasConfig()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan komoditas')
    } finally {
      setSavingKomoditas(false)
    }
  }

  async function handleDeleteKomoditas(item: KomoditasConfig) {
    if (!confirm(`Hapus "${item.nama}" dari konfigurasi komoditas?`)) return
    try {
      const res = await fetch('/api/admin/komoditas-config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      })
      if (!res.ok) throw new Error()
      toast.success('Komoditas berhasil dihapus')
      fetchKomoditasConfig()
    } catch {
      toast.error('Gagal menghapus komoditas')
    }
  }

  async function handleSaveRekening() {
    if (!rekening.bank || !rekening.nomor || !rekening.atas_nama) {
      toast.error('Semua field rekening wajib diisi')
      return
    }

    setSavingRekening(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'rekening_escrow',
          value: rekening,
          adminId: adminUser?.id,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Rekening escrow berhasil disimpan')
    } catch {
      toast.error('Gagal menyimpan rekening')
    } finally {
      setSavingRekening(false)
    }
  }

  async function handleUploadQris(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = (ev) => setQrisPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploadingQris(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (adminUser?.id) formData.append('admin_id', adminUser.id)

      const res = await fetch('/api/admin/settings/qris-upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload gagal')
      }

      const data = await res.json()
      setQris({ ...qris, image_path: data.filePath })
      toast.success('QRIS berhasil diupload')
    } catch (err: any) {
      toast.error(err.message || 'Gagal upload QRIS')
      setQrisPreview(null)
    } finally {
      setUploadingQris(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <TopBar title="Pengaturan Platform" />

      <div className="p-4 lg:p-6 space-y-6 max-w-5xl">
        {/* Rekening Escrow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-tani-green/10">
                <Landmark className="h-4 w-4 text-tani-green" />
              </div>
              Rekening Escrow Taninesia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rekening ini digunakan untuk menerima pembayaran escrow dari supplier sebelum dana dicairkan ke poktan/petani.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bank">Nama Bank</Label>
                <Input
                  id="bank"
                  placeholder="BCA, BRI, Mandiri, dll"
                  value={rekening.bank}
                  onChange={(e) => setRekening({ ...rekening, bank: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomor">Nomor Rekening</Label>
                <Input
                  id="nomor"
                  placeholder="1234567890"
                  value={rekening.nomor}
                  onChange={(e) => setRekening({ ...rekening, nomor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="atas_nama">Atas Nama</Label>
                <Input
                  id="atas_nama"
                  placeholder="PT Taninesia Digital"
                  value={rekening.atas_nama}
                  onChange={(e) => setRekening({ ...rekening, atas_nama: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveRekening} disabled={savingRekening}>
                {savingRekening ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Simpan Rekening
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QRIS Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-tani-green/10">
                <QrCode className="h-4 w-4 text-tani-green" />
              </div>
              QRIS Statis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload gambar QRIS statis untuk pembayaran. Gambar ini akan ditampilkan ke supplier saat checkout.
            </p>

            {/* Preview */}
            {(qrisPreview || qris.image_path) && (
              <div className="flex justify-center p-4 bg-gray-50 rounded-xl border border-dashed border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrisPreview || ''}
                  alt="QRIS Preview"
                  className="max-w-[240px] rounded-lg"
                />
              </div>
            )}

            {!qrisPreview && !qris.image_path && (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-dashed border-border text-muted-foreground">
                <ImageIcon className="h-10 w-10 mb-2" />
                <p className="text-sm">Belum ada QRIS yang diupload</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUploadQris}
            />

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingQris}
              >
                {uploadingQris ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {qris.image_path ? 'Ganti QRIS' : 'Upload QRIS'}
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Konfigurasi Komoditas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-tani-green/10">
                  <Leaf className="h-4 w-4 text-tani-green" />
                </div>
                Konfigurasi Komoditas
              </CardTitle>
              <Button size="sm" onClick={() => openKomoditasDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                Tambah
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Kelola data kelayakan kirim per komoditas. Komoditas yang tidak layak antar pulau akan disembunyikan dari katalog supplier di pulau berbeda.
            </p>

            {komoditasList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada konfigurasi komoditas</p>
            ) : (
              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-center">Zona</TableHead>
                      <TableHead className="text-center">Tahan</TableHead>
                      <TableHead className="text-center">Susut</TableHead>
                      <TableHead className="text-center">Harga Petani</TableHead>
                      <TableHead className="text-center">Harga Jkt</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {komoditasList.map((item) => {
                      const zonaConf = ZONA_LABELS[item.zona] || ZONA_LABELS.antar_pulau
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-sm">{item.nama}</TableCell>
                          <TableCell>
                            {item.kategori && (
                              <Badge variant="secondary" className="text-[10px]">{item.kategori}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${zonaConf.color} text-[10px]`}>{zonaConf.label}</Badge>
                          </TableCell>
                          <TableCell className="text-center text-xs">{item.daya_tahan_hari}h</TableCell>
                          <TableCell className="text-center text-xs">{item.susut_persen}%</TableCell>
                          <TableCell className="text-center text-xs">
                            {item.harga_petani_ref ? `Rp ${item.harga_petani_ref.toLocaleString('id-ID')}` : '-'}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {item.harga_jakarta_ref ? `Rp ${item.harga_jakarta_ref.toLocaleString('id-ID')}` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openKomoditasDialog(item)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDeleteKomoditas(item)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Tambah/Edit Komoditas Config */}
      <Dialog open={komoditasDialogOpen} onOpenChange={(open) => { if (!open) setKomoditasDialogOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingKomoditas ? 'Edit Komoditas' : 'Tambah Komoditas'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Nama Komoditas</Label>
              <Input
                placeholder="Contoh: Jagung Pipilan Kering"
                value={komoditasForm.nama}
                onChange={(e) => setKomoditasForm({ ...komoditasForm, nama: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input
                  placeholder="serealia, rempah, buah, dll"
                  value={komoditasForm.kategori}
                  onChange={(e) => setKomoditasForm({ ...komoditasForm, kategori: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Zona Kelayakan</Label>
                <Select value={komoditasForm.zona} onValueChange={(v) => {
                  const zona = v as ZonaKelayakan
                  setKomoditasForm({
                    ...komoditasForm,
                    zona,
                    layak_antar_pulau: zona !== 'lokal_saja',
                    perlu_cold_chain: zona === 'cold_chain',
                  })
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="antar_pulau">Antar Pulau (Zona A)</SelectItem>
                    <SelectItem value="cold_chain">Cold Chain / Reefer (Zona B)</SelectItem>
                    <SelectItem value="lokal_saja">Lokal / Dalam Pulau (Zona C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Daya Tahan (hari)</Label>
                <Input
                  type="number"
                  value={komoditasForm.daya_tahan_hari}
                  onChange={(e) => setKomoditasForm({ ...komoditasForm, daya_tahan_hari: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Susut (%)</Label>
                <Input
                  type="number"
                  value={komoditasForm.susut_persen}
                  onChange={(e) => setKomoditasForm({ ...komoditasForm, susut_persen: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="perlu_cold_chain"
                  checked={komoditasForm.perlu_cold_chain}
                  onCheckedChange={(v) => setKomoditasForm({ ...komoditasForm, perlu_cold_chain: v === true })}
                />
                <Label htmlFor="perlu_cold_chain">Perlu Cold Chain</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="layak_antar_pulau"
                  checked={komoditasForm.layak_antar_pulau}
                  onCheckedChange={(v) => setKomoditasForm({ ...komoditasForm, layak_antar_pulau: v === true })}
                />
                <Label htmlFor="layak_antar_pulau">Layak Antar Pulau</Label>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Harga Petani (Rp/kg)</Label>
                <Input
                  type="number"
                  placeholder="9500"
                  value={komoditasForm.harga_petani_ref}
                  onChange={(e) => setKomoditasForm({ ...komoditasForm, harga_petani_ref: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Harga Jakarta (Rp/kg)</Label>
                <Input
                  type="number"
                  placeholder="17500"
                  value={komoditasForm.harga_jakarta_ref}
                  onChange={(e) => setKomoditasForm({ ...komoditasForm, harga_jakarta_ref: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Biaya Kapal (Rp/kg)</Label>
                <Input
                  type="number"
                  placeholder="400"
                  value={komoditasForm.biaya_kapal_ref}
                  onChange={(e) => setKomoditasForm({ ...komoditasForm, biaya_kapal_ref: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                placeholder="Zona asal, catatan khusus, dll"
                value={komoditasForm.catatan}
                onChange={(e) => setKomoditasForm({ ...komoditasForm, catatan: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKomoditasDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveKomoditas} disabled={savingKomoditas}>
              {savingKomoditas ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {editingKomoditas ? 'Simpan Perubahan' : 'Tambah Komoditas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
