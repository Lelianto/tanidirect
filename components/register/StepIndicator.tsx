'use client'

import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'

interface Step {
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  current: number
  className?: string
}

function StepIndicator({ steps, current, className }: StepIndicatorProps) {
  return (
    <div className={cn('flex items-start', className)}>
      {steps.map((step, i) => {
        const isCompleted = i < current
        const isActive = i === current
        const isLast = i === steps.length - 1

        return (
          <div key={i} className={cn('flex items-start', isLast ? 'shrink-0' : 'flex-1')}>
            {/* Circle + label */}
            <div className="flex flex-col items-center gap-1 shrink-0 w-10">
              <div
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all',
                  isCompleted && 'bg-tani-green text-white',
                  isActive && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                  !isCompleted && !isActive && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <CheckIcon className="size-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] text-center leading-tight',
                  isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {/* Line connector */}
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 rounded-full mt-3.5 -translate-y-1/2',
                  isCompleted ? 'bg-tani-green' : 'bg-muted'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export { StepIndicator }
