'use client'

import { useState, useEffect, useCallback, useMemo, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store'
import {
  dummyTransaksi, dummySuppliers, dummyPoktan,
  getPoktanByKetuaId,
} from '@/lib/dummy'
import { formatRupiah, formatKg } from '@/lib/utils/currency'
import { GRADE_COLORS } from '@/lib/constants/komoditas'
import {
  getQAForm, saveDraft, loadDraft, deleteDraft,
} from '@/lib/data/qa-forms'
import type { QADraft, QAFormSection } from '@/lib/data/qa-forms'
import { computeAutoGrade } from '@/lib/qa/auto-grade'
import {
  ArrowLeft, ChevronDown, ChevronRight, CheckCircle, XCircle,
  Save, Send, FileText, Clock, Camera, Info, AlertTriangle, ShieldCheck, ShieldX,
} from 'lucide-react'

export default function InspeksiPage({ params }: { params: Promise<{ txId: string }> }) {
  const { txId } = use(params)
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const poktan = user ? getPoktanByKetuaId(user.id) : dummyPoktan[0]

  const tx = dummyTransaksi.find((t) => t.id === txId)
  const supplier = tx ? dummySuppliers.find((s) => s.id === tx.supplier_id) : null
  const form = tx ? getQAForm(tx.komoditas) : null

  // Form state
  const [volumeSampel, setVolumeSampel] = useState('')
  const [results, setResults] = useState<Record<number, { lulus: boolean | null; catatan: string }>>({})
  const [gradePilihan, setGradePilihan] = useState('')
  const [fotoBatch, setFotoBatch] = useState(false)
  const [fotoDetail, setFotoDetail] = useState(false)
  const [fotoTimbangan, setFotoTimbangan] = useState(false)
  const [catatanTambahan, setCatatanTambahan] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [showCatatanFor, setShowCatatanFor] = useState<Set<number>>(new Set())
  const [gradeOverrideReason, setGradeOverrideReason] = useState('')

  // Auto-grade recommendation
  const autoGradeResult = useMemo(() => {
    if (!form) return null
    return computeAutoGrade(form, results)
  }, [form, results])

  // Auto-set grade when recommendation changes
  useEffect(() => {
    if (autoGradeResult?.isComplete && autoGradeResult.grade) {
      setGradePilihan(autoGradeResult.grade)
    }
  }, [autoGradeResult?.isComplete, autoGradeResult?.grade])

  const isOverride = autoGradeResult?.isComplete && gradePilihan && gradePilihan !== autoGradeResult.grade

  // Load draft on mount
  useEffect(() => {
    if (!tx || !form) return
    const draft = loadDraft(tx.id)
    if (draft) {
      setVolumeSampel(draft.volume_sampel)
      setResults(draft.results)
      setGradePilihan(draft.grade_pilihan)
      setFotoBatch(draft.foto_batch)
      setFotoDetail(draft.foto_detail)
      setFotoTimbangan(draft.foto_timbangan)
      setCatatanTambahan(draft.catatan_tambahan)
      setDraftSavedAt(draft.updated_at)
      if (draft.grade_override_reason) setGradeOverrideReason(draft.grade_override_reason)
    }
    // Expand first section by default
    if (form.sections.length > 0) {
      setExpandedSections(new Set([form.sections[0].id]))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txId])

  // Auto-save draft
  const doSaveDraft = useCallback(() => {
    if (!tx || !form) return
    const now = new Date().toISOString()
    const draft: QADraft = {
      transaksi_id: tx.id,
      komoditas: tx.komoditas,
      form_label: form.label,
      volume_sampel: volumeSampel,
      results,
      grade_pilihan: gradePilihan,
      foto_batch: fotoBatch,
      foto_detail: fotoDetail,
      foto_timbangan: fotoTimbangan,
      catatan_tambahan: catatanTambahan,
      grade_rekomendasi: autoGradeResult?.grade,
      grade_override_reason: isOverride ? gradeOverrideReason : undefined,
      updated_at: now,
    }
    saveDraft(draft)
    setDraftSavedAt(now)
  }, [tx, form, volumeSampel, results, gradePilihan, fotoBatch, fotoDetail, fotoTimbangan, catatanTambahan, autoGradeResult?.grade, isOverride, gradeOverrideReason])

  // Auto-save on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(doSaveDraft, 1000)
    return () => clearTimeout(timer)
  }, [doSaveDraft])

  function toggleSection(sectionId: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  function setParamResult(paramNo: number, lulus: boolean | null) {
    setResults((prev) => ({
      ...prev,
      [paramNo]: { ...prev[paramNo], lulus, catatan: prev[paramNo]?.catatan || '' },
    }))
  }

  function setParamCatatan(paramNo: number, catatan: string) {
    setResults((prev) => ({
      ...prev,
      [paramNo]: { ...prev[paramNo], lulus: prev[paramNo]?.lulus ?? null, catatan },
    }))
  }

  function toggleCatatan(paramNo: number) {
    setShowCatatanFor((prev) => {
      const next = new Set(prev)
      if (next.has(paramNo)) next.delete(paramNo)
      else next.add(paramNo)
      return next
    })
  }

  function getSectionProgress(section: QAFormSection) {
    let filled = 0
    for (const param of section.parameters) {
      if (results[param.no]?.lulus !== null && results[param.no]?.lulus !== undefined) filled++
    }
    return { filled, total: section.parameters.length }
  }

  function getTotalProgress() {
    if (!form) return { filled: 0, total: 0 }
    let filled = 0
    let total = 0
    for (const section of form.sections) {
      for (const param of section.parameters) {
        total++
        if (results[param.no]?.lulus !== null && results[param.no]?.lulus !== undefined) filled++
      }
    }
    return { filled, total }
  }

  function computeScore(): number {
    const { filled, total } = getTotalProgress()
    if (filled === 0) return 0
    let lulusCount = 0
    for (const key in results) {
      if (results[key]?.lulus === true) lulusCount++
    }
    return Math.round((lulusCount / total) * 100)
  }

  function canSubmit(): boolean {
    const { filled, total } = getTotalProgress()
    const hasOverrideReason = !isOverride || gradeOverrideReason.trim().length > 0
    return filled === total && !!gradePilihan && !!volumeSampel && hasOverrideReason
  }

  function handleSubmit() {
    doSaveDraft()
    deleteDraft(txId)
    // Status becomes 'perlu_tinjauan' — awaiting supplier review
    router.push('/poktan/qa')
  }

  if (!tx || !form) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Transaksi tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/poktan/qa')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
        </Button>
      </div>
    )
  }

  const totalProgress = getTotalProgress()
  const progressPct = totalProgress.total > 0 ? Math.round((totalProgress.filled / totalProgress.total) * 100) : 0

  const dokumenLabel = form.dokumen === 'A' ? 'SNI Lengkap' : form.dokumen === 'B' ? 'SNI Terbatas' : form.dokumen === 'C' ? 'Standar Platform' : 'Standar Umum'

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/poktan/qa')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold">Inspeksi QA</h1>
              <p className="text-[11px] text-muted-foreground">{form.label}</p>
            </div>
          </div>
          {draftSavedAt && (
            <Badge variant="secondary" className="text-[10px] gap-1 px-2 py-0.5">
              <Save className="h-3 w-3" />
              Draft tersimpan
            </Badge>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-tani-green transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {/* Transaction info card */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-sm">{tx.komoditas}</h2>
                  <Badge className={`${GRADE_COLORS[tx.grade] || 'bg-slate-100 text-slate-700'} text-[10px] px-1.5 py-0`}>
                    Grade {tx.grade}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatKg(tx.volume_estimasi_kg)} &middot; {formatRupiah(tx.harga_per_kg)}/kg
                </p>
                <p className="text-xs text-muted-foreground">
                  Supplier: {supplier?.nama_perusahaan || '-'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  <FileText className="h-3 w-3 mr-0.5" />
                  {dokumenLabel}
                </Badge>
              </div>
            </div>
            {form.referensi && (
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                <Info className="h-3 w-3 shrink-0" />
                Ref: {form.referensi}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Volume Sampel */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <Label className="text-xs font-semibold">Volume Sampel (kg)</Label>
            <Input
              type="number"
              placeholder="Masukkan volume sampel yang diinspeksi"
              value={volumeSampel}
              onChange={(e) => setVolumeSampel(e.target.value)}
              className="mt-1.5"
            />
          </CardContent>
        </Card>

        {/* Progress overview */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-muted-foreground">
            Progress: {totalProgress.filled}/{totalProgress.total} parameter dinilai
          </span>
          <span className="font-semibold text-tani-green">{progressPct}%</span>
        </div>

        {/* Auto-grade Recommendation Banner */}
        {autoGradeResult && (
          <Card className={`shadow-sm border-l-4 ${
            !autoGradeResult.isComplete
              ? 'border-l-gray-400 bg-gray-50'
              : autoGradeResult.isTolak
                ? 'border-l-red-500 bg-red-50'
                : 'border-l-emerald-500 bg-emerald-50'
          }`}>
            <CardContent className="p-4">
              {!autoGradeResult.isComplete ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Lengkapi semua parameter untuk rekomendasi grade otomatis</span>
                </div>
              ) : autoGradeResult.isTolak ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                    <ShieldX className="h-4 w-4 shrink-0" />
                    Rekomendasi: TOLAK
                  </div>
                  {autoGradeResult.wajibGagal.length > 0 && (
                    <p className="text-xs text-red-600 ml-6">
                      Parameter wajib gagal: {autoGradeResult.wajibGagal.join(', ')}
                    </p>
                  )}
                  {autoGradeResult.wajibGagal.length === 0 && (
                    <p className="text-xs text-red-600 ml-6">
                      {autoGradeResult.gagalNonWajibCount} parameter non-wajib gagal (melebihi batas toleransi)
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    Rekomendasi: {autoGradeResult.grade}
                  </div>
                  <p className="text-xs text-emerald-600 ml-6">
                    {autoGradeResult.gagalNonWajibCount} dari {autoGradeResult.totalNonWajib} parameter non-wajib gagal
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sections */}
        {form.sections.map((section) => {
          const isExpanded = expandedSections.has(section.id)
          const { filled, total } = getSectionProgress(section)
          const allDone = filled === total && total > 0

          return (
            <Card key={section.id} className="shadow-sm overflow-hidden">
              {/* Section header — clickable */}
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold leading-tight">
                      {section.id}. {section.title}
                    </h3>
                    {section.wajibLulusSemua && (
                      <span className="text-[10px] text-tani-amber font-medium">Wajib lulus semua</span>
                    )}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[10px] shrink-0 ml-2 ${
                    allDone ? 'bg-emerald-50 text-emerald-700' : ''
                  }`}
                >
                  {filled}/{total}
                </Badge>
              </button>

              {/* Section body */}
              {isExpanded && (
                <div className="border-t border-border">
                  {section.parameters.map((param, idx) => {
                    const result = results[param.no]
                    const isLulus = result?.lulus === true
                    const isGagal = result?.lulus === false
                    const hasCatatan = showCatatanFor.has(param.no) || (result?.catatan && result.catatan.length > 0)

                    return (
                      <div
                        key={param.no}
                        className={`px-4 py-3 ${idx > 0 ? 'border-t border-border/50' : ''}`}
                      >
                        {/* Parameter header */}
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                            {param.no}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium leading-tight">{param.parameter}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                              {param.kriteria}
                            </p>
                          </div>
                        </div>

                        {/* Lulus / Gagal buttons */}
                        <div className="flex items-center gap-2 mt-2 ml-7">
                          <button
                            type="button"
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                              isLulus
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-emerald-200 hover:text-emerald-600'
                            }`}
                            onClick={() => setParamResult(param.no, true)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Lulus
                          </button>
                          <button
                            type="button"
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                              isGagal
                                ? 'bg-red-50 border-red-300 text-red-700'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600'
                            }`}
                            onClick={() => setParamResult(param.no, false)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Gagal
                          </button>
                          <button
                            type="button"
                            className="text-[10px] text-muted-foreground hover:text-foreground ml-auto"
                            onClick={() => toggleCatatan(param.no)}
                          >
                            + Catatan
                          </button>
                        </div>

                        {/* Catatan input */}
                        {hasCatatan && (
                          <div className="mt-2 ml-7">
                            <Input
                              placeholder="Catatan inspektor..."
                              value={result?.catatan || ''}
                              onChange={(e) => setParamCatatan(param.no, e.target.value)}
                              className="text-xs h-8"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}

        <Separator />

        {/* Grade Determination */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-semibold">PENENTUAN GRADE AKHIR</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {form.grades.map((g) => {
              const isTolak = g.grade.toUpperCase().includes('TOLAK')
              const isSelected = gradePilihan === g.grade
              const isRecommended = autoGradeResult?.isComplete && autoGradeResult.grade === g.grade
              return (
                <button
                  key={g.grade}
                  type="button"
                  className={`w-full text-left rounded-lg p-3 border transition-all ${
                    isSelected
                      ? isTolak
                        ? 'border-red-300 bg-red-50'
                        : 'border-emerald-300 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setGradePilihan(g.grade)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? isTolak ? 'border-red-500' : 'border-emerald-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className={`h-2 w-2 rounded-full ${isTolak ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      )}
                    </div>
                    <span className={`text-xs font-semibold ${isTolak ? 'text-red-700' : ''}`}>
                      {g.grade}
                    </span>
                    {isRecommended && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-emerald-200">
                        Rekomendasi
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 ml-6">{g.kriteria}</p>
                  {g.toleransi !== '\u2014' && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 ml-6">
                      Toleransi: {g.toleransi}
                    </p>
                  )}
                </button>
              )
            })}

            {/* Override warning */}
            {isOverride && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Grade berbeda dari rekomendasi sistem
                </div>
                <p className="text-[11px] text-amber-600 mb-2">
                  Sistem merekomendasikan <strong>{autoGradeResult?.grade}</strong>, namun Anda memilih <strong>{gradePilihan}</strong>.
                  Mohon berikan alasan.
                </p>
                <Textarea
                  placeholder="Alasan memilih grade berbeda dari rekomendasi..."
                  value={gradeOverrideReason}
                  onChange={(e) => setGradeOverrideReason(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Documentation */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              Dokumentasi Foto (min. 3 foto)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {[
              { key: 'batch' as const, label: 'Tampilan keseluruhan batch', value: fotoBatch, set: setFotoBatch },
              { key: 'detail' as const, label: 'Detail kualitas / cacat (close-up)', value: fotoDetail, set: setFotoDetail },
              { key: 'timbangan' as const, label: 'Label timbangan / berat', value: fotoTimbangan, set: setFotoTimbangan },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={item.value}
                  onChange={(e) => item.set(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-tani-green"
                />
                <span className="text-xs">{item.label}</span>
              </label>
            ))}
            <p className="text-[10px] text-muted-foreground mt-1">
              Centang setelah foto diupload ke aplikasi TaniDirect
            </p>
          </CardContent>
        </Card>

        {/* Catatan Tambahan */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <Label className="text-xs font-semibold">Catatan Tambahan</Label>
            <Textarea
              placeholder="Catatan tambahan untuk inspeksi ini..."
              value={catatanTambahan}
              onChange={(e) => setCatatanTambahan(e.target.value)}
              rows={3}
              className="mt-1.5 text-xs"
            />
          </CardContent>
        </Card>

        {/* Score Preview */}
        {totalProgress.filled > 0 && (
          <Card className="shadow-sm bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground text-xs">Skor Kualitas</span>
                <span className="font-bold text-lg">{computeScore()}/100</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Dihitung dari: parameter lulus / total parameter &times; 100
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit info */}
        <div className="px-1">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3 shrink-0" />
            Setelah submit, hasil inspeksi akan dikirim ke supplier untuk ditinjau sebelum status final ditentukan.
          </p>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border p-3 lg:pl-64">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              doSaveDraft()
              router.push('/poktan/qa')
            }}
          >
            <Save className="h-4 w-4 mr-1" />
            Simpan Draft
          </Button>
          <Button
            className="flex-1 bg-tani-green hover:bg-tani-green/90 text-white"
            disabled={!canSubmit()}
            onClick={handleSubmit}
          >
            <Send className="h-4 w-4 mr-1" />
            Submit Inspeksi
          </Button>
        </div>
      </div>
    </div>
  )
}
