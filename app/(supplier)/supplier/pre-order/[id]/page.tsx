'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { getQAForm } from '@/lib/data/qa-forms'
import { formatRupiah, formatKg } from '@/lib/utils/currency'
import { formatTanggal, formatWaktu, timeAgo } from '@/lib/utils/date'
import { GRADE_COLORS } from '@/lib/constants/komoditas'
import type { SupplierQAStep } from '@/types'
import {
  ArrowLeft, MapPin, Calendar, Truck, ClipboardCheck,
  CheckCircle, XCircle, Clock, Package, Star, AlertCircle,
  ShieldCheck, Sparkles, Loader2, FileText,
  ChevronDown, ChevronRight, Eye,
} from 'lucide-react'
import Link from 'next/link'

const TIMELINE_STEPS: { status: string; label: string; icon: React.ReactNode }[] = [
  { status: 'open', label: 'Pre-Order Dibuat', icon: <Package className="h-4 w-4" /> },
  { status: 'matched', label: 'Poktan Matched', icon: <CheckCircle className="h-4 w-4" /> },
  { status: 'confirmed', label: 'Dikonfirmasi', icon: <ClipboardCheck className="h-4 w-4" /> },
  { status: 'fulfilled', label: 'Terpenuhi', icon: <Star className="h-4 w-4" /> },
]

const STATUS_ORDER: Record<string, number> = {
  open: 0,
  matched: 1,
  confirmed: 2,
  fulfilled: 3,
  cancelled: -1,
}

