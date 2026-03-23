'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Users, User, Phone, MapPin, ShieldCheck, Eye, Search,
  FileCheck, Crown, Wheat, Loader2, UserX, UserCheck,
  Calendar, CreditCard, Landmark,
} from 'lucide-react'
import type { KYCStatus } from '@/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

const KYC_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  docs_incomplete: { label: 'Dokumen Belum Lengkap', color: 'bg-amber-100 text-amber-700' },
  docs_submitted: { label: 'Dokumen Terkirim', color: 'bg-blue-100 text-blue-700' },
  docs_revision: { label: 'Perlu Revisi', color: 'bg-orange-100 text-orange-700' },
  layer1_passed: { label: 'Layer 1 Lulus', color: 'bg-emerald-100 text-emerald-700' },
  layer1_failed: { label: 'Layer 1 Gagal', color: 'bg-red-100 text-red-700' },
  fully_verified: { label: 'Terverifikasi', color: 'bg-green-100 text-green-800' },
  suspended: { label: 'Ditangguhkan', color: 'bg-red-100 text-red-800' },
}

interface EnrichedUser {
  id: string
  role: string
  nama_lengkap: string
  no_hp: string
  no_ktp?: string
  foto_url?: string
  provinsi: string
  kabupaten: string
  kecamatan?: string
  alamat?: string
  is_verified: boolean
  is_active: boolean
  kyc_status: KYCStatus
  kyc_submitted_at?: string
  kyc_reviewed_at?: string
  kyc_reviewer_notes?: string
  created_at: string
  kyc_submissions: Array<{
    id: string
    layer: number
    status: string
    trust_level: string
    reviewer_catatan?: string
    submitted_at?: string
    reviewed_at?: string
    documents?: Array<{
      id: string
      nama: string
      file_path?: string
      status: string
      catatan?: string
    }>
  }>
  kyc_documents: Array<{
    id: string
    doc_type: string
    file_path: string
    status: string
    reviewer_notes?: string
  }>
  poktan_membership: Array<{
    id: string
    poktan_id: string
    lahan_ha?: number
    komoditas?: string[]
    status: string
    tanggal_bergabung?: string
    poktan?: {
      id: string
      nama_poktan: string
      kode_poktan: string
      kabupaten: string
      provinsi: string
    }
  }>
  poktan_ketua?: {
    id: string
    nama_poktan: string
    kode_poktan: string
    desa?: string
    kecamatan?: string
    kabupaten: string
    provinsi: string
    komoditas_utama?: string[]
    jumlah_anggota: number
    skor_qa: number
    skor_ketepatan: number
    total_transaksi: number
    is_qa_certified: boolean
  } | null
}

