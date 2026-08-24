import { useEffect, useState } from 'react'
import { Hourglass } from 'lucide-react'

interface AgoraCountdownProps {
  dataTermino: string
  status?: string
  className?: string
  compact?: boolean
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

function calculateTime(dataTermino: string): TimeRemaining {
  const target = new Date(dataTermino).getTime()
  const now = new Date().getTime()
  const diff = target - now

  if (isNaN(target) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, isExpired: false }
}

export function AgoraCountdown({
  dataTermino,
  status,
  className = '',
  compact = false,
}: AgoraCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() => calculateTime(dataTermino))

  useEffect(() => {
    setTimeLeft(calculateTime(dataTermino))
    const timer = setInterval(() => {
      setTimeLeft(calculateTime(dataTermino))
    }, 1000)
    return () => clearInterval(timer)
  }, [dataTermino])

  const isClosed = status === 'encerrado' || timeLeft.isExpired

  if (isClosed) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200/80 text-slate-700 border border-slate-300 ${className}`}
      >
        <Hourglass className="w-3.5 h-3.5 text-slate-500" />
        <span>Debate encerrado</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C17A4E]/10 text-[#C17A4E] border border-[#C17A4E]/30 ${className}`}
      >
        <Hourglass
          className="w-3.5 h-3.5 text-[#C17A4E] animate-spin"
          style={{ animationDuration: '6s' }}
        />
        <span>
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
          {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m
          restantes
        </span>
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FAF8F3] to-[#F3EEE3] border border-[#C17A4E]/25 shadow-sm text-slate-800 ${className}`}
    >
      <div className="w-8 h-8 rounded-lg bg-[#C17A4E]/15 flex items-center justify-center shrink-0">
        <Hourglass className="w-4 h-4 text-[#C17A4E] animate-pulse" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C17A4E]">
          Tempo Restante
        </span>
        <div className="flex items-baseline gap-1 font-mono text-sm font-bold text-slate-900">
          {timeLeft.days > 0 && (
            <span>
              {timeLeft.days}
              <span className="text-xs font-sans text-slate-500 mr-1">d</span>
            </span>
          )}
          <span>
            {String(timeLeft.hours).padStart(2, '0')}
            <span className="text-xs font-sans text-slate-500 mr-1">h</span>
          </span>
          <span>
            {String(timeLeft.minutes).padStart(2, '0')}
            <span className="text-xs font-sans text-slate-500 mr-1">m</span>
          </span>
          <span className="text-xs text-[#C17A4E]">
            {String(timeLeft.seconds).padStart(2, '0')}
            <span className="text-[10px] font-sans text-slate-500">s</span>
          </span>
        </div>
      </div>
    </div>
  )
}
