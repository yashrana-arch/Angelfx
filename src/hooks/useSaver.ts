import { useCallback, useState } from 'react'
import { errorMessage } from '../utils/format'

export interface SaveStatus {
  ok: boolean
  text: string
}

/** Tracks saving/feedback state for a form's submit action. */
export function useSaver() {
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<SaveStatus | null>(null)

  const run = useCallback(async <T,>(fn: () => Promise<T>, okText = 'Changes saved') => {
    setSaving(true)
    setStatus(null)
    try {
      const result = await fn()
      setStatus({ ok: true, text: okText })
      return result
    } catch (err) {
      setStatus({ ok: false, text: errorMessage(err, 'Save failed') })
      return undefined
    } finally {
      setSaving(false)
    }
  }, [])

  return { saving, status, setStatus, run }
}
