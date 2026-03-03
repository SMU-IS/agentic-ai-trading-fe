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

interface TickerMetadata {
  ticker: string
  event_type: string
  sentiment_score: number
  sentiment_label: string
}

interface AgentNewsItem {
  topic_id: string
  text_content: string
  metadata: {
    topic_id: string
    tickers: string[]
    tickers_metadata: TickerMetadata[]
    timestamp: string
    source_domain: string
    credibility_score: number
    headline: string
    text_content: string
    url: string
    author: string
  }
}

interface AgentNewsResponse {
  status: string
  count: number
  next_offset: string
  data: AgentNewsItem[]
}

interface MarketNewsProps {
  category?: "general" | "forex" | "crypto" | "merger" | "agent"
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-green-500 bg-green-500/10 border-green-500/20",
  negative: "text-red-500 bg-red-500/10 border-red-500/20",
  neutral: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
}

const CREDIBILITY_COLORS = (score: number) => {
  if (score >= 0.8) return "text-green-500 bg-green-500/10 border-green-500/20"
  if (score >= 0.5)
    return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
  return "text-red-500 bg-red-500/10 border-red-500/20"
}

export default function MarketNews({ category = "general" }: MarketNewsProps) {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [agentNews, setAgentNews] = useState<AgentNewsItem[]>([])
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

  const fetchAgentNews = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:8000/api/v1/qdrant/news")
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)
      const data: AgentNewsResponse = await response.json()
      if (data.status === "success") {
        setAgentNews(data.data)
      } else {
        throw new Error("Failed to fetch agent news")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch agent news")
    } finally {
      setLoading(false)
    }
  }

  // WebSocket for live agent notifications (kept for real-time updates)
  useEffect(() => {
    if (selectedCategory === "agent") {
      fetchAgentNews()

      // Also connect WebSocket for live incoming news
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type !== "NEWS_RECEIVED") return

          // Normalize incoming WS message to AgentNewsItem shape
          const normalized: AgentNewsItem = {
            topic_id: data.news_id,
            text_content: data.event_description ?? "",
            metadata: {
              topic_id: data.news_id,
              tickers: data.tickers?.map((t: any) => t.symbol) ?? [],
              tickers_metadata:
                data.tickers?.map((t: any) => ({
                  ticker: t.symbol,
                  event_type: t.event_type ?? "",
                  sentiment_score: 0,
                  sentiment_label: t.sentiment_label ?? "neutral",
                })) ?? [],
              timestamp: new Date().toISOString(),
              source_domain: "",
              credibility_score: 0,
              headline: data.headline,
              text_content: data.event_description ?? "",
              url: "",
              author: "",
            },
          }

          setAgentNews((prev) => {
            if (prev.some((n) => n.topic_id === normalized.topic_id))
              return prev
            return [normalized, ...prev]
          })
        } catch {
          // ignore parse errors
        }
      }

      ws.onerror = () => setError("WebSocket connection failed")

      return () => {
        ws.close()
        wsRef.current = null
      }
    } else {
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

  const formatAgentDate = (isoString: string) => {
    const date = new Date(isoString)
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
              ? fetchAgentNews()
              : fetchMarketNews(selectedCategory)
          }
          disabled={loading}
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
                No agent news available
              </p>
            </div>
          ) : (
            agentNews.map((article) => (
              <div
                key={article.topic_id}
                className="group cursor-pointer rounded-lg border border-border bg-muted p-3 transition-all hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
                onClick={() =>
                  article.metadata.url
                    ? window.open(article.metadata.url, "_blank")
                    : null
                }
              >
                {/* Headline + external link */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                    {article.metadata.headline}
                  </h3>
                  {article.metadata.url && (
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  )}
                </div>

                {/* Summary */}
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {article.metadata.text_content}
                </p>

                {/* Ticker badges */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {article.metadata.tickers_metadata.map((ticker) => (
                    <span
                      key={ticker.ticker}
                      className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium ${
                        SENTIMENT_COLORS[ticker.sentiment_label] ??
                        SENTIMENT_COLORS.neutral
                      }`}
                    >
                      <span className="font-bold">{ticker.ticker}</span>
                      {ticker.event_type && (
                        <span className="opacity-70">{ticker.event_type}</span>
                      )}
                      <span>
                        {ticker.sentiment_label.charAt(0).toUpperCase() +
                          ticker.sentiment_label.slice(1)}
                      </span>
                    </span>
                  ))}
                </div>

                {/* Footer — source, date, credibility */}
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">
                    {article.metadata.source_domain}
                  </span>
                  {article.metadata.author && (
                    <>
                      <span>•</span>
                      <span>{article.metadata.author}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{formatAgentDate(article.metadata.timestamp)}</span>
                  <span>•</span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${CREDIBILITY_COLORS(article.metadata.credibility_score)}`}
                  >
                    {Math.round(article.metadata.credibility_score * 100)}%
                    credible
                  </span>
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
