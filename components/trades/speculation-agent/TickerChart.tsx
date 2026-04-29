"use client"

import { ChartContainer } from "@/components/ui/chart"
import Cookies from "js-cookie"
import { useEffect, useRef, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const getToken = () => Cookies.get("jwt") ?? ""

type Period = "1W" | "1M" | "3M"

interface Bar {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface YahooHistoryResponse {
  symbol: string
  interval: string
  count: number
  bars: Bar[]
}

interface TickerChartProps {
  symbol: string
  tradePrice: number
  tradeType: "buy" | "sell"
  tradeTimestamp?: string
  rewardPerShare?: number
  riskPerShare?: number
}

const PERIOD_PARAMS: Record<Period, { period: string; interval: string }> = {
  "1W": { period: "7d", interval: "1d" },
  "1M": { period: "1mo", interval: "1d" },
  "3M": { period: "3mo", interval: "1wk" },
}

function getYAxisDomain(
  data: Bar[],
  tradePrice: number,
): [number, number] {
  if (data.length === 0)
    return [Math.floor(tradePrice * 0.95), Math.ceil(tradePrice * 1.05)]
  const values = [...data.map((d) => d.close), tradePrice]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const padding = range * 0.2 || max * 0.02
  return [Math.floor(min - padding), Math.ceil(max + padding)]
}

function formatAxisDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function formatTooltipDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function TickerChart({
  symbol,
  tradePrice,
  tradeType,
  tradeTimestamp,
  rewardPerShare,
  riskPerShare,
}: TickerChartProps) {
  const [period, setPeriod] = useState<Period>("1M")
  const [data, setData] = useState<Bar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!symbol) return

    const controller = new AbortController()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL
    const { period: yPeriod, interval } = PERIOD_PARAMS[period]

    const fetchHistory = async () => {
      if (!isMounted.current) return
      setLoading(true)
      setError(false)

      try {
        const res = await fetch(
          `${baseUrl}/trading/yahoo/history/${symbol}?period=${yPeriod}&interval=${interval}`,
          {
            signal: controller.signal,
            credentials: "include",
            headers: { Authorization: `Bearer ${getToken()}` },
          },
        )

        if (!res.ok) throw new Error("Fetch failed")

        const json: YahooHistoryResponse = await res.json()

        if (!isMounted.current) return

        setData(json.bars ?? [])
      } catch (err: unknown) {
        if (!isMounted.current) return
        if (err instanceof Error && err.name === "AbortError") return
        setError(true)
      } finally {
        if (isMounted.current) setLoading(false)
      }
    }

    const timer = setTimeout(() => fetchHistory(), 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [symbol, period])

  const currentClose = data.length > 0 ? data[data.length - 1].close : null
  const isAboveEntry =
    currentClose !== null
      ? tradeType === "sell"
        ? currentClose <= tradePrice
        : currentClose >= tradePrice
      : true

  const strokeColor = isAboveEntry
    ? "hsla(174, 83%, 53%, 0.83)"
    : "hsla(0, 72%, 55%, 0.83)"
  const gradientStartColor = isAboveEntry
    ? "hsl(185, 83%, 53%)"
    : "hsl(0, 72%, 55%)"
  const gradientEndColor = isAboveEntry
    ? "hsl(221, 83%, 53%)"
    : "hsl(0, 55%, 40%)"
  const gradientId = `tickerGradient-${symbol}`

  const percentChange =
    currentClose !== null
      ? ((currentClose - tradePrice) / tradePrice) *
        100 *
        (tradeType === "sell" ? -1 : 1)
      : null

  const refLineLabel = "Entry"

  const entryBar =
    tradeTimestamp && data.length > 0
      ? data.reduce((closest, bar) => {
          const diff = Math.abs(new Date(bar.timestamp).getTime() - new Date(tradeTimestamp).getTime())
          const closestDiff = Math.abs(new Date(closest.timestamp).getTime() - new Date(tradeTimestamp).getTime())
          return diff < closestDiff ? bar : closest
        })
      : null

  const tpPrice =
    rewardPerShare != null
      ? tradeType === "sell"
        ? tradePrice - rewardPerShare
        : tradePrice + rewardPerShare
      : null

  const slPrice =
    riskPerShare != null
      ? tradeType === "sell"
        ? tradePrice + riskPerShare
        : tradePrice - riskPerShare
      : null

  return (
    <div className="rounded-lg border border-border bg-muted p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">
            {symbol}
          </span>
          {currentClose !== null && (
            <>
              <span className="text-sm font-bold">
                ${currentClose.toFixed(2)}
              </span>
              {percentChange !== null && (
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    percentChange >= 0
                      ? "bg-green-500/10 text-green-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {percentChange >= 0 ? "+" : ""}
                  {percentChange.toFixed(2)}% vs {refLineLabel.toLowerCase()}
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center overflow-hidden rounded-lg border border-border flex-shrink-0">
          {(["1W", "1M", "3M"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? "bg-card text-foreground"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-[160px] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-xs text-muted-foreground">Loading chart...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-[160px] w-full items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-red-500">Failed to load chart data</p>
            <button
              onClick={() => setPeriod((p) => p)}
              className="mt-1 text-xs text-blue-500 hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[160px] w-full items-center justify-center">
          <p className="text-xs text-muted-foreground">
            No chart data available
          </p>
        </div>
      ) : (
        <ChartContainer
          config={{ close: { label: "Price", color: strokeColor } }}
          className="h-[160px] w-full"
        >
          <AreaChart
            data={data}
            margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={gradientStartColor}
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor={gradientEndColor}
                  stopOpacity={0.03}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatAxisDate}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              domain={getYAxisDomain(data, tradePrice)}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickCount={5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                padding: "6px 10px",
              }}
              labelStyle={{
                color: "hsl(var(--foreground))",
                fontWeight: 500,
                marginBottom: 2,
              }}
              itemStyle={{ color: "hsl(var(--muted-foreground))" }}
              formatter={(value: number) => [
                `$${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                "Price",
              ]}
              labelFormatter={formatTooltipDate}
            />
            <ReferenceLine
              y={tradePrice}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: `${refLineLabel} $${tradePrice.toFixed(2)}`,
                fill: "hsl(var(--muted-foreground))",
                fontSize: 10,
                position: "insideBottomRight",
              }}
            />
            {tpPrice != null && (
              <ReferenceLine
                y={tpPrice}
                stroke="hsl(142, 71%, 45%)"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `TP $${tpPrice.toFixed(2)}`,
                  fill: "hsl(142, 71%, 45%)",
                  fontSize: 10,
                  position: "insideBottomRight",
                }}
              />
            )}
            {slPrice != null && (
              <ReferenceLine
                y={slPrice}
                stroke="hsl(0, 72%, 55%)"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `SL $${slPrice.toFixed(2)}`,
                  fill: "hsl(0, 72%, 55%)",
                  fontSize: 10,
                  position: "insideBottomRight",
                }}
              />
            )}
            {entryBar != null && (
              <ReferenceLine
                x={entryBar.timestamp}
                stroke="white"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            )}
            <Area
              type="monotone"
              dataKey="close"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 3, stroke: strokeColor, fill: strokeColor }}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  )
}
