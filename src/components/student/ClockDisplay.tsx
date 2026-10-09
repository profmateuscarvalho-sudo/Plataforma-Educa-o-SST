import { useState, useEffect } from 'react'

export function ClockDisplay() {
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

  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  return (
    <div className="flex flex-col items-end">
      <span className="text-2xl font-mono font-bold text-foreground tabular-nums tracking-tight">
        {time}
      </span>
      <span className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5 font-sans font-medium">
        {capitalizedDate}
      </span>
    </div>
  )
}