export default function PreOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [preOrder, setPreOrder] = useState<any>(null)
  const [poktan, setPoktan] = useState<any>(null)
  const [transaksi, setTransaksi] = useState<any>(null)
  const [qaInspeksi, setQaInspeksi] = useState<any[]>([])
  const [logistik, setLogistik] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/supplier/pre-order/${id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            const po = data.pre_order
            setPreOrder(po)
            setPoktan(po?.poktan || null)
            setTransaksi(po?.transaksi || null)
            setQaInspeksi(po?.qa_inspeksi || [])
            setLogistik(po?.logistik || [])
          }
        }
      } catch {
        // fallback
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  const currentStep = preOrder ? STATUS_ORDER[preOrder.status] ?? -1 : 0
  const qaForm = preOrder ? getQAForm(preOrder.komoditas) : null

  // Catatan kualitas state
  const [catatanKualitas, setCatatanKualitas] = useState('')
  const [aiSteps, setAiSteps] = useState<SupplierQAStep[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (preOrder) {
      setCatatanKualitas(preOrder.catatan_kualitas_supplier || '')
      setAiSteps(preOrder.ai_qa_steps || [])
      setIsSaved(!!preOrder.catatan_kualitas_supplier)
    }
  }, [preOrder])

  // QA form viewer
  const [qaFormOpen, setQaFormOpen] = useState(false)
  const [expandedQASections, setExpandedQASections] = useState<Set<string>>(new Set())

  function toggleQASection(sectionId: string) {
    setExpandedQASections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  async function handleGenerateQASteps() {
    if (!preOrder || !catatanKualitas.trim()) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/qa-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catatan: catatanKualitas,
          komoditas: preOrder.komoditas,
          grade: preOrder.grade,
        }),
      })
      const data = await res.json()
      if (data.steps && data.steps.length > 0) {
        setAiSteps(data.steps)
      }
      setIsSaved(true)
    } catch {
      // Fallback: just save the text
      setIsSaved(true)
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title="Detail Pre-Order" />
        <div className="p-4 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  if (!preOrder) {
    return (
      <>
        <TopBar title="Detail Pre-Order" />
        <div className="p-4 flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Pre-order tidak ditemukan</p>
          <Link href="/supplier/pre-order">
            <Button variant="outline" className="mt-4">Kembali</Button>
          </Link>
        </div>
      </>
    )
  }

  const totalNilai = preOrder.volume_kg * preOrder.harga_penawaran_per_kg

  return (
    <>
      <TopBar title="Detail Pre-Order" />
      <div className="p-4 lg:p-6 space-y-4 max-w-3xl">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{preOrder.komoditas}</h2>
              <Badge className={`${GRADE_COLORS[preOrder.grade] || ''} text-[10px] px-1.5 py-0`}>
                Grade {preOrder.grade}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">ID: {preOrder.id}</p>
          </div>
          <StatusBadge status={preOrder.status} />
        </div>

        {/* Timeline */}
        {preOrder.status !== 'cancelled' && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative ml-2">
                {TIMELINE_STEPS.map((step, i) => {
                  const isActive = i <= currentStep
                  const isCurrent = i === currentStep
                  return (
                    <div key={step.status} className="flex gap-3 pb-6 last:pb-0">
                      {/* Vertical line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                            isCurrent
                              ? 'bg-tani-green text-white ring-4 ring-tani-green/20'
                              : isActive
                              ? 'bg-tani-green text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {step.icon}
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-[24px] ${isActive ? 'bg-tani-green' : 'bg-muted'}`} />
                        )}
                      </div>
                      {/* Content */}
                      <div className="pt-1">
                        <p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {timeAgo(preOrder.updated_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {preOrder.status === 'cancelled' && (
          <Card className="shadow-sm border-red-200 bg-red-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-tani-red shrink-0" />
              <div>
                <p className="text-sm font-medium text-tani-red">Pre-Order Dibatalkan</p>
                <p className="text-xs text-muted-foreground">{timeAgo(preOrder.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pre-Order Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Informasi Pre-Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Komoditas</p>
                <p className="font-medium">{preOrder.komoditas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Grade</p>
                <p className="font-medium">Grade {preOrder.grade}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="font-medium">{formatKg(preOrder.volume_kg)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Harga/kg</p>
                <p className="font-medium">{formatRupiah(preOrder.harga_penawaran_per_kg)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Nilai</p>
                <p className="font-semibold text-tani-green">{formatRupiah(totalNilai)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deposit</p>
                <p className="font-medium">{formatRupiah(preOrder.deposit_dibayar)}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Dibutuhkan:</span>
              <span className="font-medium">{formatTanggal(preOrder.tanggal_dibutuhkan)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tujuan:</span>
              <span className="font-medium">{preOrder.wilayah_tujuan}</span>
            </div>
            {preOrder.catatan_spesifikasi && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Catatan Spesifikasi</p>
                <p className="text-sm">{preOrder.catatan_spesifikasi}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catatan Kualitas Supplier */}
        <Card className="shadow-sm border-tani-green/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-tani-green" />
              Catatan Kualitas untuk QA
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Tambahkan catatan kualitas penting. AI akan mengubahnya menjadi tahap pengecekan QA.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Catatan Kualitas</Label>
              <Textarea
                placeholder="Contoh: Tomat harus firm saat ditekan, tangkai masih hijau segar, tidak boleh ada bercak hitam..."
                value={catatanKualitas}
                onChange={(e) => { setCatatanKualitas(e.target.value); setIsSaved(false) }}
                rows={3}
                className="text-sm"
              />
            </div>
            <Button
              className="w-full bg-tani-green hover:bg-tani-green/90 text-white"
              disabled={!catatanKualitas.trim() || isGenerating}
              onClick={handleGenerateQASteps}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses dengan AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isSaved && aiSteps.length > 0 ? 'Perbarui Tahap QA' : 'Generate Tahap QA dengan AI'}
                </>
              )}
            </Button>

            {/* AI-generated QA Steps */}
            {aiSteps.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-tani-blue" />
                  <span className="text-xs font-semibold text-tani-blue">
                    Tahap QA dari Catatan Supplier
                  </span>
                </div>
                {aiSteps.map((step, i) => (
                  <div key={step.id} className="bg-blue-50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white bg-tani-blue rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-xs font-semibold text-foreground">{step.parameter}</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-7">{step.kriteria}</p>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-tani-green" />
                  Tahap ini akan muncul di form QA inspektor sebagai section terpisah
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lihat Form QA */}
        {qaForm && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Form Pengecekan QA
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {qaForm.referensi}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {qaForm.label} — {qaForm.sections.reduce((sum, s) => sum + s.parameters.length, 0)} parameter
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setQaFormOpen(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Lihat Detail Form QA
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Poktan Info (if matched) */}
        {poktan && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Poktan yang Ditugaskan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{poktan.nama_poktan}</p>
                  <p className="text-xs text-muted-foreground">{poktan.kode_poktan}</p>
                </div>
                {poktan.is_qa_certified && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px]">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    QA Certified
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Rating QA</p>
                  <p className="font-medium flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    {poktan.skor_qa}/100
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ketepatan</p>
                  <p className="font-medium">{poktan.skor_ketepatan}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lokasi</p>
                  <p className="font-medium">{poktan.desa}, {poktan.kabupaten}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Transaksi</p>
                  <p className="font-medium">{poktan.total_transaksi}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QA Inspection */}
        {qaInspeksi.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Hasil Inspeksi QA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {qaInspeksi.map((qa) => (
                <div key={qa.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={qa.status} />
                    {qa.skor_kualitas !== undefined && (
                      <span className="text-sm font-semibold">
                        Skor: <span className={qa.skor_kualitas >= 80 ? 'text-tani-green' : 'text-tani-amber'}>{qa.skor_kualitas}/100</span>
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    {qa.grade_hasil && (
                      <div>
                        <p className="text-xs text-muted-foreground">Grade Hasil</p>
                        <p className="font-medium">Grade {qa.grade_hasil}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Volume Inspeksi</p>
                      <p className="font-medium">{qa.volume_inspeksi_kg ? formatKg(qa.volume_inspeksi_kg) : '-'}</p>
                    </div>
                    {qa.penyimpangan_persen !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">Penyimpangan</p>
                        <p className="font-medium">{qa.penyimpangan_persen}%</p>
                      </div>
                    )}
                  </div>
                  {qa.catatan_inspektor && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Catatan Inspektor</p>
                      <p className="text-sm">{qa.catatan_inspektor}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Logistik Tracking */}
        {logistik.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tracking Logistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logistik.map((lg) => (
                <div key={lg.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs capitalize">
                      {lg.tier.replace(/_/g, ' ')}
                    </Badge>
                    <StatusBadge status={lg.status.replace(/_/g, ' ')} />
                  </div>
                  <div className="text-sm space-y-1.5">
                    <div className="flex items-start gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{lg.transporter_nama}</p>
                        {lg.kendaraan_plat && <p className="text-xs text-muted-foreground">{lg.kendaraan_plat}</p>}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-tani-green shrink-0 mt-0.5" />
                      <span>{lg.titik_asal}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-tani-red shrink-0 mt-0.5" />
                      <span>{lg.titik_tujuan}</span>
                    </div>
                    {lg.estimasi_tiba && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          ETA: {formatWaktu(lg.estimasi_tiba)}
                        </span>
                      </div>
                    )}
                    {lg.last_update_posisi && (
                      <div className="bg-blue-50 rounded-lg p-2.5 text-xs">
                        <span className="text-tani-blue font-medium">Update terakhir:</span>{' '}
                        {lg.last_update_posisi}
                        {lg.last_update_at && (
                          <span className="text-muted-foreground"> ({timeAgo(lg.last_update_at)})</span>
                        )}
                      </div>
                    )}
                  </div>
                  {logistik.indexOf(lg) < logistik.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pb-6">
          {transaksi && ['dalam_pengiriman', 'tiba_di_gudang'].includes(transaksi.status) && (
            <Button className="flex-1 bg-tani-green hover:bg-tani-green/90 text-white">
              <CheckCircle className="h-4 w-4 mr-2" />
              Konfirmasi Kedatangan
            </Button>
          )}
          {['open', 'matched'].includes(preOrder.status) && (
            <Button variant="outline" className="flex-1 border-tani-red text-tani-red hover:bg-red-50">
              <XCircle className="h-4 w-4 mr-2" />
              Batalkan Pre-Order
            </Button>
          )}
        </div>
      </div>

      {/* Dialog: Lihat Form QA */}
      {qaForm && (
        <Dialog open={qaFormOpen} onOpenChange={(v: boolean) => setQaFormOpen(v)}>
          <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">
                Form QA: {qaForm.label}
              </DialogTitle>
              <DialogDescription>
                {qaForm.referensi} — {qaForm.sections.reduce((sum, s) => sum + s.parameters.length, 0)} parameter pengecekan
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* Supplier QA Steps (if any) */}
              {aiSteps.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-tani-blue" />
                    <span className="text-xs font-semibold text-tani-blue">
                      Permintaan Khusus Supplier
                    </span>
                  </div>
                  {aiSteps.map((step, i) => (
                    <div key={step.id} className="bg-blue-50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white bg-tani-blue rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                          S{i + 1}
                        </span>
                        <p className="text-xs font-semibold">{step.parameter}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground ml-7">{step.kriteria}</p>
                    </div>
                  ))}
                  <Separator />
                </div>
              )}

              {/* SNI Sections */}
              {qaForm.sections.map((section) => {
                const isExpanded = expandedQASections.has(section.id)
                return (
                  <div key={section.id} className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => toggleQASection(section.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight">
                            {section.id}. {section.title}
                          </p>
                          {section.wajibLulusSemua && (
                            <span className="text-[10px] text-tani-amber font-medium">Wajib lulus semua</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                        {section.parameters.length}
                      </Badge>
                    </button>
                    {isExpanded && (
                      <div className="border-t">
                        {section.parameters.map((param, idx) => (
                          <div
                            key={param.no}
                            className={`px-3 py-2.5 ${idx > 0 ? 'border-t border-border/50' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full h-4 w-4 flex items-center justify-center shrink-0 mt-0.5">
                                {param.no}
                              </span>
                              <div>
                                <p className="text-xs font-medium">{param.parameter}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{param.kriteria}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Grade Info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold">Penentuan Grade</p>
                {qaForm.grades.map((g) => (
                  <div key={g.grade} className="bg-muted/50 rounded-lg p-2.5">
                    <p className="text-xs font-semibold">{g.grade}</p>
                    <p className="text-[11px] text-muted-foreground">{g.kriteria}</p>
                    {g.toleransi !== '\u2014' && (
                      <p className="text-[10px] text-muted-foreground">Toleransi: {g.toleransi}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setQaFormOpen(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
