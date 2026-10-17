import { useCallback, useEffect, useState } from 'react'
import type { UnreadCount } from '../types'
import { usePolling } from './usePolling'

/* Tiny event bus: the chat calls notifySupportChanged() after sending or reading, so
   badges and the admin inbox refresh straight away instead of waiting for the next poll. */
const listeners = new Set<() => void>()

export const notifySupportChanged = () => listeners.forEach((l) => l())

export function onSupportChanged(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** How often badges re-check for new support messages. */
export const SUPPORT_BADGE_POLL_MS = 10_000

/**
 * Unread support messages for the notification badge. Polls every 10 s and refreshes
 * immediately when the chat reports a change. `fetchCount` must be a stable function.
 */
export function useSupportUnread(fetchCount: () => Promise<UnreadCount>) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(() => {
    fetchCount().then(
      (r) => setCount(r.count),
      () => {}, // a missed poll just keeps the last count
    )
  }, [fetchCount])

  useEffect(() => {
    refresh()
    return onSupportChanged(refresh)
  }, [refresh])
  usePolling(refresh, SUPPORT_BADGE_POLL_MS)

  return count
}
