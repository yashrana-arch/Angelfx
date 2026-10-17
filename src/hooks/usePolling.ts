import { useEffect, useRef } from 'react'

/**
 * Calls `fn` every `ms` milliseconds while the browser tab is visible, and once right away
 * when the tab becomes visible again. Polling pauses in background tabs to save requests.
 */
export function usePolling(fn: () => void, ms: number, enabled = true) {
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })

  useEffect(() => {
    if (!enabled) return
    const tick = () => {
      if (document.visibilityState === 'visible') fnRef.current()
    }
    const id = setInterval(tick, ms)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [ms, enabled])
}
