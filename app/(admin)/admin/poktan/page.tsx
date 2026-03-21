'use client'

import { useState, useMemo } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { dummyPoktan } from '@/lib/dummy'
import { formatNumber } from '@/lib/utils/currency'
import {
  Users, ShieldCheck, BarChart3, MoreVertical, Eye, CheckCircle, Ban, MapPin,
} from 'lucide-react'

const PROVINSI_OPTIONS = ['Semua Provinsi', 'Jawa Barat', 'Jawa Timur', 'Jawa Tengah']
const SERTIFIKASI_OPTIONS = ['Semua Status', 'aktif', 'belum']
const KOMODITAS_OPTIONS = ['Semua Komoditas', 'Tomat', 'Cabai Merah', 'Kubis', 'Wortel', 'Kentang', 'Bawang Merah', 'Brokoli']

export default function AdminPoktanPage() {
  const [filterProvinsi, setFilterProvinsi] = useState('Semua Provinsi')
  const [filterSertifikasi, setFilterSertifikasi] = useState('Semua Status')
  const [filterKomoditas, setFilterKomoditas] = useState('Semua Komoditas')

  const filtered = useMemo(() => {
    return dummyPoktan.filter((p) => {
      if (filterProvinsi !== 'Semua Provinsi' && p.provinsi !== filterProvinsi) return false
      if (filterSertifikasi !== 'Semua Status' && p.status_sertifikasi !== filterSertifikasi) return false
      if (filterKomoditas !== 'Semua Komoditas' && !p.komoditas_utama.includes(filterKomoditas)) return false
      return true
    })
  }, [filterProvinsi, filterSertifikasi, filterKomoditas])

  const totalPoktan = dummyPoktan.length
  const certified = dummyPoktan.filter((p) => p.is_qa_certified).length
  const avgQA = dummyPoktan.reduce((sum, p) => sum + p.skor_qa, 0) / totalPoktan

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
              {SERTIFIKASI_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o === 'Semua Status' ? o : o === 'aktif' ? 'Tersertifikasi' : 'Belum'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterKomoditas} onValueChange={(v: string | null) => setFilterKomoditas(v ?? "")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KOMODITAS_OPTIONS.map((o) => (
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
                          {p.komoditas_utama.slice(0, 3).map((k) => (
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
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                            <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" /> Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle className="h-4 w-4 mr-2" /> Verifikasi
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-tani-red">
                            <Ban className="h-4 w-4 mr-2" /> Suspend
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                  {p.komoditas_utama.map((k) => (
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
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <Eye className="h-3 w-3 mr-1" /> Detail
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" /> Verifikasi
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs text-tani-red border-tani-red/30">
                    <Ban className="h-3 w-3" />
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
    </div>
  )
}
