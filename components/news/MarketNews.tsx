"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

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

interface MarketNewsProps {
  category?: "general" | "forex" | "crypto" | "merger"
}

export default function MarketNews({ category = "general" }: MarketNewsProps) {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState(category)

  const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY

  const fetchMarketNews = async (newsCategory: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/news?category=${newsCategory}&token=${FINNHUB_API_KEY}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: NewsArticle[] = await response.json()
      setNews(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch news")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketNews(selectedCategory)
  }, [selectedCategory])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      })
    }
  }

  const categories = [
    { value: "general", label: "General" },
    { value: "crypto", label: "Crypto" },
  ]

  return (
    <Card className="border-border bg-card p-6 h-[450px] overflow-y-auto">
      {/* Header with category filters */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Market News</h2>
        </div>

              {/* Category tabs */}
      <div className="flex items-center overflow-hidden rounded-lg border border-border">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? "bg-card text-foreground hover:bg-card"
                  : "bg-muted/30 text-muted-foreground hover:text-white hover:bg-muted/30"
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
          onClick={() => fetchMarketNews(selectedCategory)}
          disabled={loading}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        
      </div>


      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Loading state */}
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

      {/* News list */}
      {!loading && !error && (
        <div className="max-h-[600px] space-y-3 overflow-y-auto pr-2">
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
                className="group cursor-pointer rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
                onClick={() => window.open(article.url, "_blank")}
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  {/* {article.image && (
                    <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded">
                      <img
                        src={article.image}
                        alt={article.headline}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </div>
                  )} */}

                  {/* Content */}
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
