import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { getSubscriptionPlans as fetchSubscriptionPlans } from '@/services/subscription-plans'
import { SubscriptionPlan } from '@/types'

interface SubscriptionPlansContextValue {
  plans: SubscriptionPlan[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<SubscriptionPlan[]>
}

const SubscriptionPlansContext = createContext<SubscriptionPlansContextValue | undefined>(undefined)

// Module-level in-memory cache to guarantee deduplication across renders and component remounts
let cachedPlans: SubscriptionPlan[] | null = null
let inflightRequest: Promise<SubscriptionPlan[]> | null = null

export const fetchSharedSubscriptionPlans = async (force = false): Promise<SubscriptionPlan[]> => {
  if (!force && cachedPlans) {
    return cachedPlans
  }
  if (!inflightRequest) {
    inflightRequest = fetchSubscriptionPlans()
      .then((data) => {
        cachedPlans = data
        return data
      })
      .finally(() => {
        inflightRequest = null
      })
  }
  return inflightRequest
}

export function clearSubscriptionPlansCache() {
  cachedPlans = null
  inflightRequest = null
}

export function SubscriptionPlansProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => cachedPlans || [])
  const [loading, setLoading] = useState<boolean>(() => !cachedPlans)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  const load = useCallback(async (force = false) => {
    if (force) {
      clearSubscriptionPlansCache()
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSharedSubscriptionPlans(force)
      if (mountedRef.current) {
        setPlans(data)
        setLoading(false)
      }
      return data
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      if (mountedRef.current) {
        setError(e)
        setLoading(false)
      }
      throw e
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load(false).catch(() => {
      // handled via state
    })
    return () => {
      mountedRef.current = false
    }
  }, [load])

  const refetch = useCallback(() => load(true), [load])

  return (
    <SubscriptionPlansContext.Provider value={{ plans, loading, error, refetch }}>
      {children}
    </SubscriptionPlansContext.Provider>
  )
}

export function useSubscriptionPlans() {
  const ctx = useContext(SubscriptionPlansContext)
  if (!ctx) {
    throw new Error('useSubscriptionPlans must be used within a SubscriptionPlansProvider')
  }
  return ctx
}
