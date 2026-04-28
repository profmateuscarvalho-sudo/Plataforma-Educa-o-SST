import { useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordSubscription } from 'pocketbase'

/**
 * Hook for real-time subscriptions to a PocketBase collection.
 * ALWAYS use this hook instead of subscribing inline.
 * Uses the per-listener UnsubscribeFunc so multiple components
 * can safely subscribe to the same collection without conflicts.
 */
export function useRealtime(
  collectionName: string,
  callback: (data: RecordSubscription<any>) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false

    pb.collection(collectionName)
      .subscribe('*', (e) => {
        callbackRef.current(e)
      })
      .then((fn) => {
        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubscribeFn = fn
        }
      })
      .catch((err) => {
        // Gracefully handle network interruptions (status 0) and auth errors (401/403)
        // to prevent UI crashes, particularly during initialization on public routes like /login
        if (err?.status !== 0 && err?.status !== 401 && err?.status !== 403) {
          console.warn(`Realtime subscription error for ${collectionName}:`, err)
        }
      })

    return () => {
      cancelled = true
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled])
}

export default useRealtime
