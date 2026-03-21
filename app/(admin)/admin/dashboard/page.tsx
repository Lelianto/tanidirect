'use client'

import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  dummyPoktan, dummySuppliers, dummyTransaksi, dummyAnomali,
  dummyKredit,
} from '@/lib/dummy'
import { formatRupiah } from '@/lib/utils/currency'
import { timeAgo } from '@/lib/utils/date'
import {
  Users, Building2, TrendingUp, Wallet,
  AlertTriangle, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

export default function AdminDashboard() {
  const poktanAktif = dummyPoktan.filter((p) => p.status_sertifikasi === 'aktif')
  const supplierVerified = dummySuppliers.filter((s) => s.is_verified)
  const transaksiSelesai = dummyTransaksi.filter((t) => t.status === 'selesai')
  const totalKomisi = transaksiSelesai.reduce((sum, t) => sum + (t.komisi_platform || 0), 0)
  const totalVolume = transaksiSelesai.reduce((sum, t) => sum + (t.volume_aktual_kg || t.volume_estimasi_kg), 0)

  const anomaliOpen = dummyAnomali.filter((a) => a.status_tindak_lanjut === 'open')
  const kreditPending = dummyKredit.filter((k) => k.status === 'pending')

  const chartData = useMemo(() => {
    const months = ['Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar']
    return months.map((m) => ({
      bulan: m,
      volume: Math.round(5000 + Math.random() * 15000),
      pendapatan: Math.round(500000 + Math.random() * 3000000),
    }))
  }, [])

  return (
    <>
      <TopBar title="Admin Dashboard" />
      <div className="p-4 lg:p-6 space-y-6 max-w-6xl">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Poktan Aktif"
            value={String(poktanAktif.length)}
            subtitle={`dari ${dummyPoktan.length} total`}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Supplier"
            value={String(supplierVerified.length)}
            subtitle="terverifikasi"
            icon={<Building2 className="h-5 w-5" />}
          />
          <StatCard
            title="Volume Bulan Ini"
            value={`${(totalVolume / 1000).toFixed(1)} ton`}
            icon={<TrendingUp className="h-5 w-5" />}
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Pendapatan Komisi"
            value={formatRupiah(totalKomisi)}
            icon={<Wallet className="h-5 w-5" />}
            trend="up"
            trendValue="+18%"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Trend Volume & Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="volume" fill="#16A34A" name="Volume (kg)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pendapatan" fill="#0EA5E9" name="Komisi (Rp)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <div className="space-y-4">
            {/* Anomali */}
            <Card className="shadow-sm border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Anomali Belum Ditangani ({anomaliOpen.length})
                  </CardTitle>
                  <Link href="/admin/compliance" className="text-xs text-tani-green font-medium flex items-center">
                    Lihat <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {anomaliOpen.map((a) => {
                  const poktan = dummyPoktan.find((p) => p.id === a.poktan_id)
                  return (
                    <div key={a.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium">{poktan?.nama_poktan}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {(a.temuan as { deskripsi?: string })?.deskripsi}
                        </p>
                      </div>
                      <StatusBadge status={a.tingkat_risiko} />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Kredit Pending */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Kredit Menunggu Review ({kreditPending.length})
                  </CardTitle>
                  <Link href="/admin/kredit" className="text-xs text-tani-green font-medium flex items-center">
                    Review <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {kreditPending.map((k) => {
                  const petani = dummyUsers_find(k.petani_id)
                  return (
                    <div key={k.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{petani?.nama_lengkap || 'Petani'}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRupiah(k.jumlah_diajukan)} — Skor AI: {k.ai_skor}
                        </p>
                      </div>
                      <StatusBadge status={k.status} />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

// helper
import { dummyUsers } from '@/lib/dummy'
function dummyUsers_find(id: string) {
  return dummyUsers.find((u) => u.id === id)
}
