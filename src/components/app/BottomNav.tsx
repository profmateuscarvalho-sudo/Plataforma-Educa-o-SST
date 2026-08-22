import { NavLink } from 'react-router-dom'
import { Home, BookOpen, LayoutGrid, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: typeof Home
}

const ITEMS: NavItem[] = [
  { to: '/app', label: 'Início', icon: Home },
  { to: '/app/estudar', label: 'Estudar', icon: BookOpen },
  { to: '/app/cases', label: 'Cases', icon: LayoutGrid },
  { to: '/app/perfil', label: 'Perfil', icon: User },
]

/**
 * Fixed bottom navigation for the /app route. 74px tall, page background with
 * backdrop blur. Active item gets an amber-wash pill behind the icon, the icon
 * rises 3px and the label turns the primary ink color.
 */
export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[70] w-full"
      style={{ maxWidth: 440 }}
      aria-label="Navegação do app"
    >
      <div
        className="flex items-stretch justify-around px-2"
        style={{
          height: 74,
          backgroundColor: 'rgba(250, 248, 243, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--sst-line)',
        }}
      >
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/app'} className="block">
            {({ isActive }) => (
              <div
                className="sst-tap flex flex-col items-center justify-center gap-1 h-full px-3"
                style={{ minWidth: 64 }}
              >
                <div className="relative flex items-center justify-center" style={{ height: 26 }}>
                  <span
                    className="absolute inset-0 sst-pill"
                    style={{
                      backgroundColor: isActive ? 'var(--sst-amber-wash)' : 'transparent',
                    }}
                  />
                  <Icon
                    className="relative"
                    style={{
                      width: 22,
                      height: 22,
                      transform: isActive ? 'translateY(-3px)' : 'none',
                      color: isActive ? 'var(--sst-text)' : 'var(--sst-text-2)',
                      strokeWidth: 1.75,
                      transition: 'transform 260ms var(--sst-ease), color 260ms var(--sst-ease)',
                    }}
                  />
                </div>
                <span
                  className="sst-label"
                  style={{
                    fontSize: 9.5,
                    letterSpacing: '0.08em',
                    color: isActive ? 'var(--sst-text)' : 'var(--sst-text-2)',
                    transition: 'color 260ms var(--sst-ease)',
                  }}
                >
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
