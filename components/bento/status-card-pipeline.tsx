"use client"

import { useEffect, useState } from "react"
import { usePipelineMetrics } from "@/hooks/use-agent-metrics"

function formatLatency(latency_s: number | null | undefined): string {
  if (latency_s == null) return "N/A"
  if (latency_s < 1) return `${(latency_s * 1000).toFixed(1)}ms`
  return `${latency_s.toFixed(2)}s`
}

function BlinkDot() {
  return <span className="inline-block h-2 w-2 bg-primary animate-blink" />
}

export function StatusCardPipeline() {
  const [tick, setTick] = useState(0)
  const { data, loading, error } = usePipelineMetrics()

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 2000)
    return () => clearInterval(interval)
  }, [])

  const rows: { label: string; value: string | number }[] = data
    ? [
        { label: "News Posts Scraped",          value: data.scraped },
        { label: "News Posts Vectorised",        value: data.vectorised },
        { label: "Trade Signals Generated",       value: data.signal_generated },
        { label: "Trade Orders Placed",           value: data.order_placed },
        { label: "Posts Removed: No Ticker",     value: data.removed.no_ticker },
        { label: "Posts Removed: No Event",      value: data.removed.no_event },
        { label: "Avg E-2-E Latency",         value: formatLatency(data.avg_e2e_latency_s) },
      ]
    : []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
          end-to-end.pipeline
        </span>
        <span className="text-[10px] tracking-widest text-muted-foreground">
          {`TICK:${String(tick).padStart(4, "0")}`}
          <BlinkDot />

        </span>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-0">
        {/* Window badge */}
        {data && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
              Window
            </span>
            <span className="text-[9px] font-mono text-foreground">
              {data.window_hours}hr
            </span>
            <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground ml-auto">
              as of {new Date(data.computed_at).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Table header */}
        <div className="grid grid-cols-2 gap-2 border-b border-border pb-2 mb-2">
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Metric</span>
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground text-right">Value</span>
        </div>

        {/* Body */}
        {loading && !data ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-2 py-2 border-b border-border last:border-none animate-pulse"
            >
              <span className="text-xs font-mono text-foreground">—</span>
              <span className="text-xs font-mono text-muted-foreground text-right">—</span>
            </div>
          ))
        ) : error ? (
          <p className="text-xs font-mono text-destructive py-2">{error}</p>
        ) : (
          rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-2 gap-2 py-2 border-b border-border last:border-none"
            >
              <span className="text-xs font-mono text-foreground">{row.label}</span>
              <span className="text-xs font-mono text-foreground text-right">{row.value}</span>
            </div>
          ))
        )}

        {/* Funnel bar: vectorised / scraped */}
        {data && data.scraped > 0 && (
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                Pipeline Yield (Vectorised / Scraped)
              </span>
              <span className="text-[9px] font-mono text-foreground">
                {Math.round((data.vectorised / data.scraped) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full border border-foreground">
              <div
                className="h-full bg-foreground transition-all duration-500"
                style={{ width: `${Math.round((data.vectorised / data.scraped) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}