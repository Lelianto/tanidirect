'use client'

import { useState, useEffect, useMemo } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatRupiah } from '@/lib/utils/currency'
import { KOMODITAS } from '@/lib/constants/komoditas'
import { PROVINSI } from '@/lib/constants/wilayah'
import {
  TrendingUp, TrendingDown, Minus, Search, AlertTriangle,
  Info, Sparkles, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'

export default function SupplierHargaPage() {
  const [komoditas, setKomoditas] = useState('Cabai Merah')
  const [wilayah, setWilayah] = useState('Jawa Barat')
  const [hasAnalyzed, setHasAnalyzed] = useState(true)
  const [hargaHistoris, setHargaHistoris] = useState<any[]>([])
  const [prediksiList, setPrediksiList] = useState<any[]>([])

  useEffect(() => {
    async function fetchHarga() {
      try {
        const res = await fetch('/api/supplier/harga')
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setHargaHistoris(data.historis || [])
            setPrediksiList(data.prediksi || [])
          }
        }
      } catch {
        // fallback to empty
      }
    }
    fetchHarga()
  }, [])

  const prediksi = prediksiList.length > 0 ? prediksiList[0] : null

  const chartData = useMemo(() => {
    return hargaHistoris
      .filter((h: any) => h.komoditas === komoditas)
      .sort((a: any, b: any) => new Date(a.minggu).getTime() - new Date(b.minggu).getTime())
      .map((h: any) => ({
        minggu: new Date(h.minggu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        harga: h.harga_per_kg,
        volume: h.volume_total_kg,
      }))
  }, [komoditas, hargaHistoris])

  const avgHarga = chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.harga, 0) / chartData.length)
    : 0

  const lastHarga = chartData.length > 0 ? chartData[chartData.length - 1].harga : 0
  const prevHarga = chartData.length > 1 ? chartData[chartData.length - 2].harga : lastHarga
  const hargaChange = lastHarga - prevHarga
  const hargaChangePct = prevHarga > 0 ? ((hargaChange / prevHarga) * 100).toFixed(1) : '0'

  const tren = prediksi?.tren || (hargaChange > 0 ? 'naik' : hargaChange < 0 ? 'turun' : 'stabil')

  const trendConfig = {
    naik: {
      icon: <TrendingUp className="h-8 w-8" />,
      color: 'text-tani-red',
      bg: 'bg-red-50',
      label: 'Naik',
    },
    turun: {
      icon: <TrendingDown className="h-8 w-8" />,
      color: 'text-tani-green',
      bg: 'bg-green-50',
      label: 'Turun',
    },
    stabil: {
      icon: <Minus className="h-8 w-8" />,
      color: 'text-tani-blue',
      bg: 'bg-blue-50',
      label: 'Stabil',
    },
  }

  const trend = trendConfig[tren as keyof typeof trendConfig] || trendConfig.stabil

  const est2 = prediksi?.estimasi_2_minggu as { min: number; max: number; median: number } | undefined
  const est4 = prediksi?.estimasi_4_minggu as { min: number; max: number; median: number } | undefined

  function handleAnalisis() {
    setHasAnalyzed(true)
  }

  return (
    <>
      <TopBar title="Prediksi Harga" />
      <div className="p-4 lg:p-6 space-y-4 max-w-4xl">
        {/* Selector */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Komoditas</label>
                <Select value={komoditas} onValueChange={(v: string | null) => { setKomoditas(v ?? ''); setHasAnalyzed(false) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih komoditas" />
                  </SelectTrigger>
                  <SelectContent>
                    {KOMODITAS.map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Wilayah</label>
                <Select value={wilayah} onValueChange={(v: string | null) => { setWilayah(v ?? ''); setHasAnalyzed(false) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih wilayah" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINSI.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full bg-tani-green hover:bg-tani-green/90 text-white"
              onClick={handleAnalisis}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Analisis Harga
            </Button>
          </CardContent>
        </Card>

        {hasAnalyzed && (
          <>
            {/* Trend Indicator */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tren Harga {komoditas}</p>
                    <p className="text-2xl font-bold">{formatRupiah(lastHarga)}<span className="text-sm font-normal text-muted-foreground">/kg</span></p>
                    <div className={`flex items-center gap-1 mt-1 text-sm ${hargaChange >= 0 ? 'text-tani-red' : 'text-tani-green'}`}>
                      {hargaChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      <span className="font-medium">{hargaChange >= 0 ? '+' : ''}{formatRupiah(hargaChange)} ({hargaChangePct}%)</span>
                      <span className="text-muted-foreground">vs minggu lalu</span>
                    </div>
                  </div>
                  <div className={`${trend.bg} ${trend.color} rounded-2xl p-4 flex flex-col items-center gap-1`}>
                    {trend.icon}
                    <span className="text-xs font-bold">{trend.label}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Harga Historis (13 Minggu)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="minggu"
                        tick={{ fontSize: 11 }}
                        angle={-30}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`}
                      />
                      <Tooltip
                        formatter={(value) => [formatRupiah(Number(value || 0)), 'Harga/kg']}
                        labelStyle={{ fontSize: 12 }}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <ReferenceLine
                        y={avgHarga}
                        stroke="#F59E0B"
                        strokeDasharray="5 5"
                        label={{ value: 'Rata-rata', position: 'insideTopRight', fontSize: 10, fill: '#F59E0B' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="harga"
                        stroke="#16A34A"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#16A34A' }}
                        activeDot={{ r: 5 }}
                        name="Harga/kg"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Estimation Cards */}
            {(est2 || est4) && (
              <div className="grid grid-cols-2 gap-3">
                {est2 && (
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2">Estimasi 2 Minggu</p>
                      <p className="text-lg font-bold text-tani-green">{formatRupiah(est2.median)}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Range: {formatRupiah(est2.min)} - {formatRupiah(est2.max)}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {est4 && (
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2">Estimasi 4 Minggu</p>
                      <p className="text-lg font-bold text-tani-blue">{formatRupiah(est4.median)}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Range: {formatRupiah(est4.min)} - {formatRupiah(est4.max)}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Faktor Penentu */}
            {prediksi && prediksi.faktor_penentu.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Faktor Penentu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {prediksi.faktor_penentu.map((f: string, i: number) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs px-3 py-1"
                      >
                        {f}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Catatan Penting */}
            {prediksi?.catatan_penting && (
              <Card className="shadow-sm border-amber-200 bg-amber-50/50">
                <CardContent className="p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-tani-amber shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">Catatan Penting</p>
                    <p className="text-sm text-amber-800">{prediksi.catatan_penting}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>
                Prediksi harga dihasilkan oleh model AI berdasarkan data historis, cuaca, dan tren pasar.
                Angka yang ditampilkan bersifat estimasi dan tidak menjadi jaminan harga aktual.
                Gunakan sebagai referensi tambahan dalam pengambilan keputusan.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
