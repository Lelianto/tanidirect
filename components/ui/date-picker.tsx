'use client'

import * as React from 'react'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// ============ HELPERS ============
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isToday(date: Date) {
  return isSameDay(date, new Date())
}

function isPastDate(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const check = new Date(date)
  check.setHours(0, 0, 0, 0)
  return check < today
}

function formatDateID(date: Date) {
  return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`
}

// ============ CALENDAR ============
interface CalendarProps {
  value?: Date | null
  onChange?: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  disablePast?: boolean
  className?: string
}

function Calendar({ value, onChange, minDate, maxDate, disablePast = false, className }: CalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = React.useState(value?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = React.useState(value?.getMonth() ?? today.getMonth())
  const [showYearPicker, setShowYearPicker] = React.useState(false)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  function isDisabled(day: number) {
    const date = new Date(viewYear, viewMonth, day)
    if (disablePast && isPastDate(date)) return true
    if (minDate) {
      const min = new Date(minDate)
      min.setHours(0, 0, 0, 0)
      if (date < min) return true
    }
    if (maxDate) {
      const max = new Date(maxDate)
      max.setHours(0, 0, 0, 0)
      if (date > max) return true
    }
    return false
  }

  function handleSelectDay(day: number) {
    if (isDisabled(day)) return
    onChange?.(new Date(viewYear, viewMonth, day))
  }

  // Year picker
  const yearStart = Math.floor(viewYear / 12) * 12
  const years = Array.from({ length: 12 }, (_, i) => yearStart + i)

  if (showYearPicker) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setViewYear(yearStart - 12)}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-medium">
            {yearStart} — {yearStart + 11}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setViewYear(yearStart + 12)}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              className={cn(
                'h-9 rounded-lg text-sm transition-colors hover:bg-accent',
                y === viewYear && 'bg-primary text-primary-foreground hover:bg-primary/90',
                y === today.getFullYear() && y !== viewYear && 'text-primary font-semibold'
              )}
              onClick={() => {
                setViewYear(y)
                setShowYearPicker(false)
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
          <ChevronLeftIcon className="size-4" />
        </Button>
        <button
          type="button"
          className="text-sm font-medium hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-accent"
          onClick={() => setShowYearPicker(true)}
        >
          {BULAN[viewMonth]} {viewYear}
        </button>
        <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {HARI.map((h) => (
          <div
            key={h}
            className="text-center text-[11px] font-medium text-muted-foreground py-1"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const date = new Date(viewYear, viewMonth, day)
          const selected = value ? isSameDay(date, value) : false
          const todayMark = isToday(date)
          const disabled = isDisabled(day)

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              className={cn(
                'relative h-9 w-full rounded-lg text-sm transition-all',
                'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                selected && 'bg-primary text-primary-foreground hover:bg-primary/90 font-semibold',
                todayMark && !selected && 'font-semibold text-primary',
                disabled && 'opacity-30 pointer-events-none line-through'
              )}
              onClick={() => handleSelectDay(day)}
            >
              {day}
              {todayMark && !selected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>

      {/* Today shortcut */}
      <div className="mt-2 flex justify-center">
        <button
          type="button"
          className="text-xs text-primary hover:underline"
          onClick={() => {
            const now = new Date()
            setViewYear(now.getFullYear())
            setViewMonth(now.getMonth())
            onChange?.(now)
          }}
        >
          Hari ini
        </button>
      </div>
    </div>
  )
}

// ============ DATE PICKER ============
interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  disablePast?: boolean
  disabled?: boolean
  className?: string
  error?: boolean
}

function DatePicker({
  value,
  onChange,
  placeholder = 'Pilih tanggal',
  minDate,
  maxDate,
  disablePast = false,
  disabled,
  className,
  error,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors',
          'hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:pointer-events-none disabled:opacity-50',
          error && 'border-destructive ring-3 ring-destructive/20',
          !value && 'text-muted-foreground',
          className
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left truncate">
          {value ? formatDateID(value) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <Calendar
          value={value}
          onChange={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          minDate={minDate}
          maxDate={maxDate}
          disablePast={disablePast}
        />
      </PopoverContent>
    </Popover>
  )
}

// ============ DATE TIME PICKER ============
interface DateTimePickerProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  disablePast?: boolean
  disabled?: boolean
  className?: string
  error?: boolean
}

function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pilih tanggal & waktu',
  minDate,
  maxDate,
  disablePast = false,
  disabled,
  className,
  error,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(value ?? null)
  const [hour, setHour] = React.useState(value ? String(value.getHours()).padStart(2, '0') : '08')
  const [minute, setMinute] = React.useState(value ? String(value.getMinutes()).padStart(2, '0') : '00')

  // Sync when value prop changes
  React.useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setHour(String(value.getHours()).padStart(2, '0'))
      setMinute(String(value.getMinutes()).padStart(2, '0'))
    }
  }, [value])

  function handleDateSelect(date: Date) {
    setSelectedDate(date)
  }

  function handleConfirm() {
    if (!selectedDate) return
    const result = new Date(selectedDate)
    result.setHours(parseInt(hour), parseInt(minute), 0, 0)

    // Check if resulting datetime is in the past
    if (disablePast && result < new Date()) return

    onChange?.(result)
    setOpen(false)
  }

  function isTimeInPast(h: number, m: number) {
    if (!disablePast || !selectedDate) return false
    if (!isToday(selectedDate)) return false
    const now = new Date()
    return h < now.getHours() || (h === now.getHours() && m < now.getMinutes())
  }

  function formatDateTimeID(date: Date) {
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    return `${formatDateID(date)}, ${h}:${m}`
  }

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors',
          'hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:pointer-events-none disabled:opacity-50',
          error && 'border-destructive ring-3 ring-destructive/20',
          !value && 'text-muted-foreground',
          className
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left truncate">
          {value ? formatDateTimeID(value) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <Calendar
          value={selectedDate}
          onChange={handleDateSelect}
          minDate={minDate}
          maxDate={maxDate}
          disablePast={disablePast}
        />

        {/* Time picker */}
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">Waktu</p>
          <div className="flex items-center gap-2">
            {/* Hour */}
            <div className="flex-1">
              <div className="h-28 overflow-y-auto rounded-lg border scrollbar-thin">
                {hours.map((h) => {
                  const disabled = isTimeInPast(parseInt(h), parseInt(minute))
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={disabled}
                      className={cn(
                        'w-full py-1.5 text-center text-sm transition-colors hover:bg-accent',
                        hour === h && 'bg-primary text-primary-foreground hover:bg-primary/90 font-medium',
                        disabled && 'opacity-30 pointer-events-none'
                      )}
                      onClick={() => setHour(h)}
                    >
                      {h}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1">Jam</p>
            </div>

            <span className="text-lg font-bold text-muted-foreground">:</span>

            {/* Minute */}
            <div className="flex-1">
              <div className="h-28 overflow-y-auto rounded-lg border scrollbar-thin">
                {minutes.map((m) => {
                  const disabled = isTimeInPast(parseInt(hour), parseInt(m))
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={disabled}
                      className={cn(
                        'w-full py-1.5 text-center text-sm transition-colors hover:bg-accent',
                        minute === m && 'bg-primary text-primary-foreground hover:bg-primary/90 font-medium',
                        disabled && 'opacity-30 pointer-events-none'
                      )}
                      onClick={() => setMinute(m)}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1">Menit</p>
            </div>
          </div>
        </div>

        {/* Confirm button */}
        <Button
          className="w-full mt-3"
          disabled={!selectedDate}
          onClick={handleConfirm}
        >
          {selectedDate
            ? `Pilih ${formatDateID(selectedDate)}, ${hour}:${minute}`
            : 'Pilih tanggal dulu'}
        </Button>
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, DateTimePicker, Calendar, formatDateID }
