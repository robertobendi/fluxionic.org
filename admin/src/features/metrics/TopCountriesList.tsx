import { useMemo } from 'react'

interface TopCountry {
  country: string
  visitors: number
}

interface TopCountriesListProps {
  data: TopCountry[]
  isLoading?: boolean
}

// Convert ISO 3166-1 alpha-2 code to a flag emoji via Regional Indicator Symbols.
function flagFromIso(iso2: string): string {
  if (!/^[A-Za-z]{2}$/.test(iso2)) return '🌐'
  const base = 0x1f1e6
  const upper = iso2.toUpperCase()
  return String.fromCodePoint(
    base + upper.charCodeAt(0) - 65,
    base + upper.charCodeAt(1) - 65,
  )
}

const countryNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region', fallback: 'code' })
    : null

function countryName(iso2: string): string {
  return countryNames?.of(iso2.toUpperCase()) ?? iso2.toUpperCase()
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-[2px] border bg-card px-3 py-2.5"
        >
          <div className="h-5 w-5 animate-pulse rounded bg-muted" />
          <div className="h-4 flex-1 animate-pulse rounded bg-muted max-w-[40%]" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

export function TopCountriesList({ data, isLoading }: TopCountriesListProps) {
  const { max, total } = useMemo(() => {
    let m = 0
    let t = 0
    for (const row of data) {
      if (row.visitors > m) m = row.visitors
      t += row.visitors
    }
    return { max: m || 1, total: t || 1 }
  }, [data])

  if (isLoading) return <ListSkeleton />

  return (
    <div className="space-y-1.5">
      {data.map((row, index) => {
        const widthPct = (row.visitors / max) * 100
        const sharePct = (row.visitors / total) * 100

        return (
          <div
            key={row.country}
            className="relative flex items-center gap-3 rounded-[2px] border bg-card px-3 py-2.5 overflow-hidden opacity-0 animate-slide-up"
            style={{
              animationDelay: `${index * 40}ms`,
              animationFillMode: 'forwards',
            }}
          >
            {/* Background progress bar */}
            <div
              className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
              style={{
                width: `${widthPct}%`,
                backgroundColor: 'hsl(var(--preset-chart) / 0.12)',
              }}
              aria-hidden="true"
            />
            <span
              className="relative text-xl leading-none shrink-0"
              role="img"
              aria-label={`${countryName(row.country)} flag`}
            >
              {flagFromIso(row.country)}
            </span>
            <span className="relative flex-1 truncate text-sm font-medium">
              {countryName(row.country)}
            </span>
            <span className="relative shrink-0 text-xs tabular-nums text-muted-foreground hidden sm:inline-block w-12 text-right">
              {sharePct.toFixed(1)}%
            </span>
            <span className="relative shrink-0 text-sm font-medium tabular-nums w-16 text-right">
              {row.visitors.toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}
