import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getStudentAccessData,
  subscribeStudentAccess,
  type StudentAccessData,
} from '@/lib/student-access-store'
import { Payment } from '@/types'
import {
  effectiveTier,
  canAccessCourse as courseAccess,
  canAccessMagazine as magazineAccess,
  canAccessLive as liveAccess,
  canAccessDocumentary as documentaryAccess,
  hasMentorshipDiscount as mentorshipDiscountFor,
  tierAllows,
  type AccessTier,
  type PlanTier,
} from '@/lib/plan-access'
import type { Subscription } from '@/services/subscriptions'

export type { AccessTier, PlanTier }

// Reexporta a lógica pura para que as telas continuem importando tudo daqui.
export { MENTORSHIP_DISCOUNT, mentorshipDiscountedPrice, tierAllows } from '@/lib/plan-access'

export type AccessStatus = 'free' | 'owned' | 'subscriber' | 'locked'

export interface CourseAccessItem {
  id?: string
  is_free?: boolean
}

/**
 * Centraliza o tier efetivo do aluno e a matriz de acesso por área.
 * A lógica pura vive em src/lib/plan-access.ts (testada em plan-access.test.ts);
 * aqui ela é alimentada pelo STORE COMPARTILHADO (src/lib/student-access-store.ts):
 * os dados (payments + subscriptions) são buscados UMA vez e reutilizados por
 * todos os componentes da página — sem N+1 por card/item de lista.
 */
export function useStudentAccess() {
  const { user } = useAuth()
  const userId = user?.id

  const [data, setData] = useState<StudentAccessData | null>(null)
  const [loading, setLoading] = useState(!!userId)

  useEffect(() => {
    if (!userId) {
      setData(null)
      setLoading(false)
      return
    }
    let vivo = true
    setLoading(true)
    getStudentAccessData(userId)
      .then((d) => vivo && setData(d))
      .catch(() => vivo && setData({ payments: [], subscriptions: [] }))
      .finally(() => vivo && setLoading(false))
    // Invalidação externa (compra confirmada): recarrega do servidor.
    const unsub = subscribeStudentAccess((changedUserId) => {
      if (changedUserId !== userId) return
      getStudentAccessData(userId)
        .then((d) => vivo && setData(d))
        .catch(() => {})
    })
    return () => {
      vivo = false
      unsub()
    }
  }, [userId])

  const payments = useMemo<Payment[]>(() => (data?.payments ?? []) as unknown as Payment[], [data])
  const subscriptions = useMemo<Subscription[]>(
    () => (data?.subscriptions ?? []) as unknown as Subscription[],
    [data],
  )

  const effective = useMemo<AccessTier>(
    () =>
      effectiveTier(
        user,
        subscriptions as any[],
        userId ? payments.some((p) => p.status === 'paid') : false,
      ),
    [user, subscriptions, payments, userId],
  )

  // Ids dos cursos comprados avulso (payments 'paid' com product_type 'course')
  const purchasedCourseIds = useMemo(
    () =>
      payments
        .filter((p) => p.status === 'paid' && p.product_type === 'course' && p.course_id)
        .map((p) => p.course_id as string),
    [payments],
  )

  const activeTier = effective

  const canAccess = useCallback(
    (requiredTier: PlanTier): boolean => tierAllows(activeTier, requiredTier),
    [activeTier],
  )

  const hasActiveSubscription = useCallback(
    () => tierAllows(activeTier, 'prata') || activeTier === 'free',
    [activeTier],
  )

  const canAccessCourse = useCallback(
    (course: CourseAccessItem | null | undefined) =>
      courseAccess(activeTier, course, purchasedCourseIds),
    [activeTier, purchasedCourseIds],
  )

  const canAccessMagazine = useCallback(() => magazineAccess(activeTier), [activeTier])

  const canAccessLive = useCallback(() => liveAccess(activeTier), [activeTier])

  const canAccessDocumentary = useCallback(
    (doc: { is_free?: boolean } | null | undefined) => documentaryAccess(activeTier, doc),
    [activeTier],
  )

  const hasMentorshipDiscount = useCallback(() => mentorshipDiscountFor(activeTier), [activeTier])

  // Compra avulsa de curso: payment 'paid' com product_type 'course' e course_id.
  const hasPurchased = useCallback(
    (item: { courseId?: string }): boolean =>
      !!item.courseId && purchasedCourseIds.includes(item.courseId),
    [purchasedCourseIds],
  )

  const getAccessStatus = useCallback(
    (item: { is_free?: boolean; courseId?: string }): AccessStatus => {
      if (item.is_free) return 'free'
      if (item.courseId && purchasedCourseIds.includes(item.courseId)) return 'owned'
      if (canAccessCourse(item)) return 'subscriber'
      return 'locked'
    },
    [purchasedCourseIds, canAccessCourse],
  )

  const hasAccess = useCallback(
    (item: { is_free?: boolean; courseId?: string }) => getAccessStatus(item) !== 'locked',
    [getAccessStatus],
  )

  return useMemo(
    () => ({
      payments,
      subscriptions,
      loading,
      activeTier,
      tier: activeTier,
      canAccess,
      canAccessCourse,
      canAccessMagazine,
      canAccessLive,
      canAccessDocumentary,
      hasMentorshipDiscount,
      hasActiveSubscription,
      hasPurchased,
      getAccessStatus,
      hasAccess,
      purchasedCourseIds,
    }),
    [
      payments,
      subscriptions,
      loading,
      activeTier,
      canAccess,
      canAccessCourse,
      canAccessMagazine,
      canAccessLive,
      canAccessDocumentary,
      hasMentorshipDiscount,
      hasActiveSubscription,
      hasPurchased,
      getAccessStatus,
      hasAccess,
      purchasedCourseIds,
    ],
  )
}
