import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

/**
 * Floating AI agent button for the /app route. Sits 48px above the 74px bottom nav (bottom: 122px),
 * bottom-right. 48×48px (w-12 h-12), bg-primary / dark ink with amber sparkle icon,
 * and green dot indicating the agent is available.
 */
export function AIFloatingButton() {
  const navigate = useNavigate()
  const [pressed, setPressed] = useState(false)

  return (
    <button
      type="button"
      aria-label="Agente de IA"
      onClick={() => navigate('/plataforma')}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="sst-tap fixed right-5 z-[75] flex items-center justify-center rounded-2xl border-2 border-background shadow-[0_8px_20px_rgba(21,23,15,0.18)] transition-transform"
      style={{
        bottom: 122, // 74px (BottomNav) + 48px gap
        width: 48,
        height: 48,
        backgroundColor: 'var(--sst-text)',
        transform: pressed ? 'scale(0.95)' : 'none',
      }}
    >
      <Sparkles style={{ width: 22, height: 22, color: 'var(--sst-amber)' }} strokeWidth={1.75} />
      <span
        className="sst-live-dot absolute"
        style={{
          top: -2,
          right: -2,
          width: 10,
          height: 10,
          borderRadius: 999,
          backgroundColor: 'var(--sst-green)',
          border: '2px solid var(--sst-page)',
        }}
      />
    </button>
  )
}
