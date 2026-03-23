'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { CairkanDialog } from '@/components/petani/CairkanDialog'
import { useAuthStore } from '@/store'
import { formatRupiah, formatKg } from '@/lib/utils/currency'
import { formatTanggalSingkat } from '@/lib/utils/date'
import { Wallet, Package, ArrowDownToLine, BarChart3, History } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const MONTHS = [
  { value: 'all', label: 'Semua Bulan' },
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
]

const monthlyEarnings = [
  { bulan: 'Okt', pendapatan: 12500000 },
  { bulan: 'Nov', pendapatan: 18200000 },
  { bulan: 'Des', pendapatan: 15800000 },
  { bulan: 'Jan', pendapatan: 27930000 },
  { bulan: 'Feb', pendapatan: 21560000 },
  { bulan: 'Mar', pendapatan: 35280000 },
]

export default function PetaniRiwayatPage() {
  const user = useAuthStore((s) => s.user)
  const [filterMonth, setFilterMonth] = useState('all')
  const [cairkanOpen, setCairkanOpen] = useState(false)
  const [kontribusi, setKontribusi] = useState<any[]>([])
  const [pencairan, setPencairan] = useState<any[]>([])

  const fetchRiwayat = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/petani/riwayat?user_id=${user.id}`)
      const data = await res.json()
      if (data.success) {
        setKontribusi(data.kontribusi || [])
        setPencairan(data.pencairan || [])
      }
    } catch (err) {
      console.error('Failed to fetch riwayat:', err)
    }
  }, [user])

  useEffect(() => {
    fetchRiwayat()
  }, [fetchRiwayat])

  const filtered = useMemo(() => {
    if (filterMonth === 'all') return kontribusi
    return kontribusi.filter((k) => {
      const txDate = k.transaksi?.created_at
      if (!txDate) return false
      const month = new Date(txDate).getMonth() + 1
      return month === parseInt(filterMonth)
    })
  }, [kontribusi, filterMonth])

  const totalPendapatan = kontribusi.reduce((sum, k) => sum + (k.harga_diterima || 0), 0)
  const totalKontribusi = kontribusi.length
  const pendingBalance = kontribusi
    .filter((k) => k.status_bayar === 'pending')
    .reduce((sum, k) => sum + (k.harga_diterima || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Riwayat Transaksi" />

      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Total Pendapatan"
            value={formatRupiah(totalPendapatan)}
            icon={<Wallet className="h-5 w-5" />}
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Total Kontribusi"
            value={`${totalKontribusi} kali`}
            icon={<Package className="h-5 w-5" />}
            subtitle="dari semua transaksi"
          />
        </div>

        {/* Monthly Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium font-[family-name:var(--font-heading)] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-tani-green" />
              Pendapatan Bulanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}jt`}
                  />
                  <Tooltip
                    formatter={(value) => [formatRupiah(Number(value || 0)), 'Pendapatan']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="pendapatan" fill="#16A34A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Riwayat Pencairan */}
        {pencairan.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium font-[family-name:var(--font-heading)] flex items-center gap-2">
                <History className="h-4 w-4 text-tani-blue" />
                Riwayat Pencairan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {pencairan.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {p.rekening.provider} — {p.rekening.nomor}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        a.n. {p.rekening.atas_nama} — {formatTanggalSingkat(p.created_at)}
                      </p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-sm font-bold text-tani-green">{formatRupiah(p.jumlah_diterima)}</p>
                      <StatusBadge status={p.status === 'berhasil' ? 'selesai' : p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Select value={filterMonth} onValueChange={(v: string | null) => setFilterMonth(v ?? '')}>
            <SelectTrigger className="w-[180px]">
              <span>{MONTHS.find((m) => m.value === filterMonth)?.label ?? 'Filter bulan'}</span>
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filtered.length} transaksi
          </span>
        </div>

        {/* Kontribusi List */}
        <div className="space-y-3">
          {filtered.map((k) => {
            const tx = k.transaksi
            return (
              <Card key={k.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                          {tx?.komoditas || '-'}
                        </span>
                        <StatusBadge status={tx?.grade || 'B'} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Volume kontribusi: {formatKg(k.volume_kg)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx?.created_at ? formatTanggalSingkat(tx.created_at) : '-'}
                      </p>
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                      <p className="font-bold text-sm text-tani-green">
                        {k.harga_diterima ? formatRupiah(k.harga_diterima) : '-'}
                      </p>
                      <StatusBadge status={k.status_bayar} />
                    </div>
                  </div>
                  {tx?.total_nilai && k.harga_diterima && (
                    <div className="mt-2 pt-2 border-t border-border/50 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                      <div>
                        <span>Nilai transaksi</span>
                        <p className="font-medium text-foreground">{formatRupiah(tx.total_nilai)}</p>
                      </div>
                      <div>
                        <span>Harga/kg</span>
                        <p className="font-medium text-foreground">{formatRupiah(tx.harga_per_kg)}</p>
                      </div>
                      <div>
                        <span>Bagian Anda</span>
                        <p className="font-medium text-tani-green">{formatRupiah(k.harga_diterima)}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada riwayat transaksi</p>
            </div>
          )}
        </div>

        {/* Cairkan Button */}
        {pendingBalance > 0 && (
          <div className="sticky bottom-20 lg:bottom-4">
            <Button
              className="w-full bg-tani-green hover:bg-tani-green/90 text-white h-12 text-base font-semibold shadow-lg"
              onClick={() => setCairkanOpen(true)}
            >
              <ArrowDownToLine className="h-5 w-5 mr-2" />
              Cairkan {formatRupiah(pendingBalance)}
            </Button>
          </div>
        )}
      </div>

      <CairkanDialog
        open={cairkanOpen}
        onOpenChange={setCairkanOpen}
        saldoPending={pendingBalance}
        savedRekening={user?.rekening}
      />
    </div>
  )
}
