import { useEffect, useState, KeyboardEvent } from "react"

export type Source = "reddit" | "tradingview"
export type RiskMode = "aggressive" | "conservative"

export const REDDIT_SUBREDDITS = [
  "r/wallstreetbets",
  "r/investing",
  "r/stocks",
  "r/options",
  "r/stockmarket",
] as const

export type Subreddit = (typeof REDDIT_SUBREDDITS)[number]

export interface SourceState {
  enabled: boolean
  selectedSubreddits: Subreddit[]
  tickerInput: string
  tickers: string[]
}

const DEFAULT_STATE: Record<Source, SourceState> = {
  reddit: {
    enabled: true,
    selectedSubreddits: [...REDDIT_SUBREDDITS],
    tickerInput: "",
    tickers: [],
  },
  tradingview: {
    enabled: true,
    selectedSubreddits: [],
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

async function postFilterReddit(subreddits: Subreddit[]) {
  await fetch("/api/filters/reddit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subreddits }),
  })
}

async function postFilterTradingView(tickers: string[]) {
  await fetch("/api/filters/tradingview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tickers }),
  })
}

async function postRiskMode(mode: RiskMode) {
  await fetch("/api/filters/risk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  })
}

// ──────────────────────────────────────────────────────────────────────────────

export function useDevFilters() {
  const [sources, setSources] =
    useState<Record<Source, SourceState>>(DEFAULT_STATE)
  const [riskMode, setRiskMode] = useState<RiskMode>("conservative")
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

  const toggleSubreddit = (subreddit: Subreddit) => {
    setSources((prev) => {
      const current = prev.reddit.selectedSubreddits
      const next = current.includes(subreddit)
        ? current.filter((s) => s !== subreddit)
        : [...current, subreddit]
      return { ...prev, reddit: { ...prev.reddit, selectedSubreddits: next } }
    })
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

  const toggleRiskMode = () => {
    setRiskMode((prev) =>
      prev === "aggressive" ? "conservative" : "aggressive",
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    await Promise.all([
      postToggleNews("reddit", sources.reddit.enabled),
      postToggleNews("tradingview", sources.tradingview.enabled),
      sources.reddit.enabled
        ? postFilterReddit(sources.reddit.selectedSubreddits)
        : Promise.resolve(),
      sources.tradingview.enabled
        ? postFilterTradingView(sources.tradingview.tickers)
        : Promise.resolve(),
      postRiskMode(riskMode),
    ])
    setIsSaving(false)
    setSavedPulse(true)
    setTimeout(() => setSavedPulse(false), 2000)
  }

  return {
    sources,
    riskMode,
    isHydrating,
    isSaving,
    savedPulse,
    toggleSource,
    toggleSubreddit,
    handleTickerInput,
    handleTickerKeyDown,
    removeTicker,
    toggleRiskMode,
    handleSave,
  }
}
