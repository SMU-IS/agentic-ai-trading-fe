"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"

type TimePeriod = "Daily" | "Weekly" | "Monthly"

interface PortfolioHistoryPoint {
  date: string
  value: number
}

export default function PerformanceChart() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("Weekly")
  const [performanceData, setPerformanceData] = useState<
    PortfolioHistoryPoint[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true)
      setError(false)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/portfolio_history`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch portfolio history")
        }

        const data = await response.json()
        setPerformanceData(data.historical || [])
      } catch (err) {
        console.error("Error fetching portfolio history:", err)
        setError(true)
        setPerformanceData([])
      } finally {
        setLoading(false)
      }
    }

    fetchPerformanceData()
  }, [])

  const getFilteredData = () => {
    const now = new Date()
    let startDate: Date

    switch (timePeriod) {
      case "Daily":
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7) // Last 7 days
        break
      case "Weekly":
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30) // Last 30 days
        break
      case "Monthly":
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 3) // Last 3 months
        break
      default:
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
    }

    return performanceData.filter((item) => new Date(item.date) >= startDate)
  }

  const getYAxisDomain = () => {
    const filteredData = getFilteredData()
    if (filteredData.length === 0) return [0, 100]

    const values = filteredData.map((d) => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Calculate range and add padding
    const range = max - min
    const padding = range * 0.3 // 10% padding on each side

    // If values are very flat (less than 1% variance), zoom in more
    const variance = range / max
    const adjustedPadding = variance < 0.01 ? range * 0.01 : padding // ← Changed

    return [Math.floor(min - adjustedPadding), Math.ceil(max + adjustedPadding)]
  }

  const formatXAxisDate = (dateStr: string) => {
    const date = new Date(dateStr)

    // For Daily view, show day and month
    if (timePeriod === "Daily") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    }

    // For Weekly view, show day and month
    if (timePeriod === "Weekly") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    }

    // For Monthly view, show month and year
    const month = date.toLocaleDateString("en-US", { month: "short" })
    const year = date.getFullYear()

    if (date.getMonth() === 0) {
      return year.toString()
    }
    return `${month} '${year.toString().slice(-2)}`
  }

  const formatTooltipLabel = (label: string) => {
    const date = new Date(label)

    if (timePeriod === "Daily" || timePeriod === "Weekly") {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getDescription = () => {
    switch (timePeriod) {
      case "Daily":
        return "Last 7 days performance"
      case "Weekly":
        return "Last 30 days performance"
      case "Monthly":
        return "Last 3 months performance"
      default:
        return "Portfolio performance overview"
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-semibold text-foreground">
            Portfolio Performance
          </CardTitle>
          <CardDescription className="mt-1 text-muted-foreground">
            {getDescription()}
          </CardDescription>
        </div>
        <div className="flex items-center overflow-hidden rounded-lg border border-border">
          {(["Daily", "Weekly", "Monthly"] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                timePeriod === period
                  ? "bg-card text-foreground"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex h-[350px] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Loading portfolio data...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-[350px] w-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-red-500">
                Failed to load portfolio history
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-xs text-blue-500 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : performanceData.length === 0 ? (
          <div className="flex h-[350px] w-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No portfolio data available
            </p>
          </div>
        ) : (
          <ChartContainer
            config={{
              value: {
                label: "Portfolio Value",
                color: "hsl(221, 83%, 53%)",
              },
            }}
            className="h-[350px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={getFilteredData()}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="portfolioGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="hsl(221, 83%, 53%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(221, 83%, 53%)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxisDate}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={timePeriod === "Daily" ? 30 : 40}
                />
                <YAxis
                  domain={getYAxisDomain()}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(1)}K`}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickCount={8}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                  labelStyle={{
                    color: "hsl(var(--foreground))",
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                  itemStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    "Value",
                  ]}
                  labelFormatter={formatTooltipLabel}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2}
                  fill="url(#portfolioGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
