'use client'

import { useState, useMemo } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuthStore } from '@/store'
import {
  getSupplierByUserId, dummyTransaksi, dummyPoktan,
} from '@/lib/dummy'
import { formatRupiah, formatKg, formatNumber } from '@/lib/utils/currency'
import { formatTanggalSingkat } from '@/lib/utils/date'
import { KOMODITAS, GRADE_COLORS } from '@/lib/constants/komoditas'
import {
  FileText, TrendingUp, Package, Filter,
} from 'lucide-react'
import type { Transaksi, StatusTransaksi } from '@/types'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua Status' },
  { value: 'dikonfirmasi', label: 'Dikonfirmasi' },
  { value: 'dalam_pengiriman', label: 'Dalam Pengiriman' },
  { value: 'tiba_di_gudang', label: 'Tiba di Gudang' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
  { value: 'sengketa', label: 'Sengketa' },
]

export default function SupplierTransaksiPage() {
  const user = useAuthStore((s) => s.user)
  const supplier = user ? getSupplierByUserId(user.id) : null
  const allTransaksi = dummyTransaksi.filter((t) => t.supplier_id === supplier?.id)

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterKomoditas, setFilterKomoditas] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const filtered = useMemo(() => {
    return allTransaksi.filter((t) => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (filterKomoditas !== 'all' && t.komoditas !== filterKomoditas) return false
      if (filterDateFrom && new Date(t.created_at) < new Date(filterDateFrom)) return false
      if (filterDateTo && new Date(t.created_at) > new Date(filterDateTo + 'T23:59:59')) return false
      return true
    })
  }, [allTransaksi, filterStatus, filterKomoditas, filterDateFrom, filterDateTo])

  const totalNilai = filtered.reduce((sum, t) => sum + (t.total_nilai || 0), 0)
  const totalVolume = filtered.reduce((sum, t) => sum + (t.volume_aktual_kg || t.volume_estimasi_kg), 0)

  function getPoktanName(poktanId: string) {
    return dummyPoktan.find((p) => p.id === poktanId)?.nama_poktan || '-'
  }

  return (
    <>
      <TopBar title="Transaksi" />
      <div className="p-4 lg:p-6 space-y-4 max-w-6xl">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Total Transaksi"
            value={String(filtered.length)}
            icon={<FileText className="h-5 w-5" />}
          />
          <StatCard
            title="Total Volume"
            value={formatKg(totalVolume)}
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            title="Total Nilai"
            value={formatRupiah(totalNilai)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Filter</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Select value={filterStatus} onValueChange={(v: string | null) => setFilterStatus(v ?? "")}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} label={opt.label} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterKomoditas} onValueChange={(v: string | null) => setFilterKomoditas(v ?? "")}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Komoditas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Semua Komoditas</SelectItem>
                  {KOMODITAS.map((k) => (
                    <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                className="h-9 text-xs"
                placeholder="Dari"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
              <Input
                type="date"
                className="h-9 text-xs"
                placeholder="Sampai"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Desktop: Table */}
        <div className="hidden lg:block">
          <Card className="shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Komoditas</TableHead>
                  <TableHead className="text-xs">Grade</TableHead>
                  <TableHead className="text-xs">Poktan</TableHead>
                  <TableHead className="text-xs text-right">Volume</TableHead>
                  <TableHead className="text-xs text-right">Total Nilai</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                      Tidak ada transaksi ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium text-sm">{t.komoditas}</TableCell>
                      <TableCell>
                        <Badge className={`${GRADE_COLORS[t.grade] || ''} text-[10px] px-1.5 py-0`}>
                          {t.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{getPoktanName(t.poktan_id)}</TableCell>
                      <TableCell className="text-sm text-right">
                        {formatKg(t.volume_aktual_kg || t.volume_estimasi_kg)}
                      </TableCell>
                      <TableCell className="text-sm text-right font-medium">
                        {t.total_nilai ? formatRupiah(t.total_nilai) : '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTanggalSingkat(t.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Mobile: Cards */}
        <div className="lg:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">Tidak ada transaksi</p>
              <p className="text-xs">Ubah filter untuk melihat transaksi lain</p>
            </div>
          ) : (
            filtered.map((t) => (
              <Card key={t.id} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{t.komoditas}</h3>
                      <Badge className={`${GRADE_COLORS[t.grade] || ''} text-[10px] px-1.5 py-0`}>
                        {t.grade}
                      </Badge>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {getPoktanName(t.poktan_id)}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatKg(t.volume_aktual_kg || t.volume_estimasi_kg)}
                    </span>
                    <span className="font-semibold">
                      {t.total_nilai ? formatRupiah(t.total_nilai) : '-'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {formatTanggalSingkat(t.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  )
}
