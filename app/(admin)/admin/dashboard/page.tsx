'use client'

import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRupiah } from '@/lib/utils/currency'
import { timeAgo } from '@/lib/utils/date'
import {
  Users, Building2, TrendingUp, Wallet,
  AlertTriangle, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0, poktan_aktif: 0, supplier_verified: 0,
    transaksi_selesai: 0, total_komisi: 0, total_volume: 0,
    anomali_open: 0, kredit_pending: 0, pre_order_open: 0, disputes_aktif: 0,
  })
  const [anomaliOpen, setAnomaliOpen] = useState<any[]>([])
  const [kreditPending, setKreditPending] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats)
          setAnomaliOpen(data.recent_anomali || [])
          setKreditPending(data.recent_kredit || [])
        }
      })
      .catch(() => {})
  }, [])

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
            value={String(stats.poktan_aktif)}
            subtitle={`dari ${stats.total_users} total`}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Supplier"
            value={String(stats.supplier_verified)}
            subtitle="terverifikasi"
            icon={<Building2 className="h-5 w-5" />}
          />
          <StatCard
            title="Volume Bulan Ini"
            value={`${(stats.total_volume / 1000).toFixed(1)} ton`}
            icon={<TrendingUp className="h-5 w-5" />}
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Pendapatan Komisi"
            value={formatRupiah(stats.total_komisi)}
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
                    Anomali Belum Ditangani ({stats.anomali_open})
                  </CardTitle>
                  <Link href="/admin/compliance" className="text-xs text-tani-green font-medium flex items-center">
                    Lihat <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {anomaliOpen.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium">{a.poktan?.nama_poktan}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {(a.temuan as { deskripsi?: string })?.deskripsi}
                        </p>
                      </div>
                      <StatusBadge status={a.tingkat_risiko} />
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Kredit Pending */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Kredit Menunggu Review ({stats.kredit_pending})
                  </CardTitle>
                  <Link href="/admin/kredit" className="text-xs text-tani-green font-medium flex items-center">
                    Review <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {kreditPending.map((k: any) => (
                    <div key={k.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{k.petani?.nama_lengkap || 'Petani'}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRupiah(k.jumlah_diajukan)} — Skor AI: {k.ai_skor}
                        </p>
                      </div>
                      <StatusBadge status={k.status} />
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

