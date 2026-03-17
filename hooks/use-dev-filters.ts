import { useEffect, useState, KeyboardEvent } from "react"

export type Source = "reddit" | "tradingview"

export interface SourceState {
  enabled: boolean
  redditAccount: string
  tickerInput: string
  tickers: string[]
}

const DEFAULT_STATE: Record<Source, SourceState> = {
  reddit: { enabled: true, redditAccount: "", tickerInput: "", tickers: [] },
  tradingview: {
    enabled: false,
    redditAccount: "",
    tickerInput: "",
    tickers: [],
  },
}

// ─── API ───────────────────────────────────────────────────────────────────────

async function fetchNewsSourceStatus(): Promise<Record<Source, boolean>> {
  const res = await fetch("/api/filters/news/status")
  if (!res.ok) return { reddit: true, tradingview: false }
  return res.json()
}

async function postToggleNews(source: Source, enabled: boolean) {
  await fetch("/api/filters/news/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, enabled }),
  })
}

async function postFilterReddit(account: string) {
  await fetch("/api/filters/reddit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account }),
  })
}

async function postFilterTradingView(tickers: string[]) {
  await fetch("/api/filters/tradingview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tickers }),
  })
}

// ──────────────────────────────────────────────────────────────────────────────

export function useDevFilters() {
  const [sources, setSources] =
    useState<Record<Source, SourceState>>(DEFAULT_STATE)
  const [isHydrating, setIsHydrating] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedPulse, setSavedPulse] = useState(false)

  useEffect(() => {
    fetchNewsSourceStatus()
      .then((status) => {
        setSources((prev) => ({
          ...prev,
          reddit: { ...prev.reddit, enabled: status.reddit ?? true },
          tradingview: {
            ...prev.tradingview,
            enabled: status.tradingview ?? false,
          },
        }))
      })
      .finally(() => setIsHydrating(false))
  }, [])

  const toggleSource = (source: Source) => {
    setSources((prev) => ({
      ...prev,
      [source]: { ...prev[source], enabled: !prev[source].enabled },
    }))
  }

  const handleRedditChange = (value: string) => {
    setSources((prev) => ({
      ...prev,
      reddit: { ...prev.reddit, redditAccount: value },
    }))
  }

  const handleTickerInput = (value: string) => {
    setSources((prev) => ({
      ...prev,
      tradingview: { ...prev.tradingview, tickerInput: value },
    }))
  }

  const handleTickerKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const value = sources.tradingview.tickerInput.trim().toUpperCase()
      if (!value || sources.tradingview.tickers.includes(value)) {
        setSources((prev) => ({
          ...prev,
          tradingview: { ...prev.tradingview, tickerInput: "" },
        }))
        return
      }
      setSources((prev) => ({
        ...prev,
        tradingview: {
          ...prev.tradingview,
          tickers: [...prev.tradingview.tickers, value],
          tickerInput: "",
        },
      }))
    }
  }

  const removeTicker = (ticker: string) => {
    setSources((prev) => ({
      ...prev,
      tradingview: {
        ...prev.tradingview,
        tickers: prev.tradingview.tickers.filter((t) => t !== ticker),
      },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    await Promise.all([
      postToggleNews("reddit", sources.reddit.enabled),
      postToggleNews("tradingview", sources.tradingview.enabled),
      sources.reddit.enabled
        ? postFilterReddit(sources.reddit.redditAccount)
        : Promise.resolve(),
      sources.tradingview.enabled
        ? postFilterTradingView(sources.tradingview.tickers)
        : Promise.resolve(),
    ])
    setIsSaving(false)
    setSavedPulse(true)
    setTimeout(() => setSavedPulse(false), 2000)
  }

  return {
    sources,
    isHydrating,
    isSaving,
    savedPulse,
    toggleSource,
    handleRedditChange,
    handleTickerInput,
    handleTickerKeyDown,
    removeTicker,
    handleSave,
  }
}
