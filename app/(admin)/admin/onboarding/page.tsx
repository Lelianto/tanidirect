'use client'

import { useState, useMemo } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dummyOnboardingMilestones, dummyOnboardingChecklist } from '@/lib/dummy'
import { formatRupiah } from '@/lib/utils/currency'
import {
  Rocket, Target, CheckSquare, Wallet,
} from 'lucide-react'

export default function AdminOnboardingPage() {
  const [activeTab, setActiveTab] = useState('1')

  const phaseConfig = [
    { phase: 1, label: 'Fase 1 Seeded (Hari 1-30)', budget: 150000000, budgetLabel: 'Allocated' },
    { phase: 2, label: 'Fase 2 Earned (31-60)', budget: 200000000, budgetLabel: 'Planned' },
    { phase: 3, label: 'Fase 3 Network (61-90)', budget: 300000000, budgetLabel: 'Projected' },
  ]

  const milestonesByPhase = (phase: number) =>
    dummyOnboardingMilestones.filter((m) => m.phase === phase)

  const checklistByKategori = useMemo(() => {
    const grouped: Record<string, typeof dummyOnboardingChecklist> = {}
    dummyOnboardingChecklist.forEach((item) => {
      if (!grouped[item.kategori]) grouped[item.kategori] = []
      grouped[item.kategori].push(item)
    })
    return grouped
  }, [])

  const totalMilestones = dummyOnboardingMilestones.length
  const tercapai = dummyOnboardingMilestones.filter((m) => m.status === 'tercapai').length
  const inProgress = dummyOnboardingMilestones.filter((m) => m.status === 'in_progress').length
  const checklistDone = dummyOnboardingChecklist.filter((c) => c.is_done).length

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Onboarding Tracker" />

      <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
        {/* StatCards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Milestones"
            value={String(totalMilestones)}
            icon={<Target className="h-5 w-5" />}
          />
          <StatCard
            title="Tercapai"
            value={String(tercapai)}
            icon={<CheckSquare className="h-5 w-5" />}
          />
          <StatCard
            title="Berjalan"
            value={String(inProgress)}
            icon={<Rocket className="h-5 w-5" />}
          />
          <StatCard
            title="Checklist Selesai"
            value={`${checklistDone}/${dummyOnboardingChecklist.length}`}
            icon={<CheckSquare className="h-5 w-5" />}
          />
        </div>

        {/* Phase Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="1" className="text-xs sm:text-sm">
              <Rocket className="h-3.5 w-3.5 mr-1" />
              Fase 1 Seeded
            </TabsTrigger>
            <TabsTrigger value="2" className="text-xs sm:text-sm">
              <Target className="h-3.5 w-3.5 mr-1" />
              Fase 2 Earned
            </TabsTrigger>
            <TabsTrigger value="3" className="text-xs sm:text-sm">
              <Wallet className="h-3.5 w-3.5 mr-1" />
              Fase 3 Network
            </TabsTrigger>
          </TabsList>

          {[1, 2, 3].map((phase) => (
            <TabsContent key={phase} value={String(phase)} className="space-y-3 mt-4">
              {milestonesByPhase(phase).map((milestone) => {
                const pct = Math.min(100, Math.round((milestone.current / milestone.target) * 100))
                return (
                  <Card key={milestone.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                            {milestone.nama}
                          </p>
                          <p className="text-xs text-muted-foreground">{milestone.deskripsi}</p>
                        </div>
                        <StatusBadge status={milestone.status} />
                      </div>

                      <div className="mb-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-tani-green h-2 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{milestone.current}/{milestone.target} {milestone.unit}</span>
                        <span>{pct}%</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {milestonesByPhase(phase).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada milestone untuk fase ini</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Pre-launch Checklist */}
        <div>
          <h3 className="font-semibold text-sm font-[family-name:var(--font-heading)] mb-3 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-tani-green" />
            Pre-launch Checklist
          </h3>
          <div className="space-y-4">
            {Object.entries(checklistByKategori).map(([kategori, items]) => (
              <Card key={kategori} className="shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{kategori}</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          item.is_done
                            ? 'bg-tani-green border-tani-green text-white'
                            : 'border-gray-300'
                        }`}>
                          {item.is_done && <CheckSquare className="h-3 w-3" />}
                        </div>
                        <span className={`text-sm ${item.is_done ? 'line-through text-muted-foreground' : ''}`}>
                          {item.item}
                        </span>
                        {item.pic && (
                          <span className="text-xs text-muted-foreground ml-auto">{item.pic}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Budget Summary */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm font-[family-name:var(--font-heading)] mb-3 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-tani-green" />
              Budget Summary
            </h3>
            <div className="space-y-3">
              {phaseConfig.map((phase) => (
                <div key={phase.phase} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{phase.label}</p>
                    <p className="text-xs text-muted-foreground">{phase.budgetLabel}</p>
                  </div>
                  <p className="text-sm font-bold font-[family-name:var(--font-heading)]">
                    {formatRupiah(phase.budget)}
                  </p>
                </div>
              ))}
              <div className="border-t pt-3 flex items-center justify-between">
                <p className="text-sm font-bold">Total</p>
                <p className="text-sm font-bold font-[family-name:var(--font-heading)] text-tani-green">
                  {formatRupiah(650000000)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
