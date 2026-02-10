"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { mockPredictions } from "@/lib/data"
import PredictionCard from "./PredictionCard"
import MarketFilters from "./MarketFilters"
import AutoTradeCard from "./AutoTradeWatchlist" // <--- Import this
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Zap } from "lucide-react"
import ChatComponent from "../chat/chatbot"

export default function PredictionsTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Finance")
  const [watchlistSymbols, setWatchlistSymbols] = useState([
    "AAPL",
    "NVDA",
    "TSLA",
    "GOOGL",
    "AMZN",
    "MSFT",
  ])
  const [chatInput, setChatInput] = useState("")

  // Filter Logic
  const filteredPredictions = mockPredictions.filter((pred) => {
    // 1. Filter by Watchlist (if related symbols exist)
    const matchesWatchlist =
      pred.relatedSymbols.length === 0 ||
      pred.relatedSymbols.some((sym) => watchlistSymbols.includes(sym))

    // 2. Filter by Category
    const matchesCategory =
      selectedCategory === "Finance" || pred.category === selectedCategory

    // 3. Filter by Search Query
    const matchesSearch =
      !searchQuery ||
      pred.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pred.relatedSymbols.some((sym) =>
        sym.toLowerCase().includes(searchQuery.toLowerCase()),
      )

    return matchesWatchlist && matchesCategory && matchesSearch
  })

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      {/* Header & Filters */}
      {/* <div className="mb-6">
        <h1 className="text-foreground text-2xl font-semibold mb-4">
          Prediction Markets
        </h1>

        <MarketFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          watchlistSymbols={watchlistSymbols}
          setWatchlistSymbols={setWatchlistSymbols}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div> */}

      {/* Content Grid */}
      <div className="grid h-[calc(100vh-140px)] grid-cols-1 gap-4 lg:grid-cols-[320px_1fr_320px]">
        {/* Left */}
        <Card className="flex flex-col overflow-y-auto border-border bg-card">
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                News Watcher
              </CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>

          {/* Deep research prompt */}
          {/* <div className="flex items-start gap-2 p-3 mb-3 m-3 rounded-lg bg-muted/30 border border-border">
            <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">
                Add a stock into your watchlist
              </span>{' '}
              to track for upcoming news and alerts!
            </p>
          </div> */}

          {filteredPredictions.map((pred) => (
            <PredictionCard key={pred.id} prediction={pred} />
          ))}
        </Card>
        {/* Middle  */}
        <Card className="flex flex-col overflow-hidden border-border bg-card">
          <ChatComponent />
        </Card>

        {/* Right  */}
        <Card className="flex flex-col overflow-hidden border-border bg-card">
          <AutoTradeCard />
        </Card>

        {filteredPredictions.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No predictions found for your watchlist and filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
