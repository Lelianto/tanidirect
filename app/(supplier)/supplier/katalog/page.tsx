'use client'

import { useState, useEffect, useMemo } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { formatRupiah, formatKg } from '@/lib/utils/currency'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts'
import Image from 'next/image'
import { Store, Filter, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/store'
import type { KatalogKomoditas } from '@/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

function KomoditasKatalogCard({ item }: { item: KatalogKomoditas }) {
  const radarData = [
    { subject: 'Kualitas', value: item.skor_kualitas },
    { subject: 'Ketepatan', value: item.skor_ketepatan },
    { subject: 'Volume', value: item.skor_volume },
    { subject: 'Harga', value: item.skor_harga },
  ]

  const gradeColor = item.grade === 'A'
    ? 'bg-green-100 text-green-800'
    : item.grade === 'B'
    ? 'bg-amber-100 text-amber-800'
    : 'bg-red-100 text-red-800'

  const fotoUrls = item.catatan_panen?.foto_urls || (item.foto_url ? [item.foto_url] : [])

  return (
    <Card className="shadow-sm overflow-hidden">
      {/* Photo gallery */}
      {fotoUrls.length > 0 && (
        <div className="flex gap-0.5 h-36 bg-muted">
          {fotoUrls.map((url, i) => (
            <div key={i} className={`relative ${fotoUrls.length === 1 ? 'w-full' : fotoUrls.length === 2 ? 'w-1/2' : 'w-1/3'}`}>
              <Image
                src={`${SUPABASE_URL}/storage/v1/object/public/platform-assets/${url}`}
                alt={`${item.nama} foto ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                {item.nama}
              </h3>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${gradeColor}`}>
                Grade {item.grade}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.poktan?.nama_poktan || item.poktan_nama} &middot; {item.wilayah}
            </p>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
            Margin: {item.margin_persen}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Harga</p>
            <p className="font-semibold text-tani-green">{formatRupiah(item.harga_per_kg)} /kg</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="font-semibold">{formatKg(item.volume_tersedia_kg)} tersedia</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Jadwal panen</p>
          <p className="text-sm font-medium">{item.jadwal_panen}</p>
        </div>

        {item.catatan_panen?.catatan && (
          <div>
            <p className="text-xs text-muted-foreground">Catatan poktan</p>
            <p className="text-sm text-muted-foreground">{item.catatan_panen.catatan}</p>
          </div>
        )}

        <ResponsiveContainer width="100%" height={150}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
            <Radar name="Skor" dataKey="value" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>

        <p className="text-xs text-muted-foreground text-right">
          Margin: {item.margin_persen}%
        </p>
      </CardContent>
    </Card>
  )
}

export default function SupplierKatalogPage() {
  const user = useAuthStore((s) => s.user)
  const [katalogData, setKatalogData] = useState<import('@/types').KatalogKomoditas[]>([])
  const [komoditas, setKomoditas] = useState('Semua')
  const [wilayah, setWilayah] = useState('Semua')
  const [volumeMin, setVolumeMin] = useState('Semua')
  const [jadwal, setJadwal] = useState('Semua')

  useEffect(() => {
    async function fetchKatalog() {
      try {
        const params = new URLSearchParams()
        if (user?.provinsi) {
          params.set('supplier_provinsi', user.provinsi)
        }
        const res = await fetch(`/api/supplier/katalog?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setKatalogData(data.katalog || [])
          }
        }
      } catch {
        // fallback to empty
      }
    }
    fetchKatalog()
  }, [user])

  const uniqueKomoditas = useMemo(
    () => [...new Set(katalogData.map((k) => k.nama))],
    [katalogData],
  )
  const uniqueWilayah = useMemo(
    () => [...new Set(katalogData.map((k) => k.wilayah))],
    [katalogData],
  )

  const filtered = useMemo(() => {
    return katalogData.filter((k) => {
      if (komoditas !== 'Semua' && k.nama !== komoditas) return false
      if (wilayah !== 'Semua' && k.wilayah !== wilayah) return false
      if (volumeMin !== 'Semua' && k.volume_tersedia_kg < Number(volumeMin)) return false
      if (jadwal !== 'Semua') {
        const month = new Date(k.jadwal_panen).getMonth()
        if (jadwal === 'April 2026' && month !== 3) return false
        if (jadwal === 'Mei 2026' && month !== 4) return false
      }
      return true
    })
  }, [katalogData, komoditas, wilayah, volumeMin, jadwal])

  return (
    <>
      <TopBar title="Smart Katalog" />
      <div className="p-4 lg:p-6 space-y-6 max-w-6xl">
        {/* Filter Bar */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Filter</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Komoditas</Label>
                <Select value={komoditas} onValueChange={(v: string | null) => setKomoditas(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semua">Semua</SelectItem>
                    {uniqueKomoditas.map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Wilayah</Label>
                <Select value={wilayah} onValueChange={(v: string | null) => setWilayah(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semua">Semua</SelectItem>
                    {uniqueWilayah.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Volume Min</Label>
                <Select value={volumeMin} onValueChange={(v: string | null) => setVolumeMin(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semua">Semua</SelectItem>
                    <SelectItem value="1000">1.000 kg</SelectItem>
                    <SelectItem value="3000">3.000 kg</SelectItem>
                    <SelectItem value="5000">5.000 kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Jadwal</Label>
                <Select value={jadwal} onValueChange={(v: string | null) => setJadwal(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semua">Semua</SelectItem>
                    <SelectItem value="April 2026">April 2026</SelectItem>
                    <SelectItem value="Mei 2026">Mei 2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Store className="h-4 w-4" />
          <span>{filtered.length} komoditas ditemukan</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tidak ada komoditas yang sesuai filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <KomoditasKatalogCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
