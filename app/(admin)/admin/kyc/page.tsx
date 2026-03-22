'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { dummyKYCSubmissions, dummyUsers } from '@/lib/dummy'
import { formatTanggal } from '@/lib/utils/date'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import type { KYCSubmission } from '@/types'
import {
  ShieldCheck, FileText, Clock, CheckCircle2, XCircle, AlertTriangle,
  ImageIcon, Loader2, Eye,
} from 'lucide-react'

interface KYCQueueItem {
  id: string
  user_id: string
  user_nama: string
  user_role: string
  user_email?: string
  kyc_status: string
  kyc_submitted_at: string
  kyc_reviewer_notes?: string
  docs: { doc_type: string; file_path: string; status: string }[]
  days_waiting: number
}

export default function AdminKYCPage() {
  const adminUser = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState('antrian')
  const [selectedItem, setSelectedItem] = useState<KYCQueueItem | null>(null)
  const [catatan, setCatatan] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<'approve' | 'reject' | 'revision' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [docImages, setDocImages] = useState<Record<string, string>>({})
  const [loadingImages, setLoadingImages] = useState(false)

  // Demo data — in production, this would be fetched from Supabase
  const queueItems: KYCQueueItem[] = useMemo(() => {
    return dummyKYCSubmissions
      .filter((s) => s.status === 'pending' || s.status === 'revisi')
      .map((s) => ({
        id: s.id,
        user_id: s.user_id,
        user_nama: s.user_nama,
        user_role: s.user_role,
        kyc_status: s.status === 'pending' ? 'docs_submitted' : 'docs_revision',
        kyc_submitted_at: s.submitted_at,
        kyc_reviewer_notes: s.reviewer_catatan,
        docs: s.documents.map((d) => ({
          doc_type: d.nama.toLowerCase().includes('ktp') ? 'ktp' : 'selfie',
          file_path: `${s.user_id}/${d.nama.toLowerCase().includes('ktp') ? 'ktp' : 'selfie'}_demo.jpg`,
          status: d.status,
        })),
        days_waiting: Math.floor(
          (Date.now() - new Date(s.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }))
      .sort((a, b) => b.days_waiting - a.days_waiting)
  }, [])

  const auditLog = useMemo(() => {
    return dummyKYCSubmissions
      .filter((s) => s.status === 'approved' || s.status === 'rejected')
      .map((s) => ({
        id: s.id,
        user_nama: s.user_nama,
        user_role: s.user_role,
        action: s.status === 'approved' ? 'kyc_approve' : 'kyc_reject',
        admin: 'Admin Platform',
        catatan: s.reviewer_catatan || '-',
        created_at: s.reviewed_at || s.submitted_at,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [])

  const pendingCount = queueItems.filter((i) => i.kyc_status === 'docs_submitted').length
  const urgentCount = queueItems.filter((i) => i.days_waiting > 3).length

  const loadSignedUrls = useCallback(async (item: KYCQueueItem) => {
    setLoadingImages(true)
    const images: Record<string, string> = {}

    for (const doc of item.docs) {
      try {
        const res = await fetch(`/api/kyc/signed-url?path=${encodeURIComponent(doc.file_path)}`)
        if (res.ok) {
          const { signedUrl } = await res.json()
          images[doc.doc_type] = signedUrl
        }
      } catch {
        // Signed URL failed — will show placeholder
      }
    }

    setDocImages(images)
    setLoadingImages(false)
  }, [])

  function handleSelectItem(item: KYCQueueItem) {
    setSelectedItem(item)
    setCatatan('')
    setConfirmDialog(null)
    loadSignedUrls(item)
  }

  async function handleAction(action: 'approve' | 'reject' | 'revision') {
    if (!selectedItem) return
    if ((action === 'reject' || action === 'revision') && !catatan) {
      toast.error('Catatan wajib diisi untuk reject dan revision')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/kyc/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedItem.user_id,
          action,
          notes: catatan || undefined,
          adminId: adminUser?.id,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal submit review')
      }

      const actionLabel = action === 'approve' ? 'disetujui' : action === 'reject' ? 'ditolak' : 'diminta revisi'
      toast.success(`KYC ${selectedItem.user_nama} telah ${actionLabel}`)
      setSelectedItem(null)
      setConfirmDialog(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="KYC Review" />

      <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
        {/* StatCards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Antrian Review"
            value={String(queueItems.length)}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatCard
            title="Menunggu > 3 Hari"
            value={String(urgentCount)}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <StatCard
            title="Approved Hari Ini"
            value={String(auditLog.filter((l) => l.action === 'kyc_approve').length)}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            title="Rejected"
            value={String(auditLog.filter((l) => l.action === 'kyc_reject').length)}
            icon={<XCircle className="h-5 w-5" />}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="antrian" className="text-xs sm:text-sm">
              Antrian Review
              {queueItems.length > 0 && (
                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-tani-amber text-[10px] font-bold text-white">
                  {queueItems.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm">
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* Tab: Antrian Review */}
          <TabsContent value="antrian" className="mt-4">
            <div className="grid lg:grid-cols-5 gap-4">
              {/* Left — Queue list */}
              <div className="lg:col-span-2 space-y-3">
                {queueItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Tidak ada submission yang menunggu review</p>
                  </div>
                ) : (
                  queueItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`shadow-sm cursor-pointer transition-all hover:shadow-md ${
                        selectedItem?.id === item.id ? 'ring-2 ring-tani-green' : ''
                      }`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                              {item.user_nama}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <StatusBadge status={item.user_role} />
                              <span className="text-xs text-muted-foreground">
                                {formatTanggal(item.kyc_submitted_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {item.days_waiting > 3 && (
                              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                URGENT
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {item.days_waiting}h
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {item.docs.map((d) => (
                            <span
                              key={d.doc_type}
                              className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                            >
                              {d.doc_type.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Right — Detail panel */}
              <div className="lg:col-span-3">
                {selectedItem ? (
                  <Card className="shadow-sm">
                    <CardContent className="p-4 space-y-4">
                      {/* User info */}
                      <div>
                        <h3 className="font-semibold text-base font-[family-name:var(--font-heading)]">
                          {selectedItem.user_nama}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={selectedItem.user_role} />
                          <span className="text-xs text-muted-foreground">
                            Diajukan: {formatTanggal(selectedItem.kyc_submitted_at)}
                          </span>
                          {selectedItem.days_waiting > 3 && (
                            <span className="text-xs font-bold text-red-600">
                              {selectedItem.days_waiting} hari menunggu
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Document Images */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Dokumen</p>
                        {loadingImages ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {['ktp', 'selfie'].map((docType) => (
                              <div key={docType} className="space-y-1">
                                <p className="text-xs font-medium capitalize">{docType === 'ktp' ? 'Foto KTP' : 'Selfie + KTP'}</p>
                                <div className="aspect-[4/3] bg-gray-100 rounded-lg border overflow-hidden flex items-center justify-center">
                                  {docImages[docType] ? (
                                    <img
                                      src={docImages[docType]}
                                      alt={docType}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="text-center text-muted-foreground">
                                      <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                                      <p className="text-[10px]">Foto {docType.toUpperCase()}</p>
                                      <p className="text-[9px]">(demo — tidak ada file)</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reviewer notes from previous revision */}
                      {selectedItem.kyc_reviewer_notes && (
                        <div className="p-2 bg-amber-50 rounded text-xs text-amber-800">
                          <strong>Catatan sebelumnya:</strong> {selectedItem.kyc_reviewer_notes}
                        </div>
                      )}

                      {/* Reviewer catatan input */}
                      <div className="space-y-2">
                        <Label htmlFor="catatan">Catatan Reviewer</Label>
                        <Textarea
                          id="catatan"
                          placeholder="Tuliskan catatan review... (wajib untuk reject & revision)"
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          rows={3}
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAction('approve')}
                          disabled={submitting}
                        >
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={() => {
                            if (!catatan) {
                              toast.error('Catatan wajib diisi untuk minta revisi')
                              return
                            }
                            handleAction('revision')
                          }}
                          disabled={submitting}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Revisi
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (!catatan) {
                              toast.error('Catatan wajib diisi untuk menolak')
                              return
                            }
                            setConfirmDialog('reject')
                          }}
                          disabled={submitting}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Eye className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Pilih submission dari daftar untuk mereview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Audit Log */}
          <TabsContent value="audit" className="mt-4">
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left px-4 py-2 font-medium text-xs">Tanggal</th>
                        <th className="text-left px-4 py-2 font-medium text-xs">Nama User</th>
                        <th className="text-left px-4 py-2 font-medium text-xs">Role</th>
                        <th className="text-left px-4 py-2 font-medium text-xs">Action</th>
                        <th className="text-left px-4 py-2 font-medium text-xs">Admin</th>
                        <th className="text-left px-4 py-2 font-medium text-xs">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map((log) => (
                        <tr key={log.id} className="border-b last:border-0">
                          <td className="px-4 py-2 text-xs text-muted-foreground">
                            {formatTanggal(log.created_at)}
                          </td>
                          <td className="px-4 py-2 text-xs font-medium">{log.user_nama}</td>
                          <td className="px-4 py-2">
                            <StatusBadge status={log.user_role} />
                          </td>
                          <td className="px-4 py-2">
                            <StatusBadge status={log.action === 'kyc_approve' ? 'approved' : 'rejected'} />
                          </td>
                          <td className="px-4 py-2 text-xs">{log.admin}</td>
                          <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                            {log.catatan}
                          </td>
                        </tr>
                      ))}
                      {auditLog.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                            Belum ada audit log
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm Reject Dialog */}
      <Dialog open={confirmDialog === 'reject'} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-700">Konfirmasi Penolakan</DialogTitle>
            <DialogDescription>
              Yakin ingin menolak KYC {selectedItem?.user_nama}? Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleAction('reject')}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Ya, Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
