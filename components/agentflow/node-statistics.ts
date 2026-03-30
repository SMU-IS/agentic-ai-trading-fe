import { useMemo } from "react"
import { useAgentMMetrics } from "@/hooks/use-agent-metrics"

export interface Statistic {
  label: string
  value: number | null   // null while loading or when data unavailable
  suffix: string
}

export function useNodeStatistics(): Record<string, Statistic[]> {
  const { pipeline, services } = useAgentMMetrics()

  const p = pipeline.data
  const s = services.data?.service_avg_latency

  return useMemo(() => ({
    // Node 1 — Reddit Scraper
    "1": [
      {
        label: "Avg Streaming Latency (Reddit)",
        value: s?.["scraper:reddit"]?.avg_latency_s != null
          ? Math.round(s["scraper:reddit"].avg_latency_s)
          : null,
        suffix: "s",
      },
      {
        label: "Avg Streaming Latency (TradingView)",
        value: s?.["scraper:tradingview"]?.avg_latency_s != null
          ? Math.round(s["scraper:tradingview"].avg_latency_s )
          : null,
        suffix: "s",
      },    
    ],

    // Node 2 — TradingView Scraper
    "2": [
      {
        label: "Posts Scraped (Reddit)",
        value: s?.["scraper:reddit"]?.processed ?? null,
        suffix: "/hr",
      },
      {
        label: "Ideas Scraped (TradingView)",
        value: s?.["scraper:tradingview"]?.ideas_processed ?? null,
        suffix: "/hr",
      },
      {
        label: "Minds Scraped (TradingView)",
        value: s?.["scraper:tradingview"]?.minds_processed ?? null,
        suffix: "/hr",
      },
    ],

    // Node 3 — Pre-processing
    "3": [
      {
        label: "Total Posts Processed",
        value: s?.preproc?.processed ?? null,
        suffix: "/hr",
      },
      {
        label: "Avg Latency",
        value: s?.preproc?.avg_latency_s != null
          ? Math.round(s.preproc.avg_latency_s * 1000)
          : null,
        suffix: "ms",
      },
    ],

    // Node 4 — Event Identification
    "4": [
      {
        label: "News Events Identified",
        value: s?.event?.processed ?? null,
        suffix: "/hr",
      },
      {
        label: "News Events Removed (No Ticker)",
        value: p?.removed?.no_ticker ?? null,
        suffix: "",
      },
      {
        label: "Stock Tickers Identified",
        value: s?.ticker?.processed ?? null,
        suffix: "/hr",
      },
      {
        label: "News Events Analysed",
        value: s?.sentiment?.processed ?? null,
        suffix: "/hr",
      },  
      {
        label: "News Events Vectorised",
        value: p?.vectorised ?? null,
        suffix: "",
      },

    ],

    // // Node 5 — Ticker Identification
    // "5": [
    //   {
    //     label: "Tickers Identified",
    //     value: s?.ticker?.processed ?? null,
    //     suffix: "/hr",
    //   },
    //   {
    //     label: "Removed (No Ticker)",
    //     value: p?.removed?.no_ticker ?? null,
    //     suffix: "",
    //   },
    // ],

    // // Node 6 — Sentiment Analysis
    // "6": [
    //   {
    //     label: "Posts Analysed",
    //     value: s?.sentiment?.processed ?? null,
    //     suffix: "/hr",
    //   },
    //   {
    //     label: "Avg Latency",
    //     value: s?.sentiment?.avg_latency_s != null
    //       ? Math.round(s.sentiment.avg_latency_s * 1000)
    //       : null,
    //     suffix: "ms",
    //   },
    // ],

    // // Node 7 — Vectorisation & Embedding
    // "7": [
    //   {
    //     label: "Posts Vectorised",
    //     value: p?.vectorised ?? null,
    //     suffix: "",
    //   },
    //   {
    //     label: "Avg Latency",
    //     value: s?.vectorisation?.avg_latency_s != null
    //       ? Math.round(s.vectorisation.avg_latency_s * 1000)
    //       : null,
    //     suffix: "ms",
    //   },
    // ],

    // Node 13 — Signal Generation
    "13": [
      {
        label: "Trade Signals Generated",
        value: p?.signal_generated ?? null,
        suffix: "",
      },
      {
        label: "Trade Signals Removed (Not Confident)",
        value: p?.removed?.no_event ?? null,
        suffix: "",
      },
    ],

    // Node 16 — Order Placement / Trading Agent
    "16": [
      {
        label: "Trade Orders Placed",
        value: p?.order_placed ?? null,
        suffix: "",
      },
      {
        label: "Avg E2E Latency",
        value: p?.avg_e2e_latency_s != null
          ? Math.round(p.avg_e2e_latency_s)
          : null,
        suffix: "s",
      },
    ],

    // // Node 10 — Overall Pipeline (24hr)
    // "10": [
    //   {
    //     label: "Posts Scraped (24hr)",
    //     value: p?.scraped ?? null,
    //     suffix: "",
    //   },
    //   {
    //     label: "Pipeline Drop Rate",
    //     value: p?.scraped
    //       ? Math.round(((p.scraped - (p.order_placed ?? 0)) / p.scraped) * 100)
    //       : null,
    //     suffix: "%",
    //   },
    // ],
  }), [p, s])
}