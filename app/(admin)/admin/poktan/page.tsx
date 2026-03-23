'use client'

import { useState, useMemo, useEffect } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/utils/currency'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { PROVINSI } from '@/lib/constants/wilayah'
import { useKomoditasConfig } from '@/hooks/useKomoditasConfig'
import {
  Users, ShieldCheck, BarChart3, Eye, MapPin,
  Phone, Crown, User, Pencil, Loader2,
} from 'lucide-react'

const PROVINSI_OPTIONS = ['Semua Provinsi', ...PROVINSI]
const SERTIFIKASI_OPTIONS = ['Semua Status', 'aktif', 'belum']

export default function AdminPoktanPage() {
  const { namaList: komoditasList } = useKomoditasConfig()
  const komoditasOptions = ['Semua Komoditas', ...komoditasList]
  const [filterProvinsi, setFilterProvinsi] = useState('Semua Provinsi')
  const [filterSertifikasi, setFilterSertifikasi] = useState('Semua Status')
  const [filterKomoditas, setFilterKomoditas] = useState('Semua Komoditas')
  const [allPoktan, setAllPoktan] = useState<any[]>([])
  const [selectedPoktan, setSelectedPoktan] = useState<any | null>(null)

  // Edit state
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    nama_poktan: '', kode_poktan: '', desa: '', kecamatan: '', kabupaten: '', provinsi: '',
    komoditas_utama: '' as string, jumlah_anggota: '',
    status_sertifikasi: 'belum', is_qa_certified: false,
    latitude: '', longitude: '',
  })
  const [saving, setSaving] = useState(false)

  function openEdit(p: any) {
    setEditTarget(p)
    setEditForm({
      nama_poktan: p.nama_poktan || '',
      kode_poktan: p.kode_poktan || '',
      desa: p.desa || '',
      kecamatan: p.kecamatan || '',
      kabupaten: p.kabupaten || '',
      provinsi: p.provinsi || '',
      komoditas_utama: (p.komoditas_utama || []).join(', '),
      jumlah_anggota: String(p.jumlah_anggota || 0),
      status_sertifikasi: p.status_sertifikasi || 'belum',
      is_qa_certified: p.is_qa_certified || false,
      latitude: p.latitude ? String(p.latitude) : '',
      longitude: p.longitude ? String(p.longitude) : '',
    })
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    setSaving(true)
    try {
      const komoditasArr = editForm.komoditas_utama
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const res = await fetch('/api/admin/poktan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTarget.id,
          nama_poktan: editForm.nama_poktan,
          kode_poktan: editForm.kode_poktan,
          desa: editForm.desa,
          kecamatan: editForm.kecamatan,
          kabupaten: editForm.kabupaten,
          provinsi: editForm.provinsi,
          komoditas_utama: komoditasArr,
          jumlah_anggota: parseInt(editForm.jumlah_anggota) || 0,
          status_sertifikasi: editForm.status_sertifikasi,
          is_qa_certified: editForm.is_qa_certified,
          latitude: editForm.latitude ? parseFloat(editForm.latitude) : null,
          longitude: editForm.longitude ? parseFloat(editForm.longitude) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan')

      // Update local state, preserve joined relations
      setAllPoktan((prev) =>
        prev.map((p) => p.id === editTarget.id
          ? { ...p, ...data.poktan, ketua: p.ketua, anggota: p.anggota }
          : p
        )
      )
      // Also update selectedPoktan if it's the same
      if (selectedPoktan?.id === editTarget.id) {
        setSelectedPoktan((prev: any) => prev ? { ...prev, ...data.poktan } : prev)
      }
      toast.success('Data poktan berhasil disimpan')
      setEditOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetch('/api/admin/poktan')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAllPoktan(data.poktan || [])
      })
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    return allPoktan.filter((p: any) => {
      if (filterProvinsi !== 'Semua Provinsi' && p.provinsi !== filterProvinsi) return false
      if (filterSertifikasi !== 'Semua Status' && p.status_sertifikasi !== filterSertifikasi) return false
      if (filterKomoditas !== 'Semua Komoditas' && !p.komoditas_utama.includes(filterKomoditas)) return false
      return true
    })
  }, [allPoktan, filterProvinsi, filterSertifikasi, filterKomoditas])

  const totalPoktan = allPoktan.length
  const certified = allPoktan.filter((p: any) => p.is_qa_certified).length
  const avgQA = totalPoktan > 0 ? allPoktan.reduce((sum: number, p: any) => sum + p.skor_qa, 0) / totalPoktan : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Manajemen Poktan" />

      <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Total Poktan"
            value={formatNumber(totalPoktan)}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Tersertifikasi"
            value={formatNumber(certified)}
            icon={<ShieldCheck className="h-5 w-5" />}
            subtitle={`${Math.round((certified / totalPoktan) * 100)}%`}
          />
          <StatCard
            title="Rata-rata QA"
            value={avgQA.toFixed(1)}
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterProvinsi} onValueChange={(v: string | null) => setFilterProvinsi(v ?? "")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVINSI_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSertifikasi} onValueChange={(v: string | null) => setFilterSertifikasi(v ?? "")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERTIFIKASI_OPTIONS.map((o) => {
                const label = o === 'Semua Status' ? o : o === 'aktif' ? 'Tersertifikasi' : 'Belum'
                return (
                  <SelectItem key={o} value={o} label={label}>
                    {label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <Select value={filterKomoditas} onValueChange={(v: string | null) => setFilterKomoditas(v ?? "")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {komoditasOptions.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Poktan</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="text-center">Transaksi</TableHead>
                  <TableHead className="text-center">Skor QA</TableHead>
                  <TableHead className="text-center">Sertifikasi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{p.nama_poktan}</p>
                        <p className="text-xs text-muted-foreground">{p.kode_poktan}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.komoditas_utama.slice(0, 3).map((k: string) => (
                            <Badge key={k} variant="outline" className="text-[10px] px-1.5 py-0">
                              {k}
                            </Badge>
                          ))}
                          {p.komoditas_utama.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              +{p.komoditas_utama.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {p.kabupaten}, {p.provinsi}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{p.total_transaksi}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${p.skor_qa >= 80 ? 'text-tani-green' : p.skor_qa >= 70 ? 'text-tani-amber' : 'text-tani-red'}`}>
                        {p.skor_qa}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {p.is_qa_certified ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Certified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Belum
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedPoktan(p)}>
                        <Eye className="h-4 w-4 mr-1" /> Detail
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {filtered.map((p) => (
            <Card key={p.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                      {p.nama_poktan}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {p.kabupaten}, {p.provinsi}
                    </p>
                  </div>
                  {p.is_qa_certified ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs shrink-0">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Certified
                    </Badge>
                  ) : (
                    <StatusBadge status="belum" />
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {p.komoditas_utama.map((k: string) => (
                    <Badge key={k} variant="outline" className="text-[10px] px-1.5 py-0">
                      {k}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-muted-foreground">Transaksi</p>
                    <p className="font-bold">{p.total_transaksi}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-muted-foreground">Skor QA</p>
                    <p className={`font-bold ${p.skor_qa >= 80 ? 'text-tani-green' : p.skor_qa >= 70 ? 'text-tani-amber' : 'text-tani-red'}`}>
                      {p.skor_qa}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-muted-foreground">Anggota</p>
                    <p className="font-bold">{p.jumlah_anggota}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setSelectedPoktan(p)}>
                    <Eye className="h-3 w-3 mr-1" /> Detail
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tidak ada poktan ditemukan</p>
          </div>
        )}
      </div>

      {/* Detail Poktan Dialog */}
      <Dialog open={!!selectedPoktan} onOpenChange={() => setSelectedPoktan(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-heading)]">
              {selectedPoktan?.nama_poktan}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              {selectedPoktan?.kabupaten}, {selectedPoktan?.provinsi}
            </DialogDescription>
          </DialogHeader>

          {selectedPoktan && (
            <div className="space-y-5">
              {/* Info ringkas */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-muted-foreground">Transaksi</p>
                  <p className="font-bold text-sm">{selectedPoktan.total_transaksi}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-muted-foreground">Skor QA</p>
                  <p className={`font-bold text-sm ${selectedPoktan.skor_qa >= 80 ? 'text-tani-green' : selectedPoktan.skor_qa >= 70 ? 'text-tani-amber' : 'text-tani-red'}`}>
                    {selectedPoktan.skor_qa}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-muted-foreground">Anggota</p>
                  <p className="font-bold text-sm">{selectedPoktan.jumlah_anggota}</p>
                </div>
              </div>

              {/* Komoditas */}
              {selectedPoktan.komoditas_utama?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Komoditas Utama</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPoktan.komoditas_utama.map((k: string) => (
                      <Badge key={k} variant="outline" className="text-xs">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Ketua Poktan */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Ketua Poktan</p>
                {selectedPoktan.ketua ? (
                  <Card className="shadow-sm">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-tani-green/10 text-tani-green shrink-0">
                        <Crown className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{selectedPoktan.ketua.nama_lengkap}</p>
                        {selectedPoktan.ketua.no_hp && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedPoktan.ketua.no_hp}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-xs text-muted-foreground">Data ketua tidak tersedia</p>
                )}
              </div>

              {/* Daftar Anggota */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Anggota ({selectedPoktan.anggota?.length || 0})
                </p>
                {selectedPoktan.anggota?.length > 0 ? (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {selectedPoktan.anggota.map((a: any) => (
                      <Card key={a.id} className="shadow-sm">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 shrink-0">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {a.petani?.nama_lengkap || 'Petani'}
                              </p>
                              {a.petani?.no_hp && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {a.petani.no_hp}
                                </p>
                              )}
                            </div>
                          </div>
                          <StatusBadge status={a.status || 'aktif'} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Belum ada anggota terdaftar</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Poktan Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-heading)]">
              Edit Poktan
            </DialogTitle>
            <DialogDescription>
              {editTarget?.nama_poktan} &middot; {editTarget?.kode_poktan}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nama Poktan</Label>
                <Input
                  value={editForm.nama_poktan}
                  onChange={(e) => setEditForm({ ...editForm, nama_poktan: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Kode Poktan</Label>
                <Input
                  value={editForm.kode_poktan}
                  onChange={(e) => setEditForm({ ...editForm, kode_poktan: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Desa</Label>
                <Input
                  value={editForm.desa}
                  onChange={(e) => setEditForm({ ...editForm, desa: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Kecamatan</Label>
                <Input
                  value={editForm.kecamatan}
                  onChange={(e) => setEditForm({ ...editForm, kecamatan: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Kabupaten</Label>
                <Input
                  value={editForm.kabupaten}
                  onChange={(e) => setEditForm({ ...editForm, kabupaten: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Provinsi</Label>
                <Select
                  value={editForm.provinsi}
                  onValueChange={(v: string | null) => setEditForm({ ...editForm, provinsi: v ?? '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINSI.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Komoditas Utama (pisahkan dengan koma)</Label>
              <Input
                value={editForm.komoditas_utama}
                onChange={(e) => setEditForm({ ...editForm, komoditas_utama: e.target.value })}
                placeholder="Padi, Jagung, Kedelai"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Jumlah Anggota</Label>
                <Input
                  type="number"
                  value={editForm.jumlah_anggota}
                  onChange={(e) => setEditForm({ ...editForm, jumlah_anggota: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status Sertifikasi</Label>
                <Select
                  value={editForm.status_sertifikasi}
                  onValueChange={(v: string | null) => setEditForm({ ...editForm, status_sertifikasi: v ?? 'belum' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Tersertifikasi</SelectItem>
                    <SelectItem value="belum">Belum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="qa-certified"
                checked={editForm.is_qa_certified}
                onChange={(e) => setEditForm({ ...editForm, is_qa_certified: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="qa-certified" className="text-xs cursor-pointer">
                QA Certified
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                  placeholder="-6.123456"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                  placeholder="106.123456"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
