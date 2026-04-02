"use client"

import { useEffect, useState } from "react"
import { useClusterMetrics } from "@/hooks/use-agent-metrics"

interface ScrambleNumberProps {
  target: string
  label: string
  delay?: number
}

function ScrambleNumber({ target, label, delay = 0 }: ScrambleNumberProps) {
  const [display, setDisplay] = useState(target.replace(/[0-9]/g, "0"))
  const [scrambling, setScrambling] = useState(false)

  useEffect(() => {
    setDisplay(target.replace(/[0-9]/g, "0"))
    const timeout = setTimeout(() => {
      setScrambling(true)
      let iterations = 0
      const maxIterations = 20

      const interval = setInterval(() => {
        if (iterations >= maxIterations) {
          setDisplay(target)
          setScrambling(false)
          clearInterval(interval)
          return
        }

        setDisplay(
          target
            .split("")
            .map((char, i) => {
              if (!/[0-9]/.test(char)) return char
              if (
                iterations > maxIterations - 5 &&
                i < iterations - (maxIterations - 5)
              )
                return char
              return String(Math.floor(Math.random() * 10))
            })
            .join(""),
        )
        iterations++
      }, 50)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timeout)
  }, [target, delay]) // ← re-scrambles when target changes from API

  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-4xl lg:text-5xl font-mono font-bold tracking-tight text-foreground"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {display}
      </span>
      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export function MetricsCard() {
  const { data, loading } = useClusterMetrics()

  // Format values — fall back to placeholder while loading
  const avgLatency = data
    ? `${data.average_latency_ms.toFixed(2)}ms`
    : "-.--ms"
  const uptime = data
    ? `${data.uptime_percentage.toFixed(1)}%`
    : "-.--%"

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
          news_analysis.metrics
        </span>
        <span className="inline-block h-2 w-2 bg-primary" />
      </div>
      <div className="flex-1 flex flex-col justify-center gap-6 p-6">
        {/* ── Live from /metrics/cluster ── */}
        <ScrambleNumber target={avgLatency} label="Avg Latency" delay={500} />
        <ScrambleNumber target="600+" label="News Analysed / day" delay={800} />
        <ScrambleNumber target={uptime} label="Uptime" delay={1100} />
        {/* ── Static ── */}
        <ScrambleNumber target="Yahoo Finance, TradingView, Reddit" label="News Sources" delay={1400} />
        <ScrambleNumber target="Llama 3.3" label="Model Used for News Analysis" delay={1700} />
      </div>
    </div>
  )
}