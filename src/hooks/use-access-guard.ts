import { useNavigate } from 'react-router-dom'
import { useStudentAccess, type PlanTier } from '@/hooks/use-student-access'

export function useAccessGuard() {
  const { activeTier, canAccess } = useStudentAccess()
  const navigate = useNavigate()

  const requireAccess = (requiredTier: PlanTier): boolean => {
    if (canAccess(requiredTier)) return true
    navigate('/planos')
    return false
  }

  return { requireAccess, activeTier, canAccess }
}
