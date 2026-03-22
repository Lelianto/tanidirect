'use client'

import { useState, useMemo, useEffect } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatRupiah, formatKg, formatNumber } from '@/lib/utils/currency'
import { formatTanggalSingkat } from '@/lib/utils/date'
import {
  ArrowLeftRight, Scale, Coins, Package,
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'Semua Status', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'menunggu_konfirmasi', label: 'Menunggu Konfirmasi' },
  { value: 'dikonfirmasi', label: 'Dikonfirmasi' },
  { value: 'dalam_pengiriman', label: 'Dalam Pengiriman' },
  { value: 'tiba_di_gudang', label: 'Tiba di Gudang' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
  { value: 'sengketa', label: 'Sengketa' },
]
const KOMODITAS_OPTIONS = ['Semua Komoditas', 'Tomat', 'Cabai Merah', 'Kubis', 'Wortel', 'Kentang']

export default function AdminTransaksiPage() {
  const [filterStatus, setFilterStatus] = useState('Semua Status')
  const [filterKomoditas, setFilterKomoditas] = useState('Semua Komoditas')
  const [allTransaksi, setAllTransaksi] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/transaksi')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAllTransaksi(data.transaksi || [])
      })
      .catch(() => {})
  }, [])

  const transaksi = useMemo(() => {
    return allTransaksi.filter((t: any) => {
      if (filterStatus !== 'Semua Status' && t.status !== filterStatus) return false
      if (filterKomoditas !== 'Semua Komoditas' && t.komoditas !== filterKomoditas) return false
      return true
    })
  }, [allTransaksi, filterStatus, filterKomoditas])

  const totalTransaksi = allTransaksi.length
  const totalVolume = allTransaksi.reduce((sum: number, t: any) => sum + (t.volume_aktual_kg || t.volume_estimasi_kg), 0)
  const totalKomisi = allTransaksi.reduce((sum: number, t: any) => sum + (t.komisi_platform || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Semua Transaksi" />

      <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Total Transaksi"
            value={formatNumber(totalTransaksi)}
            icon={<ArrowLeftRight className="h-5 w-5" />}
          />
          <StatCard
            title="Total Volume"
            value={formatKg(totalVolume)}
            icon={<Scale className="h-5 w-5" />}
          />
          <StatCard
            title="Total Komisi"
            value={formatRupiah(totalKomisi)}
            icon={<Coins className="h-5 w-5" />}
            trend="up"
            trendValue="+8%"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterStatus} onValueChange={(v: string | null) => setFilterStatus(v ?? "")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} label={o.label}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterKomoditas} onValueChange={(v: string | null) => setFilterKomoditas(v ?? "")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KOMODITAS_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground self-center">
            {transaksi.length} transaksi
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Komoditas</TableHead>
                  <TableHead>Poktan</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Nilai</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaksi.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id.toUpperCase()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{t.komoditas}</span>
                        <StatusBadge status={t.grade} />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{t.poktan?.nama_poktan || '-'}</TableCell>
                    <TableCell className="text-sm">{t.supplier?.nama_perusahaan || '-'}</TableCell>
                    <TableCell className="text-right text-sm">
                      {formatKg(t.volume_aktual_kg || t.volume_estimasi_kg)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {t.total_nilai ? formatRupiah(t.total_nilai) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTanggalSingkat(t.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {transaksi.map((t) => (
            <Card key={t.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                        {t.komoditas}
                      </span>
                      <StatusBadge status={t.grade} />
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {t.id.toUpperCase()}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                  <div>
                    <span className="text-muted-foreground">Poktan: </span>
                    <span className="font-medium">{t.poktan?.nama_poktan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Supplier: </span>
                    <span className="font-medium">{t.supplier?.nama_perusahaan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume: </span>
                    <span className="font-medium">{formatKg(t.volume_aktual_kg || t.volume_estimasi_kg)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tanggal: </span>
                    <span className="font-medium">{formatTanggalSingkat(t.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Nilai Transaksi</span>
                  <span className="font-bold text-sm text-tani-green">
                    {t.total_nilai ? formatRupiah(t.total_nilai) : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {transaksi.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tidak ada transaksi ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}
