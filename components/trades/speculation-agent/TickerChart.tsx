"use client"

import { ChartContainer } from "@/components/ui/chart"
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

type Period = "1W" | "1M" | "3M"

interface FinnhubCandleResponse {
  c: number[]
  h: number[]
  l: number[]
  o: number[]
  v: number[]
  t: number[]
  s: "ok" | "no_data"
}

interface CandlePoint {
  date: string
  close: number
  unix: number
}

interface TickerChartProps {
  symbol: string
  tradePrice: number
  tradeType: "buy" | "sell"
}

const PERIOD_CONFIG: Record<Period, { days: number; resolution: string }> = {
  "1W": { days: 7, resolution: "D" },
  "1M": { days: 30, resolution: "D" },
  "3M": { days: 90, resolution: "W" },
}

function buildFinnhubUrl(
  symbol: string,
  period: Period,
  apiKey: string,
): string {
  const { days, resolution } = PERIOD_CONFIG[period]
  const now = Math.floor(Date.now() / 1000)
  const from = now - days * 24 * 60 * 60
  const normalizedSymbol = symbol.includes("USD")
    ? `BINANCE:${symbol}`
    : symbol
  return `https://finnhub.io/api/v1/stock/candle?symbol=${normalizedSymbol}&resolution=${resolution}&from=${from}&to=${now}&token=${apiKey}`
}

function getYAxisDomain(
  data: CandlePoint[],
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

export default function TickerChart({
  symbol,
  tradePrice,
  tradeType,
}: TickerChartProps) {
  const [period, setPeriod] = useState<Period>("1M")
  const [data, setData] = useState<CandlePoint[]>([])
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
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? ""

    const fetchCandles = async () => {
      if (!isMounted.current) return
      setLoading(true)
      setError(false)

      try {
        const url = buildFinnhubUrl(symbol, period, apiKey)
        const res = await fetch(url, { signal: controller.signal })

        if (!res.ok) throw new Error("Fetch failed")

        const json: FinnhubCandleResponse = await res.json()

        if (!isMounted.current) return

        if (json.s !== "ok" || !json.t?.length) {
          setData([])
          setLoading(false)
          return
        }

        const points: CandlePoint[] = json.t.map((unix, i) => ({
          unix,
          date: new Date(unix * 1000).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          close: json.c[i],
        }))

        setData(points)
      } catch (err: unknown) {
        if (!isMounted.current) return
        if (err instanceof Error && err.name === "AbortError") return
        setError(true)
      } finally {
        if (isMounted.current) setLoading(false)
      }
    }

    const timer = setTimeout(() => fetchCandles(), 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [symbol, period])

  const currentClose = data.length > 0 ? data[data.length - 1].close : null
  const isAboveEntry = currentClose !== null ? currentClose >= tradePrice : true

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
      ? ((currentClose - tradePrice) / tradePrice) * 100
      : null

  const refLineLabel = tradeType === "sell" ? "Exit" : "Entry"

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
              dataKey="unix"
              tickFormatter={(v: number) =>
                new Date(v * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
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
              labelFormatter={(unix: number) =>
                new Date(unix * 1000).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              }
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
