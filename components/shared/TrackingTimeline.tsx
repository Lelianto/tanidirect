'use client'

import { CheckCircle2, Circle, Clock } from 'lucide-react'

interface TrackingStep {
  label: string
  status: 'done' | 'active' | 'pending'
  waktu?: string
}

interface TrackingTimelineProps {
  steps: TrackingStep[]
}

export function TrackingTimeline({ steps }: TrackingTimelineProps) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-3">
          {/* Indicator column */}
          <div className="flex flex-col items-center">
            {step.status === 'done' && (
              <CheckCircle2 size={20} className="text-green-600 shrink-0" />
            )}
            {step.status === 'active' && (
              <div className="relative">
                <Circle size={20} className="text-blue-600 fill-blue-600 shrink-0" />
                <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-50" />
              </div>
            )}
            {step.status === 'pending' && (
              <Circle size={20} className="text-gray-300 shrink-0" />
            )}
            {/* Vertical line */}
            {index < steps.length - 1 && (
              <div
                className={`w-0.5 flex-1 min-h-6 ${
                  step.status === 'done' ? 'bg-green-300' : 'bg-gray-200'
                }`}
              />
            )}
          </div>

          {/* Content */}
          <div className="pb-6">
            <p
              className={`text-sm font-medium ${
                step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
              }`}
            >
              {step.label}
            </p>
            {step.waktu && (
              <div className="flex items-center gap-1 mt-0.5">
                <Clock size={12} className="text-gray-400" />
                <span className="text-xs text-gray-500">{step.waktu}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
