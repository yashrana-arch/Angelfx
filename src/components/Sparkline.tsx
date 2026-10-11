import { useId, useMemo } from 'react'

/** Small deterministic PRNG so the same seed always draws the same line. */
function rng(seed: string) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

/** Generates a plausible intraday-looking series that ends in the direction of `trend`. */
function series(seed: string, trend: number, n = 28) {
  const rand = rng(seed)
  const pts: number[] = []
  let v = 0
  const drift = Math.sign(trend) * 0.35
  for (let i = 0; i < n; i++) {
    v += drift + (rand() - 0.5) * 2.2
    pts.push(v)
  }
  return pts
}

/** Catmull-Rom → cubic Bézier for a smooth path through the points. */
function smoothPath(xy: [number, number][]) {
  let d = `M${xy[0]![0]},${xy[0]![1]}`
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[i - 1] ?? xy[i]!
    const p1 = xy[i]!
    const p2 = xy[i + 1]!
    const p3 = xy[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`
  }
  return d
}

interface Props {
  seed: string
  trend: number
  color: string
  width?: number
  height?: number
}

export default function Sparkline({ seed, trend, color, width = 240, height = 56 }: Props) {
  const gid = useId()
  const { line, area } = useMemo(() => {
    const pts = series(seed, trend)
    const min = Math.min(...pts)
    const max = Math.max(...pts)
    const pad = 4
    const xy = pts.map(
      (p, i): [number, number] => [
        (i / (pts.length - 1)) * width,
        pad + (1 - (p - min) / (max - min || 1)) * (height - pad * 2),
      ],
    )
    const line = smoothPath(xy)
    return { line, area: `${line} L${width},${height} L0,${height} Z` }
  }, [seed, trend, width, height])

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