export default function AdminAkunPage() {
  const [activeTab, setActiveTab] = useState<'petani' | 'ketua_poktan'>('petani')
  const [allUsers, setAllUsers] = useState<EnrichedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterKYC, setFilterKYC] = useState('all')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/akun')
      const data = await res.json()
      if (data.success) setAllUsers(data.users || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filtered = useMemo(() => {
    return allUsers.filter((u) => {
      if (u.role !== activeTab) return false
      if (filterKYC !== 'all' && u.kyc_status !== filterKYC) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match =
          u.nama_lengkap.toLowerCase().includes(q) ||
          u.no_hp.includes(q) ||
          (u.no_ktp && u.no_ktp.includes(q)) ||
          u.kabupaten.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [allUsers, activeTab, filterKYC, searchQuery])

  const stats = useMemo(() => {
    const roleUsers = allUsers.filter((u) => u.role === activeTab)
    return {
      total: roleUsers.length,
      verified: roleUsers.filter((u) => u.kyc_status === 'fully_verified').length,
      active: roleUsers.filter((u) => u.is_active).length,
      pending: roleUsers.filter((u) => ['pending', 'docs_submitted', 'docs_revision'].includes(u.kyc_status)).length,
    }
  }, [allUsers, activeTab])

  async function handleAction(userId: string, action: string) {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/akun', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchUsers()
        setSelectedUser(null)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Gagal melakukan aksi')
    } finally {
      setActionLoading(false)
    }
  }

  function formatDate(d?: string) {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Akun Pengguna" />

      <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'petani' | 'ketua_poktan')}>
          <TabsList>
            <TabsTrigger value="petani" className="gap-1.5">
              <User className="h-3.5 w-3.5" />
              Petani
            </TabsTrigger>
            <TabsTrigger value="ketua_poktan" className="gap-1.5">
              <Crown className="h-3.5 w-3.5" />
              Ketua Poktan
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-heading)]">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total {activeTab === 'petani' ? 'Petani' : 'Ketua Poktan'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-heading)] text-tani-green">{stats.verified}</p>
              <p className="text-xs text-muted-foreground">KYC Terverifikasi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-heading)] text-tani-blue">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Aktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-heading)] text-tani-amber">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">KYC Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, HP, KTP, kabupaten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterKYC} onValueChange={(v) => setFilterKYC(v ?? 'all')}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status KYC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua KYC</SelectItem>
              <SelectItem value="fully_verified">Terverifikasi</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="docs_submitted">Dokumen Terkirim</SelectItem>
              <SelectItem value="docs_revision">Perlu Revisi</SelectItem>
              <SelectItem value="suspended">Ditangguhkan</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} pengguna
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tidak ada pengguna ditemukan</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>No HP</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>{activeTab === 'petani' ? 'Poktan' : 'Poktan (Ketua)'}</TableHead>
                      <TableHead className="text-center">KYC</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Terdaftar</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => {
                      const kycConf = KYC_STATUS_CONFIG[u.kyc_status] || KYC_STATUS_CONFIG.pending
                      const poktanInfo = activeTab === 'petani'
                        ? u.poktan_membership?.[0]?.poktan?.nama_poktan
                        : u.poktan_ketua?.nama_poktan

                      return (
                        <TableRow key={u.id} className={!u.is_active ? 'opacity-50' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-tani-green/10 flex items-center justify-center shrink-0">
                                {activeTab === 'ketua_poktan'
                                  ? <Crown className="h-4 w-4 text-tani-amber" />
                                  : <User className="h-4 w-4 text-tani-green" />}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{u.nama_lengkap}</p>
                                {u.no_ktp && <p className="text-[10px] text-muted-foreground">KTP: {u.no_ktp}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{u.no_hp}</TableCell>
                          <TableCell>
                            <p className="text-sm">{u.kabupaten}</p>
                            <p className="text-[10px] text-muted-foreground">{u.provinsi}</p>
                          </TableCell>
                          <TableCell className="text-sm">{poktanInfo || '-'}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${kycConf.color} text-[10px] px-1.5 py-0`}>
                              {kycConf.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {u.is_active ? (
                              <Badge className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0">Aktif</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0">Nonaktif</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {formatDate(u.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedUser(u)}>
                              <Eye className="h-4 w-4 mr-1" /> Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {filtered.map((u) => {
                const kycConf = KYC_STATUS_CONFIG[u.kyc_status] || KYC_STATUS_CONFIG.pending
                const poktanInfo = activeTab === 'petani'
                  ? u.poktan_membership?.[0]?.poktan?.nama_poktan
                  : u.poktan_ketua?.nama_poktan

                return (
                  <Card key={u.id} className={`shadow-sm ${!u.is_active ? 'opacity-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-tani-green/10 flex items-center justify-center shrink-0">
                            {activeTab === 'ketua_poktan'
                              ? <Crown className="h-4 w-4 text-tani-amber" />
                              : <User className="h-4 w-4 text-tani-green" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{u.nama_lengkap}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {u.no_hp}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${kycConf.color} text-[10px] px-1.5 py-0 shrink-0`}>
                          {kycConf.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {u.kabupaten}, {u.provinsi}
                        </span>
                        {poktanInfo && (
                          <span className="flex items-center gap-1">
                            <Wheat className="h-3 w-3" /> {poktanInfo}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {u.is_active ? (
                            <Badge className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0">Aktif</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0">Nonaktif</Badge>
                          )}
                          {u.is_verified && (
                            <Badge className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0">
                              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> Verified
                            </Badge>
                          )}
                        </div>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedUser(u)}>
                          <Eye className="h-3 w-3 mr-1" /> Detail
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-heading)] flex items-center gap-2">
              {selectedUser?.role === 'ketua_poktan'
                ? <Crown className="h-5 w-5 text-tani-amber" />
                : <User className="h-5 w-5 text-tani-green" />}
              {selectedUser?.nama_lengkap}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedUser?.role === 'ketua_poktan' ? 'Ketua Poktan' : 'Petani'} &middot; ID: {selectedUser?.id?.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-5">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-1.5">
                <Badge className={`${(KYC_STATUS_CONFIG[selectedUser.kyc_status] || KYC_STATUS_CONFIG.pending).color} text-xs`}>
                  <FileCheck className="h-3 w-3 mr-1" />
                  KYC: {(KYC_STATUS_CONFIG[selectedUser.kyc_status] || KYC_STATUS_CONFIG.pending).label}
                </Badge>
                {selectedUser.is_active ? (
                  <Badge className="bg-green-100 text-green-800 text-xs">Aktif</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 text-xs">Nonaktif</Badge>
                )}
                {selectedUser.is_verified && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                )}
              </div>

              {/* Profil */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Data Pribadi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-y-2.5">
                    <div>
                      <p className="text-xs text-muted-foreground">Nama Lengkap</p>
                      <p className="font-medium">{selectedUser.nama_lengkap}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">No HP</p>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {selectedUser.no_hp}
                      </p>
                    </div>
                    {selectedUser.no_ktp && (
                      <div>
                        <p className="text-xs text-muted-foreground">No KTP</p>
                        <p className="font-medium flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> {selectedUser.no_ktp}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Terdaftar</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(selectedUser.created_at)}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Alamat</p>
                    <p className="font-medium flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>
                        {[selectedUser.alamat, selectedUser.kecamatan, selectedUser.kabupaten, selectedUser.provinsi]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Afiliasi Poktan */}
              {selectedUser.role === 'ketua_poktan' && selectedUser.poktan_ketua && (
                <Card className="shadow-sm border-tani-amber/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Crown className="h-4 w-4 text-tani-amber" />
                      Poktan yang Dipimpin
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-y-2.5">
                      <div>
                        <p className="text-xs text-muted-foreground">Nama Poktan</p>
                        <p className="font-semibold">{selectedUser.poktan_ketua.nama_poktan}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Kode</p>
                        <p className="font-medium">{selectedUser.poktan_ketua.kode_poktan}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lokasi</p>
                        <p className="font-medium">
                          {[selectedUser.poktan_ketua.desa, selectedUser.poktan_ketua.kecamatan, selectedUser.poktan_ketua.kabupaten]
                            .filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Jumlah Anggota</p>
                        <p className="font-medium">{selectedUser.poktan_ketua.jumlah_anggota}</p>
                      </div>
                    </div>
                    {selectedUser.poktan_ketua.komoditas_utama && selectedUser.poktan_ketua.komoditas_utama.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Komoditas Utama</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedUser.poktan_ketua.komoditas_utama.map((k) => (
                            <Badge key={k} variant="outline" className="text-[10px] px-1.5 py-0">
                              <Wheat className="h-2.5 w-2.5 mr-0.5" /> {k}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <Separator />
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-[10px] text-muted-foreground">Skor QA</p>
                        <p className="font-bold text-sm">{selectedUser.poktan_ketua.skor_qa}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-[10px] text-muted-foreground">Ketepatan</p>
                        <p className="font-bold text-sm">{selectedUser.poktan_ketua.skor_ketepatan}%</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-[10px] text-muted-foreground">Transaksi</p>
                        <p className="font-bold text-sm">{selectedUser.poktan_ketua.total_transaksi}</p>
                      </div>
                    </div>
                    {selectedUser.poktan_ketua.is_qa_certified && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <ShieldCheck className="h-3 w-3 mr-1" /> QA Certified
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedUser.role === 'petani' && selectedUser.poktan_membership.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-tani-green" />
                      Afiliasi Poktan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedUser.poktan_membership.map((m) => (
                      <div key={m.id} className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{m.poktan?.nama_poktan || '-'}</p>
                          <Badge className={m.status === 'aktif' ? 'bg-green-100 text-green-800 text-[10px]' : 'bg-gray-100 text-gray-700 text-[10px]'}>
                            {m.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {m.poktan?.kode_poktan} &middot; {m.poktan?.kabupaten}, {m.poktan?.provinsi}
                        </p>
                        <div className="flex gap-3 text-xs">
                          {m.lahan_ha && <span>Lahan: {m.lahan_ha} ha</span>}
                          {m.tanggal_bergabung && <span>Bergabung: {formatDate(m.tanggal_bergabung)}</span>}
                        </div>
                        {m.komoditas && m.komoditas.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {m.komoditas.map((k) => (
                              <Badge key={k} variant="outline" className="text-[10px] px-1.5 py-0">{k}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {selectedUser.role === 'petani' && selectedUser.poktan_membership.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  Petani ini belum tergabung ke poktan manapun.
                </div>
              )}

              {/* KYC Data */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-tani-blue" />
                    Data KYC
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* KYC Documents (KTP, Selfie) */}
                  {selectedUser.kyc_documents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Dokumen KYC</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedUser.kyc_documents.map((doc) => (
                          <div key={doc.id} className="border rounded-lg p-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium uppercase">{doc.doc_type}</span>
                              <Badge className={
                                doc.status === 'verified' ? 'bg-green-100 text-green-800 text-[10px]' :
                                doc.status === 'rejected' ? 'bg-red-100 text-red-800 text-[10px]' :
                                'bg-amber-100 text-amber-800 text-[10px]'
                              }>
                                {doc.status}
                              </Badge>
                            </div>
                            {doc.file_path && (
                              <div className="w-full h-24 rounded overflow-hidden bg-muted">
                                <Image
                                  src={`${SUPABASE_URL}/storage/v1/object/public/kyc-documents/${doc.file_path}`}
                                  alt={doc.doc_type}
                                  width={200}
                                  height={96}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                            {doc.reviewer_notes && (
                              <p className="text-[10px] text-muted-foreground">{doc.reviewer_notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* KYC Submissions (Layers) */}
                  {selectedUser.kyc_submissions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Layer KYC</p>
                      {selectedUser.kyc_submissions.map((sub) => (
                        <div key={sub.id} className="border rounded-lg p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">Layer {sub.layer}</span>
                            <Badge className={
                              sub.status === 'approved' ? 'bg-green-100 text-green-800 text-[10px]' :
                              sub.status === 'rejected' ? 'bg-red-100 text-red-800 text-[10px]' :
                              sub.status === 'pending' ? 'bg-blue-100 text-blue-800 text-[10px]' :
                              sub.status === 'revisi' ? 'bg-orange-100 text-orange-800 text-[10px]' :
                              'bg-gray-100 text-gray-700 text-[10px]'
                            }>
                              {sub.status}
                            </Badge>
                          </div>
                          <div className="flex gap-3 text-[10px] text-muted-foreground">
                            <span>Trust: {sub.trust_level}</span>
                            {sub.submitted_at && <span>Diajukan: {formatDate(sub.submitted_at)}</span>}
                            {sub.reviewed_at && <span>Direview: {formatDate(sub.reviewed_at)}</span>}
                          </div>
                          {sub.reviewer_catatan && (
                            <p className="text-xs bg-muted/50 rounded p-1.5">{sub.reviewer_catatan}</p>
                          )}
                          {sub.documents && sub.documents.length > 0 && (
                            <div className="space-y-1">
                              {sub.documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between text-xs bg-gray-50 rounded p-1.5">
                                  <span>{doc.nama}</span>
                                  <Badge className={
                                    doc.status === 'approved' ? 'bg-green-100 text-green-800 text-[9px]' :
                                    doc.status === 'rejected' ? 'bg-red-100 text-red-800 text-[9px]' :
                                    'bg-gray-100 text-gray-700 text-[9px]'
                                  }>
                                    {doc.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedUser.kyc_documents.length === 0 && selectedUser.kyc_submissions.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Belum ada data KYC
                    </p>
                  )}

                  {selectedUser.kyc_reviewer_notes && (
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-xs text-muted-foreground mb-0.5">Catatan Reviewer</p>
                      <p className="text-sm">{selectedUser.kyc_reviewer_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Actions */}
              <Card className="shadow-sm border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Aksi Admin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-xs ${selectedUser.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                      disabled={actionLoading}
                      onClick={() => handleAction(selectedUser.id, 'toggle_active')}
                    >
                      {actionLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> :
                        selectedUser.is_active ? <UserX className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                      {selectedUser.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-xs ${selectedUser.is_verified ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                      disabled={actionLoading}
                      onClick={() => handleAction(selectedUser.id, 'toggle_verified')}
                    >
                      {actionLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> :
                        <ShieldCheck className="h-3 w-3 mr-1" />}
                      {selectedUser.is_verified ? 'Cabut Verifikasi' : 'Verifikasi Manual'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
