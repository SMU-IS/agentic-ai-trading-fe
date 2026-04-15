import { useEffect, useState, KeyboardEvent } from "react"
import Cookies from "js-cookie"

export type Source = "reddit" | "tradingview"
export type RiskMode = "aggressive" | "conservative" | "custom"

export const REDDIT_SUBREDDITS = [
  "r/wallstreetbets",
  "r/investing",
  "r/stocks",
  "r/options",
  "r/stockmarket",
  "r/stocks_picks",
  "r/shortsqueeze",
  "r/ValueInvesting",
  "r/pennystocks",
  "r/stockstobuytoday",
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

// Map subreddit display format ("r/wallstreetbets") to API format ("wallstreetbets")
function toApiSubreddit(s: Subreddit): string {
  return s.replace(/^r\//, "")
}

// Map API format ("wallstreetbets") back to display format ("r/wallstreetbets")
function fromApiSubreddit(s: string): Subreddit {
  return `r/${s}` as Subreddit
}

// ─── API ───────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BASE_API_URL ?? ""

function getToken(): string {
  return Cookies.get("jwt") ?? ""
}

function getAgentSettingsUrl(): string {
  const userId = sessionStorage.getItem("userId")
  return `${BASE_URL}/trading/decisions/agent-settings/${userId}`
}

interface AgentSettings {
  user_id: string
  risk_profile: RiskMode
  reddit_enabled: boolean
  tradingview_enabled: boolean
  reddit_forums: string[]
  custom_prompt?: string
}

async function fetchAgentSettings(): Promise<AgentSettings | null> {
  const token = getToken()
  if (!token) return null

  const res = await fetch(getAgentSettingsUrl(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

async function postAgentSettings(
  payload: Omit<AgentSettings, "user_id">,
): Promise<AgentSettings | null> {
  const res = await fetch(getAgentSettingsUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) return null
  return res.json()
}

// ──────────────────────────────────────────────────────────────────────────────

export function useDevFilters() {
  const [sources, setSources] =
    useState<Record<Source, SourceState>>(DEFAULT_STATE)
  const [riskMode, setRiskMode] = useState<RiskMode>("conservative")
  const [customPrompt, setCustomPrompt] = useState<string>("")
  const [isHydrating, setIsHydrating] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedPulse, setSavedPulse] = useState(false)

  useEffect(() => {
    fetchAgentSettings()
      .then((settings) => {
        if (!settings) return
        setSources((prev) => ({
          ...prev,
          reddit: {
            ...prev.reddit,
            enabled: settings.reddit_enabled,
            selectedSubreddits: settings.reddit_forums.map(fromApiSubreddit),
          },
          tradingview: {
            ...prev.tradingview,
            enabled: settings.tradingview_enabled,
          },
        }))
        setRiskMode(settings.risk_profile)
        setCustomPrompt(settings.custom_prompt ?? "")
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

  const toggleRiskMode = (mode: RiskMode) => {
    setRiskMode(mode)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await postAgentSettings({
      risk_profile: riskMode,
      reddit_enabled: sources.reddit.enabled,
      tradingview_enabled: sources.tradingview.enabled,
      reddit_forums: sources.reddit.selectedSubreddits.map(toApiSubreddit),
      custom_prompt: customPrompt,
    })
    setIsSaving(false)
    setSavedPulse(true)
    setTimeout(() => setSavedPulse(false), 2000)
  }

  return {
    sources,
    riskMode,
    customPrompt,
    setCustomPrompt,
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
