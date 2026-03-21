'use client'

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className || ''}`}>
      <div className="h-8 w-8 rounded-full border-3 border-muted border-t-tani-green animate-spin" />
    </div>
  )
}
