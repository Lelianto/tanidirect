'use client'

import { useState, useEffect } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { KomoditasCard } from '@/components/shared/KomoditasCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store'
import { formatRupiah } from '@/lib/utils/currency'
import { timeAgo } from '@/lib/utils/date'
import {
  Users, ShoppingCart, Wallet, Star, ClipboardCheck,
  Eye, Bell, ChevronRight, Headphones,
} from 'lucide-react'
import Link from 'next/link'
import { KYCStatusBanner } from '@/components/kyc/KYCStatusBanner'

export default function PoktanDashboard() {
  const user = useAuthStore((s) => s.user)

  const [poktan, setPoktan] = useState<any>(null)
  const [transaksiAktif, setTransaksiAktif] = useState<any[]>([])
  const [preOrderTersedia, setPreOrderTersedia] = useState<any[]>([])
  const [notifikasi, setNotifikasi] = useState<any[]>([])
  const [totalFeeQA, setTotalFeeQA] = useState(0)
  const [stats, setStats] = useState<any>({})
  const [kycStatus, setKycStatus] = useState<string>('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetch(`/api/poktan/dashboard?user_id=${user.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success) {
          setPoktan(data.poktan)
          setTransaksiAktif(data.transaksi_aktif || [])
          setPreOrderTersedia(data.pre_orders_tersedia || [])
          setNotifikasi(data.notifikasi || [])
          setTotalFeeQA(data.stats?.total_fee_qa || 0)
          setStats(data.stats || {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Fetch KYC status separately
    fetch(`/api/kyc/status?user_id=${user.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.status) setKycStatus(data.status)
      })
      .catch(() => {})
  }, [user])

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="p-4 lg:p-6 space-y-6 max-w-5xl">
        {/* Greeting */}
        <div>
          <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
            Halo, {user?.nama_lengkap?.split(' ')[0] || 'Ketua'} 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            {poktan?.nama_poktan} — {poktan?.kabupaten}, {poktan?.provinsi}
          </p>
        </div>

        {/* KYC Banner */}
        {kycStatus !== 'layer1_passed' && kycStatus !== 'fully_verified' && (
          <KYCStatusBanner kycStatus={kycStatus} />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Anggota"
            value={String(stats.jumlah_anggota || poktan?.jumlah_anggota || 0)}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Transaksi Aktif"
            value={String(stats.transaksi_aktif || transaksiAktif.length)}
            icon={<ShoppingCart className="h-5 w-5" />}
            trend="up"
            trendValue="+2"
          />
          <StatCard
            title="Saldo Fee QA"
            value={formatRupiah(totalFeeQA)}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="Rating QA"
            value={`${stats.skor_qa || poktan?.skor_qa || 0}/100`}
            icon={<Star className="h-5 w-5" />}
            trend="up"
            trendValue="+2.5"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/poktan/qa">
            <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-1">
              <ClipboardCheck className="h-5 w-5 text-tani-green" />
              <span className="text-xs">Input QA</span>
            </Button>
          </Link>
          <Link href="/poktan/pre-order">
            <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-1">
              <Eye className="h-5 w-5 text-tani-blue" />
              <span className="text-xs">Permintaan</span>
            </Button>
          </Link>
          <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-1">
            <Headphones className="h-5 w-5 text-tani-amber" />
            <span className="text-xs">Support</span>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Transaksi Aktif */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Transaksi Aktif</CardTitle>
                <Link href="/poktan/dashboard" className="text-xs text-tani-green font-medium flex items-center">
                  Lihat Semua <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {transaksiAktif.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada transaksi aktif
                </p>
              ) : (
                transaksiAktif.map((tx) => (
                  <KomoditasCard
                    key={tx.id}
                    komoditas={tx.komoditas}
                    grade={tx.grade}
                    volume_kg={tx.volume_estimasi_kg}
                    harga_per_kg={tx.harga_per_kg}
                    status={tx.status}
                    tanggal={tx.created_at}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Permintaan Supplier Tersedia */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Permintaan Supplier</CardTitle>
                <Link href="/poktan/pre-order" className="text-xs text-tani-green font-medium flex items-center">
                  Lihat Semua <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {preOrderTersedia.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada permintaan yang cocok
                </p>
              ) : (
                preOrderTersedia.map((po) => (
                  <KomoditasCard
                    key={po.id}
                    komoditas={po.komoditas}
                    grade={po.grade}
                    volume_kg={po.volume_kg}
                    harga_per_kg={po.harga_penawaran_per_kg}
                    status={po.status}
                    tanggal={po.tanggal_dibutuhkan}
                    isNew
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notifikasi */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notifikasi Terbaru
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {notifikasi.map((n) => (
                <Link key={n.id} href={n.link || '#'} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-tani-green'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.is_read ? 'text-muted-foreground' : 'font-medium'}`}>
                      {n.judul}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{n.pesan}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
