'use client'

import { useState } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CairkanDialog } from '@/components/petani/CairkanDialog'
import { useAuthStore } from '@/store'
import {
  getKontribusiByPetaniId, getKreditByPetaniId, dummyHargaHistoris,
  getPencairanByPetaniId,
} from '@/lib/dummy'
import { formatRupiah } from '@/lib/utils/currency'
import { formatTanggalSingkat, timeAgo } from '@/lib/utils/date'
import {
  Wallet, ShoppingCart, CreditCard, TrendingUp, ChevronRight,
  ArrowDownToLine,
} from 'lucide-react'
import Link from 'next/link'
import { KYCStatusBanner } from '@/components/kyc/KYCStatusBanner'

export default function PetaniDashboard() {
  const user = useAuthStore((s) => s.user)
  const [cairkanOpen, setCairkanOpen] = useState(false)
  // Demo: use 'pending' as default KYC status. In production, fetch from Supabase.
  const kycStatus: string = 'pending'

  const kontribusi = user ? getKontribusiByPetaniId(user.id) : []
  const kredit = user ? getKreditByPetaniId(user.id) : []
  const pencairan = user ? getPencairanByPetaniId(user.id) : []
  const kreditAktif = kredit.find((k) => k.status === 'aktif')

  const saldoPending = kontribusi
    .filter((k) => k.status_bayar === 'pending')
    .reduce((sum, k) => sum + (k.harga_diterima || 0), 0)

  const transaksiAktif = kontribusi.filter(
    (k) => k.transaksi && !['selesai', 'dibatalkan'].includes(k.transaksi.status)
  )

  const riwayatBayar = kontribusi
    .filter((k) => k.status_bayar === 'dibayar')
    .sort((a, b) => new Date(b.tanggal_bayar || 0).getTime() - new Date(a.tanggal_bayar || 0).getTime())
    .slice(0, 5)

  // Harga komoditas banner
  const hargaTerbaru = dummyHargaHistoris
    .filter((h) => h.komoditas === 'Cabai Merah')
    .sort((a, b) => new Date(b.minggu).getTime() - new Date(a.minggu).getTime())[0]

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
        {/* Banner Harga */}
        {hargaTerbaru && (
          <div className="bg-gradient-to-r from-tani-green to-tani-green-light rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Harga {hargaTerbaru.komoditas} minggu ini</p>
                <p className="text-xl font-bold">{formatRupiah(hargaTerbaru.harga_per_kg)}/kg</p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-50" />
            </div>
          </div>
        )}

        {/* Greeting */}
        <div>
          <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
            Halo, {user?.nama_lengkap?.split(' ')[0] || 'Petani'}
          </h2>
          <p className="text-sm text-muted-foreground">{user?.kecamatan}, {user?.kabupaten}</p>
        </div>

        {/* KYC Banner */}
        {kycStatus !== 'layer1_passed' && kycStatus !== 'fully_verified' && (
          <KYCStatusBanner kycStatus={kycStatus} />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Saldo Pending"
            value={formatRupiah(saldoPending)}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="Transaksi Aktif"
            value={String(transaksiAktif.length)}
            icon={<ShoppingCart className="h-5 w-5" />}
          />
        </div>

        {/* Rekening Info */}
        {user?.rekening ? (
          <Card className="shadow-sm border-tani-green/20 bg-tani-green/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Rekening Terdaftar</p>
                  <p className="text-sm font-semibold">{user.rekening.provider} — {user.rekening.nomor}</p>
                  <p className="text-xs text-muted-foreground">a.n. {user.rekening.atas_nama}</p>
                </div>
                <Link href="/petani/riwayat">
                  <Button variant="ghost" size="sm" className="text-tani-green">
                    Ubah
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-amber-800">Belum ada rekening</p>
                  <p className="text-xs text-amber-600">Tambahkan rekening untuk menerima pencairan</p>
                </div>
                <Button
                  size="sm"
                  className="bg-tani-amber hover:bg-tani-amber/90 text-white"
                  onClick={() => setCairkanOpen(true)}
                >
                  Tambah
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kredit Aktif */}
        {kreditAktif && (
          <Card className="shadow-sm border-tani-blue/20 bg-tani-blue/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-tani-blue" />
                  <span className="text-sm font-medium">Kredit Modal Tanam</span>
                </div>
                <StatusBadge status={kreditAktif.status} />
              </div>
              <p className="text-lg font-bold">{formatRupiah(kreditAktif.jumlah_disetujui || 0)}</p>
              <p className="text-xs text-muted-foreground">
                Tenor {kreditAktif.tenor_bulan} bulan — Jatuh tempo: {kreditAktif.tanggal_jatuh_tempo}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Riwayat Pencairan */}
        {pencairan.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                Riwayat Pencairan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {pencairan.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{p.rekening.provider} — {p.rekening.nomor}</p>
                      <p className="text-xs text-muted-foreground">{formatTanggalSingkat(p.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-tani-green">{formatRupiah(p.jumlah_diterima)}</p>
                      <StatusBadge status={p.status === 'berhasil' ? 'dibayar' : p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Riwayat Pembayaran */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Riwayat Pembayaran</CardTitle>
              <Link href="/petani/riwayat" className="text-xs text-tani-green font-medium flex items-center">
                Semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {riwayatBayar.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada pembayaran</p>
              ) : (
                riwayatBayar.map((k) => (
                  <div key={k.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{k.transaksi?.komoditas}</p>
                      <p className="text-xs text-muted-foreground">
                        {k.volume_kg} kg — {formatTanggalSingkat(k.tanggal_bayar!)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-tani-green">
                        +{formatRupiah(k.harga_diterima || 0)}
                      </p>
                      <StatusBadge status={k.status_bayar} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA Cairkan */}
        {saldoPending > 0 && (
          <Button
            className="w-full bg-tani-green hover:bg-tani-green-dark text-white h-12 text-base font-semibold"
            onClick={() => setCairkanOpen(true)}
          >
            <ArrowDownToLine className="h-5 w-5 mr-2" />
            Cairkan Saldo ({formatRupiah(saldoPending)})
          </Button>
        )}
      </div>

      <CairkanDialog
        open={cairkanOpen}
        onOpenChange={setCairkanOpen}
        saldoPending={saldoPending}
        savedRekening={user?.rekening}
      />
    </>
  )
}
