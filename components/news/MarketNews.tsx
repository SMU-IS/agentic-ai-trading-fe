"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, RefreshCw } from "lucide-react"
import { useEffect, useState, useRef } from "react"

interface NewsArticle {
  category: string
  datetime: number
  headline: string
  id: number
  image: string
  related: string
  source: string
  summary: string
  url: string
}

interface AgentNews {
  type: string
  news_id: string
  headline: string
  tickers: {
    symbol: string
    event_type: string
    sentiment_label: string
  }[]
  event_description: string
}

interface MarketNewsProps {
  category?: "general" | "forex" | "crypto" | "merger" | "agent"
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-green-500 bg-green-500/10 border-green-500/20",
  negative: "text-red-500 bg-red-500/10 border-red-500/20",
  neutral: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
}

export default function MarketNews({ category = "general" }: MarketNewsProps) {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [agentNews, setAgentNews] = useState<AgentNews[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState(category)
  const wsRef = useRef<WebSocket | null>(null)

  const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
  const NOTIF_URL = `${process.env.NEXT_PUBLIC_NOTIF_API_URL}`
  const wsUrl = `${NOTIF_URL}/ws/notifications`

  const fetchMarketNews = async (newsCategory: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/news?category=${newsCategory}&token=${FINNHUB_API_KEY}`,
      )
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)
      const data: NewsArticle[] = await response.json()
      setNews(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch news")
    } finally {
      setLoading(false)
    }
  }

  // Helper to normalize tickers to always be an array
  const normalizeTickers = (
    tickers: AgentNews["tickers"] | string | object,
  ) => {
    if (!tickers) return []
    if (Array.isArray(tickers)) return tickers
    if (typeof tickers === "string")
      return tickers.split(",").map((s) => ({
        symbol: s.trim(),
        event_type: "",
        sentiment_label: "neutral",
      }))
    return [tickers] as AgentNews["tickers"]
  }

  // Connect WebSocket when Agent tab is selected
  useEffect(() => {
    if (selectedCategory === "agent") {
      setLoading(true)
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => setLoading(false)

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type !== "NEWS_RECEIVED") return // ← explicitly ignore everything else

          const normalized = {
            ...data,
            tickers: normalizeTickers(data.tickers),
          }
          setAgentNews((prev) => {
            if (prev.some((n) => n.news_id === normalized.news_id)) return prev
            return [normalized, ...prev]
          })
        } catch {
          // ignore parse errors
        }
      }

      ws.onerror = () => {
        setError("WebSocket connection failed")
        setLoading(false)
      }

      ws.onclose = () => setLoading(false)

      return () => {
        ws.close()
        wsRef.current = null
      }
    } else {
      // Close WS when switching away from Agent tab
      wsRef.current?.close()
      wsRef.current = null
      fetchMarketNews(selectedCategory)
    }
  }, [selectedCategory])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const categories = [
    { value: "general", label: "General" },
    { value: "crypto", label: "Crypto" },
    { value: "agent", label: "Agent" },
  ]

  return (
    <Card className="border-border bg-card/60 p-6 h-[450px] overflow-hidden">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Market News</h2>

        <div className="flex items-center overflow-hidden rounded-lg border border-border">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? "bg-card text-foreground hover:bg-card"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
              onClick={() =>
                setSelectedCategory(cat.value as typeof selectedCategory)
              }
              disabled={loading}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={() =>
            selectedCategory === "agent"
              ? null // WS is live, no manual refresh needed
              : fetchMarketNews(selectedCategory)
          }
          disabled={loading || selectedCategory === "agent"}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="flex gap-3">
                <div className="h-16 w-24 rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-2 w-full rounded bg-muted" />
                  <div className="h-2 w-1/2 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agent News List */}
      {!loading && !error && selectedCategory === "agent" && (
        <div className="max-h-[360px] space-y-3 overflow-y-auto pr-2">
          {agentNews.length === 0 ? (
            <div className="rounded-lg border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Waiting for agent news...
              </p>
            </div>
          ) : (
            agentNews.map((article) => (
              <div
                key={article.news_id}
                className="rounded-lg border border-border bg-muted p-3 transition-all hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
              >
                <h3 className="text-sm font-semibold text-foreground">
                  {article.headline}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {article.event_description}
                </p>

                {/* Ticker badges */}
                <div className="mt-2 flex flex-col gap-1.5">
                  {normalizeTickers(article.tickers).map((ticker) => (
                    <span
                      key={ticker.symbol}
                      className={`inline-flex items-center gap-2 rounded border px-2 py-1 text-xs font-medium w-fit ${
                        SENTIMENT_COLORS[ticker.sentiment_label] ??
                        SENTIMENT_COLORS.neutral
                      }`}
                    >
                      <span className="font-bold">{ticker.symbol}</span>
                      <span className="opacity-70">{ticker.event_type}</span>
                      <span>
                        Sentiment:{" "}
                        {ticker.sentiment_label.charAt(0).toUpperCase() +
                          ticker.sentiment_label.slice(1)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Standard Finnhub News List */}
      {!loading && !error && selectedCategory !== "agent" && (
        <div className="max-h-[360px] space-y-3 overflow-y-auto pr-2">
          {news.length === 0 ? (
            <div className="rounded-lg border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No news available for this category
              </p>
            </div>
          ) : (
            news.map((article) => (
              <div
                key={article.id}
                className="group cursor-pointer rounded-lg border border-border bg-muted p-3 transition-all hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
                onClick={() => window.open(article.url, "_blank")}
              >
                <div className="flex gap-3">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                        {article.headline}
                      </h3>
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {article.summary}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{article.source}</span>
                      <span>•</span>
                      <span>{formatDate(article.datetime)}</span>
                      {article.related && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-xs">
                            {article.related.split(",")[0]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  )
}
