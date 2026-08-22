import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

/**
 * Floating AI agent button for the /app route. Sits above the bottom nav,
 * bottom-right. 54×54px, dark ink background, amber sparkle icon, green dot
 * indicating the agent is available.
 *
 * The full chat lives on the existing AgentChatWidget route — tapping this
 * button routes the user to the platform where the chat is already wired.
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
      className="sst-tap fixed right-5 z-[75] flex items-center justify-center"
      style={{
        bottom: 86, // above the 74px nav + a little gap
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: 'var(--sst-text)',
        transform: pressed ? 'scale(0.97)' : 'none',
        boxShadow: '0 8px 20px rgba(21, 23, 15, 0.18)',
      }}
    >
      <Sparkles style={{ width: 24, height: 24, color: 'var(--sst-amber)' }} strokeWidth={1.75} />
      <span
        className="sst-live-dot absolute"
        style={{
          top: -2,
          right: -2,
          width: 12,
          height: 12,
          borderRadius: 999,
          backgroundColor: 'var(--sst-green)',
          border: '2px solid var(--sst-page)',
        }}
      />
    </button>
  )
}
