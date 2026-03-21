'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
}

export function StatCard({ title, value, subtitle, icon, trend, trendValue }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-xl font-bold font-[family-name:var(--font-heading)] truncate">{value}</p>
            {(subtitle || trendValue) && (
              <div className="flex items-center gap-1">
                {trend && (
                  <span className={`flex items-center text-xs font-medium ${
                    trend === 'up' ? 'text-tani-green' :
                    trend === 'down' ? 'text-tani-red' :
                    'text-muted-foreground'
                  }`}>
                    {trend === 'up' && <TrendingUp className="h-3 w-3 mr-0.5" />}
                    {trend === 'down' && <TrendingDown className="h-3 w-3 mr-0.5" />}
                    {trend === 'flat' && <Minus className="h-3 w-3 mr-0.5" />}
                    {trendValue}
                  </span>
                )}
                {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-tani-green/10 text-tani-green shrink-0">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
