import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export function ClockDate() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const time = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  return (
    <div className="flex items-center gap-3">
      <Clock className="w-5 h-5 text-yellow-400" />
      <div className="flex flex-col">
        <span className="text-lg font-mono font-semibold text-white tabular-nums">{time}</span>
        <span className="text-xs text-slate-400">{formattedDate}</span>
      </div>
    </div>
  )
}
