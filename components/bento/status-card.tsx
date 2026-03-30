"use client"

import { useEffect, useState } from "react"
import { useServiceMetrics } from "@/hooks/use-agent-metrics"

// Maps each display row to its key in service_avg_latency
const SERVICE_MAP = [
  { name: "News Scraping",            serviceKey: "scraper:reddit" },
  { name: "Pre-processing",           serviceKey: "preproc"        },
  { name: "Ticker Identification",    serviceKey: "ticker"         },
  { name: "Sentiment Analysis",       serviceKey: "sentiment"      },
  { name: "Vectorisation & Embedding",serviceKey: "vectorisation"  },
] as const

type ServiceKey = (typeof SERVICE_MAP)[number]["serviceKey"]

function BlinkDot() {
  return <span className="inline-block h-2 w-2 bg-primary animate-blink" />
}

function formatLatency(latency_s: number | null | undefined): string {
  if (latency_s == null) return "N/A"
  if (latency_s < 1) return `${(latency_s * 1000).toFixed(1)}ms`
  return `${latency_s.toFixed(2)}s`
}

function deriveStatus(entry: { avg_latency_s: number | null; processed?: number } | undefined): "ACTIVE" | "IDLE" {
  if (!entry) return "IDLE"
  // A service is considered ONLINE if it has processed at least 1 item in the window
  return (entry.processed ?? 0) > 0 ? "ACTIVE" : "IDLE"
}

function calcGlobalThroughput(onlineCount: number, totalCount: number): number {
  if (totalCount === 0) return 0
  return Math.round((onlineCount / totalCount) * 100)
}

export function StatusCard() {
  const [tick, setTick] = useState(0)
  const { data, loading, error } = useServiceMetrics()

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 2000)
    return () => clearInterval(interval)
  }, [])

  // Derive rows from live data, falling back to skeleton state while loading
  const regions = SERVICE_MAP.map(({ name, serviceKey }) => {
    const entry = data?.service_avg_latency[serviceKey as ServiceKey]
    return {
      name,
      status: deriveStatus(entry),
      latency: formatLatency(entry?.avg_latency_s),
    }
  })

  const onlineCount = regions.filter((r) => r.status === "ACTIVE").length
  const throughput = calcGlobalThroughput(onlineCount, regions.length)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
          news_analysis.status
        </span>
        <span className="text-[10px] tracking-widest text-muted-foreground">
          {`TICK:${String(tick).padStart(4, "0")}`}
                  <BlinkDot />

        </span>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-0">
        {/* Table header */}
        <div className="grid grid-cols-3 gap-2 border-b border-border pb-2 mb-2">
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Process</span>
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Status</span>
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground text-right">Real-Time Latency</span>
        </div>

        {loading && !data ? (
          // Skeleton rows while first fetch is in flight
          SERVICE_MAP.map(({ name }) => (
            <div key={name} className="grid grid-cols-3 gap-2 py-2 border-b border-border last:border-none animate-pulse">
              <span className="text-xs font-mono text-foreground">{name}</span>
              <span className="text-xs font-mono text-muted-foreground">—</span>
              <span className="text-xs font-mono text-muted-foreground text-right">—</span>
            </div>
          ))
        ) : error ? (
          <p className="text-xs font-mono text-destructive py-2">{error}</p>
        ) : (
          regions.map((region) => (
            <div
              key={region.name}
              className="grid grid-cols-3 gap-2 py-2 border-b border-border last:border-none"
            >
              <span className="text-xs font-mono text-foreground">{region.name}</span>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      region.status === "ACTIVE"
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground))",
                  }}
                />
                <span className="text-xs font-mono text-muted-foreground">{region.status}</span>
              </div>
              <span className="text-xs font-mono text-foreground text-right">{region.latency}</span>
            </div>
          ))
        )}

        {/* Throughput bar */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
              Global Throughput
            </span>
            <span className="text-[9px] font-mono text-foreground">{throughput}%</span>
          </div>
          <div className="h-2 w-full border border-foreground">
            <div className="h-full bg-foreground transition-all duration-500" style={{ width: `${throughput}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}