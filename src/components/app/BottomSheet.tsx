import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Optional max height as a viewport percentage (default 0.9). */
  maxHeight?: number
}

/**
 * Mobile bottom sheet used across the /app route. Slides up from the bottom
 * with a spring animation, a grey drag handle, and a clickable backdrop.
 */
export function BottomSheet({ open, onClose, children, maxHeight = 0.9 }: BottomSheetProps) {
  const [leaving, setLeaving] = useState(false)

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleClose = () => {
    setLeaving(true)
    window.setTimeout(() => {
      setLeaving(false)
      onClose()
    }, 280)
  }

  if (!open && !leaving) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        style={{ animation: leaving ? 'none' : 'sst-sheet-fade-in 200ms ease-out forwards' }}
      />
      <div
        className={cn(
          'relative w-full bg-white shadow-2xl',
          leaving ? 'sst-sheet-leave' : 'sst-sheet-enter',
        )}
        style={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: `${maxHeight * 100}dvh`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <span
            className="block rounded-full"
            style={{ width: 36, height: 4, backgroundColor: '#d9d4c5' }}
          />
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-8 pt-2">{children}</div>
      </div>
      <style>{`@keyframes sst-sheet-fade-in{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  )
}
