import { useCallback, useEffect, useState, type DependencyList } from 'react'

interface Result<T> {
  key: string
  data: T | null
  error: string | null
}

/** Runs an async loader on mount (and when deps change), exposing data/error/reload. */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList = []) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<Result<T> | null>(null)
  const key = `${JSON.stringify(deps)}#${version}`

  useEffect(() => {
    let cancelled = false
    loader().then(
      (data) => !cancelled && setResult({ key, data, error: null }),
      (e: unknown) =>
        !cancelled &&
        setResult({ key, data: null, error: e instanceof Error ? e.message : 'Something went wrong' }),
    )
    return () => {
      cancelled = true
    }
    // `key` already encodes deps + reload version
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const current = result?.key === key ? result : null

  const setData = useCallback((data: T) => setResult({ key, data, error: null }), [key])
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: !current,
    setData,
    reload,
  }
}
