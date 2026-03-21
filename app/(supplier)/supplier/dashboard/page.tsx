'use client'

import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { KomoditasCard } from '@/components/shared/KomoditasCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store'
import {
  getSupplierByUserId, getPreOrdersBySupplierId,
  dummyTransaksi, dummyPrediksiHarga, dummyHargaHistoris,
} from '@/lib/dummy'
import { formatRupiah } from '@/lib/utils/currency'
import {
  ShoppingCart, TrendingUp, Wallet, Star,
  Plus, CheckCircle, FileText, ChevronRight, ArrowUp, ArrowDown, Minus,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

export default function SupplierDashboard() {
  const user = useAuthStore((s) => s.user)
  const supplier = user ? getSupplierByUserId(user.id) : null
  const preOrders = supplier ? getPreOrdersBySupplierId(supplier.id) : []
  const transaksiSupplier = dummyTransaksi.filter((t) => t.supplier_id === supplier?.id)
  const transaksiSelesai = transaksiSupplier.filter((t) => t.status === 'selesai')
  const nilaiTransaksiBulan = transaksiSelesai.reduce((sum, t) => sum + (t.total_nilai || 0), 0)
  const preOrderAktif = preOrders.filter((po) => !['fulfilled', 'cancelled'].includes(po.status))

  // Chart data for volume 6 bulan
  const chartData = useMemo(() => {
    const months = ['Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar']
    return months.map((m, i) => ({
      bulan: m,
      volume: Math.round(3000 + Math.random() * 8000),
      transaksi: Math.round(2 + Math.random() * 6),
    }))
  }, [])

  // Prediksi harga
  const prediksi = dummyPrediksiHarga[0]
  const trendIcon = prediksi?.tren === 'naik'
    ? <ArrowUp className="h-4 w-4 text-tani-red" />
    : prediksi?.tren === 'turun'
    ? <ArrowDown className="h-4 w-4 text-tani-green" />
    : <Minus className="h-4 w-4 text-muted-foreground" />

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="p-4 lg:p-6 space-y-6 max-w-6xl">
        <div>
          <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
            {supplier?.nama_perusahaan || 'Supplier'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {supplier?.jenis_usaha} — {user?.kabupaten}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Pre-Order Aktif"
            value={String(preOrderAktif.length)}
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <StatCard
            title="Transaksi Bulan Ini"
            value={formatRupiah(nilaiTransaksiBulan)}
            icon={<TrendingUp className="h-5 w-5" />}
            trend="up"
            trendValue="+15%"
          />
          <StatCard
            title="Saldo Escrow"
            value={formatRupiah(supplier?.deposit_escrow || 0)}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="Rating"
            value={`${supplier?.rating || 0}/5.0`}
            icon={<Star className="h-5 w-5" />}
            trend="up"
            trendValue="+0.2"
          />
        </div>

        {/* Shortcuts */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/supplier/pre-order">
            <Button className="w-full h-auto py-3 flex flex-col gap-1 bg-tani-green hover:bg-tani-green-dark text-white">
              <Plus className="h-5 w-5" />
              <span className="text-xs">Buat Pre-Order</span>
            </Button>
          </Link>
          <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-1">
            <CheckCircle className="h-5 w-5 text-tani-blue" />
            <span className="text-xs">Konfirmasi</span>
          </Button>
          <Link href="/supplier/transaksi">
            <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-1">
              <FileText className="h-5 w-5 text-tani-amber" />
              <span className="text-xs">Invoice</span>
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Volume Chart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Volume Pembelian (6 Bulan)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="#16A34A"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Volume (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Prediksi Harga */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Outlook Harga</CardTitle>
                <Link href="/supplier/harga" className="text-xs text-tani-green font-medium flex items-center">
                  Detail <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {prediksi && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{prediksi.komoditas}</span>
                    <div className="flex items-center gap-1 text-sm">
                      {trendIcon}
                      <span className="capitalize font-medium">{prediksi.tren}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-xl p-3">
                      <p className="text-[11px] text-muted-foreground">2 Minggu</p>
                      <p className="text-sm font-semibold">
                        {formatRupiah((prediksi.estimasi_2_minggu as { min: number; max: number })?.min || 0)} - {formatRupiah((prediksi.estimasi_2_minggu as { min: number; max: number })?.max || 0)}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3">
                      <p className="text-[11px] text-muted-foreground">4 Minggu</p>
                      <p className="text-sm font-semibold">
                        {formatRupiah((prediksi.estimasi_4_minggu as { min: number; max: number })?.min || 0)} - {formatRupiah((prediksi.estimasi_4_minggu as { min: number; max: number })?.max || 0)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Faktor Penentu:</p>
                    <div className="flex flex-wrap gap-1">
                      {prediksi.faktor_penentu.map((f, i) => (
                        <span key={i} className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pre-Order Aktif */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Pre-Order Aktif</CardTitle>
              <Link href="/supplier/pre-order" className="text-xs text-tani-green font-medium flex items-center">
                Lihat Semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {preOrderAktif.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada pre-order aktif</p>
            ) : (
              preOrderAktif.map((po) => (
                <KomoditasCard
                  key={po.id}
                  komoditas={po.komoditas}
                  grade={po.grade}
                  volume_kg={po.volume_kg}
                  harga_per_kg={po.harga_penawaran_per_kg}
                  status={po.status}
                  tanggal={po.tanggal_dibutuhkan}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
