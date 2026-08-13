import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { trackAccess, type AccessArea } from '@/services/access_events'

/**
 * Registra uma visita (page_view) a uma área da plataforma sempre que o
 * componente monta e o usuário está autenticado. Usa uma ref para garantir
 * que o mesmo componente não dispare duas vezes em desenvolvimento strict
 * mode sem inflar artificialmente as métricas em produção.
 */
export function useTrackAccess(area: AccessArea, deps: unknown[] = []) {
  const { user } = useAuth()
  const recorded = useRef(false)

  useEffect(() => {
    if (!user) return
    if (recorded.current) return
    recorded.current = true
    trackAccess(area, 'page_view')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, area, ...deps])

  // Permite re-armar o flag quando a área muda
  useEffect(() => {
    recorded.current = false
  }, [area])
}
