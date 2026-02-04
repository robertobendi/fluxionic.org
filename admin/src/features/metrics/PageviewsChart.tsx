import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface TrendDataPoint {
  date: string
  views: number
}

interface PageviewsChartProps {
  data: TrendDataPoint[]
  isLoading?: boolean
}

export function PageviewsChart({ data, isLoading }: PageviewsChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 md:h-[300px] animate-pulse rounded bg-muted" />
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-64 md:h-[300px] flex items-center justify-center text-muted-foreground">
        No pageview data available
      </div>
    )
  }

  return (
    <div className="h-64 md:h-[300px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--preset-chart))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--preset-chart))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '2px',
              color: 'hsl(var(--card-foreground))',
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            itemStyle={{ color: 'hsl(var(--preset-chart))' }}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="hsl(var(--preset-chart))"
            strokeWidth={2}
            fill="url(#areaGradient)"
            name="Views"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
