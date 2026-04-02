"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ExternalLink, RefreshCw } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Cookies from "js-cookie"
import { motion, useInView } from "framer-motion"

const getToken = () => Cookies.get("jwt") ?? ""

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
  next_offset: string | null  // ← null means end of results
  data: AgentNewsItem[]
}

interface MarketNewsProps {
  category?: "general" | "forex" | "merger" | "agent"
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-green-500 bg-green-500/10 border-green-500/20",
  negative: "text-red-500 bg-red-500/10 border-red-500/20",
  neutral: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
}

const SENTIMENT_SCORE_COLORS = (score: number) => {
  if (score > 0.2) return "text-green-500 bg-green-500/10 border-green-500/20"
  if (score < -0.2) return "text-red-500 bg-red-500/10 border-red-500/20"
  return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
}

function avgSentimentScore(tickers: TickerMetadata[]): number | null {
  if (!tickers.length) return null
  const sum = tickers.reduce((acc, t) => acc + t.sentiment_score, 0)
  return sum / tickers.length
}

type AgentSubTab = "reddit" | "tradingview"

export default function MarketNews({ category = "general" }: MarketNewsProps) {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [agentNews, setAgentNews] = useState<AgentNewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState(category)
  const [agentSubTab, setAgentSubTab] = useState<AgentSubTab>("reddit")

  // ── Pagination state ────────────────────────────────────────────────────────
  const [nextOffset, setNextOffset] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)

  const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
  const wsUrl = `${process.env.NEXT_PUBLIC_NOTIF_API_URL}/ws/notifications`

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isLoadMoreInView = useInView(loadMoreRef, {
    // root: the scrollable list container — fires when sentinel is 100px away from the bottom edge
    margin: "0px 0px 0px 0px",
    amount: 1,
  })

  const fetchMarketNews = async (newsCategory: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/news?category=${newsCategory}&token=${FINNHUB_API_KEY}`,
      )
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data: NewsArticle[] = await response.json()
      setNews(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch news")
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetches agent news.
   * - offset = undefined  → fresh load (replaces list, resets pagination)
   * - offset = UUID string → "load more" (appends to list)
   */
  const fetchAgentNews = async (offset?: string) => {
    const token = getToken()
    const isLoadMore = offset !== undefined

    isLoadMore ? setLoadingMore(true) : setLoading(true)
    setError(null)

    try {
      // Build URL — only append offset param when paginating
      const url = new URL(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/qdrant/news`,
      )
      url.searchParams.set("limit", "10")
      if (offset) url.searchParams.set("offset", offset)

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data: AgentNewsResponse = await response.json()

      if (data.status === "success") {
        setAgentNews((prev) => {
          const merged = isLoadMore ? [...prev, ...data.data] : data.data
          return merged.sort(
            (a, b) =>
              new Date(b.metadata.timestamp).getTime() -
              new Date(a.metadata.timestamp).getTime(),
          )
        })

        setNextOffset(data.next_offset ?? null)
        setHasMore(!!data.next_offset)
      } else {
        throw new Error("Failed to fetch agent news")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch agent news")
    } finally {
      isLoadMore ? setLoadingMore(false) : setLoading(false)
    }
  }

  // ── Reset & re-fetch whenever sub-tab changes (only in agent mode) ──────────
  useEffect(() => {
    if (selectedCategory !== "agent") return
    setAgentNews([])
    setNextOffset(null)
    setHasMore(false)
    fetchAgentNews()
  }, [agentSubTab])

  useEffect(() => {
    if (selectedCategory === "agent") {
      // Initial fetch
      setAgentNews([])
      setNextOffset(null)
      setHasMore(false)
      fetchAgentNews()

      const token = getToken()
      if (!token) return

      let userId: string
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        userId = payload.sub ?? payload.user_id ?? payload.id
        if (!userId) throw new Error("user_id not found in token")
      } catch (err) {
        console.error("❌ Failed to decode JWT for user_id:", err)
        return
      }

      const ws = new WebSocket(`${wsUrl}?user_id=${userId}`)
      wsRef.current = ws

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type !== "NEWS_RECEIVED") return

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
                  sentiment_score: t.sentiment_score ?? 0,
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
            if (prev.some((n) => n.topic_id === normalized.topic_id)) return prev
            return [normalized, ...prev].sort(
              (a, b) =>
                new Date(b.metadata.timestamp).getTime() -
                new Date(a.metadata.timestamp).getTime(),
            )
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory])

  useEffect(() => {
    if (isLoadMoreInView && hasMore && !loadingMore && nextOffset) {
      fetchAgentNews(nextOffset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadMoreInView, hasMore])

  const filteredAgentNews = agentNews.filter((item) =>
    item.topic_id.toLowerCase().startsWith(agentSubTab),
  )

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
    { value: "agent", label: "Agent" },
  ]

  const agentSubTabs: { value: AgentSubTab; label: string }[] = [
    { value: "reddit", label: "Reddit" },
    { value: "tradingview", label: "TradingView" },
  ]

  return (
    <Card className="border-border bg-card/60 p-6 h-[450px] w-full overflow-hidden">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Market News</h2>
        <div className="flex items-center overflow-hidden rounded-lg border border-border">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              className={`px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === cat.value
                ? "bg-card text-foreground hover:bg-card"
                : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              onClick={() => setSelectedCategory(cat.value as typeof selectedCategory)}
              disabled={loading}
            >
              {cat.label}
            </Button>
          ))}
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            if (selectedCategory === "agent") {
              // Hard refresh: clear list & cursor, fetch from start
              setAgentNews([])
              setNextOffset(null)
              setHasMore(false)
              fetchAgentNews()
            } else {
              fetchMarketNews(selectedCategory)
            }
          }}
          disabled={loading}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Agent sub-tabs */}
      {selectedCategory === "agent" && (
        <div className="mb-3 flex items-center gap-1 border-b border-border pb-2">
          {agentSubTabs.map((sub) => (
            <button
              key={sub.value}
              onClick={() => setAgentSubTab(sub.value)}
              className={`px-3 py-1 text-xs font-medium tracking-wide rounded transition-colors ${agentSubTab === sub.value
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Loading skeleton (initial load only) */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-muted/30 p-3">
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
        <div className="max-h-[320px] space-y-3 overflow-y-auto pr-2">
          {filteredAgentNews.length === 0 ? (
            <div className="rounded-lg border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No {agentSubTab === "reddit" ? "Reddit" : "TradingView"} news available
              </p>
            </div>
          ) : (
            <>
              {filteredAgentNews.map((article) => {
                const sentScore = avgSentimentScore(article.metadata.tickers_metadata)

                return (
                  <div
                    key={article.topic_id}
                    className="group w-full min-w-0 overflow-hidden cursor-pointer rounded-lg border border-border bg-muted p-3 transition-all hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
                    onClick={() =>
                      article.metadata.url ? window.open(article.metadata.url, "_blank") : null
                    }
                  >
                    {/* Headline + external link */}
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <h3 className="min-w-0 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                        {article.metadata.headline}
                      </h3>
                      {article.metadata.url && (
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                      )}
                    </div>

                    {/* Summary */}
                    <p className="mt-1 min-w-0 line-clamp-2 text-xs text-muted-foreground">
                      {article.metadata.text_content}
                    </p>

                    {/* Ticker badges */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {article.metadata.tickers_metadata.map((ticker) => (
                        <span
                          key={ticker.ticker}
                          className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium ${SENTIMENT_COLORS[ticker.sentiment_label] ?? SENTIMENT_COLORS.neutral
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

                    {/* Footer */}
                    <div className="mt-2 flex w-full min-w-0 items-center gap-2 overflow-hidden text-xs text-muted-foreground">
                      <span className="min-w-0 truncate font-medium">
                        {article.metadata.source_domain}
                      </span>
                      {article.metadata.author && (
                        <>
                          <span className="flex-shrink-0">•</span>
                          <span className="min-w-0 truncate">{article.metadata.author}</span>
                        </>
                      )}
                      <span className="flex-shrink-0">•</span>
                      <span className="flex-shrink-0">
                        {formatAgentDate(article.metadata.timestamp)}
                      </span>
                      {sentScore !== null && (
                        <>
                          <span className="flex-shrink-0">•</span>
                          <span
                            className={`flex-shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${SENTIMENT_SCORE_COLORS(sentScore)}`}
                          >
                            {sentScore > 0 ? "+" : ""}
                            {sentScore.toFixed(2)} sentiment
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* ── Load More button ─────────────────────────────────────── */}
              {/* ── Auto load-more sentinel ──────────────────────────────── */}
              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-3">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={loadingMore ? { opacity: 1, y: 0 } : { opacity: 0.4, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <motion.div
                      animate={loadingMore ? { rotate: 360 } : { rotate: 0 }}
                      transition={
                        loadingMore
                          ? { repeat: Infinity, duration: 0.8, ease: "linear" }
                          : { duration: 0 }
                      }
                    >
                      <RefreshCw className="h-3 w-3" />
                    </motion.div>
                    <span>{loadingMore ? "Loading more…" : "Scroll for more"}</span>
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Standard Finnhub News List */}
      {!loading && !error && selectedCategory !== "agent" && (
        <div className="max-h-[360px] space-y-3 overflow-y-auto">
          {news.length === 0 ? (
            <div className="rounded-lg border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">No news available for this category</p>
            </div>
          ) : (
            news.map((article) => (
              <div
                key={article.id}
                className="group w-full min-w-0 overflow-hidden cursor-pointer rounded-lg border border-border bg-muted p-3 transition-all hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
                onClick={() => window.open(article.url, "_blank")}
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <h3 className="min-w-0 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                      {article.headline}
                    </h3>
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <p className="mt-1 min-w-0 line-clamp-2 text-xs text-muted-foreground">
                    {article.summary}
                  </p>
                  <div className="mt-2 flex w-full min-w-0 items-center gap-2 overflow-hidden text-xs text-muted-foreground">
                    <span className="min-w-0 truncate font-medium">{article.source}</span>
                    <span className="flex-shrink-0">•</span>
                    <span className="flex-shrink-0">{formatDate(article.datetime)}</span>
                    {article.related && (
                      <>
                        <span className="flex-shrink-0">•</span>
                        <span className="flex-shrink-0 font-mono text-xs">
                          {article.related.split(",")[0]}
                        </span>
                      </>
                    )}
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