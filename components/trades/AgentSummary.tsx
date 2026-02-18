"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, TrendingUp, TrendingDown } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { accessToken } from "@/app/util/getAccessToken"

type SavedQuery = {
  id: string
  title: string
  query: string
}

const SAVED_QUERIES: SavedQuery[] = [
  {
    id: "since-last-login",
    title: "Trades made by agent since last login",
    query: "Show me a summary of agent trades since last login",
  },
  {
    id: "past-7-days",
    title: "Trades made by agent in the past 7 days",
    query: "Show me a summary of agent trades in the past 7 days",
  },
  {
    id: "high-volume",
    title: "High volume today",
    query: "Find stocks with unusually high trading volume today",
  },
  {
    id: "tech-growth",
    title: "Tech growth potential",
    query: "Analyze technology stocks showing growth indicators",
  },
]

const PLACEHOLDERS = [
  "Ask about stocks or market trends...",
  "Which stocks are performing well today?",
  "Show me high dividend stocks...",
]

const loadingStages = ["thinking", "consolidating trades"]

export default function AgentSummary() {
  const [inputValue, setInputValue] = useState("")
  const [currentQuery, setCurrentQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [tradesData, setTradesData] = useState<any[] | null>(null)
  const [statsData, setStatsData] = useState<any>(null)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)
  const [lastLoginTime] = useState<Date>(() => {
    const storedPreviousLogin = localStorage.getItem("previousLoginTime")
    if (storedPreviousLogin) {
      return new Date(storedPreviousLogin)
    }
    const storedCurrentLogin = localStorage.getItem("lastLoginTime")
    if (storedCurrentLogin) {
      return new Date(storedCurrentLogin)
    }
    return new Date(Date.now() - 24 * 60 * 60 * 1000)
  })

  const hasQueried = loading || !!result

  // Typing animation effect for placeholder
  useEffect(() => {
    const currentText = PLACEHOLDERS[placeholderIndex]
    const typingSpeed = isDeleting ? 30 : 50
    const pauseTime = 2000

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayedPlaceholder.length < currentText.length) {
          setDisplayedPlaceholder(
            currentText.slice(0, displayedPlaceholder.length + 1),
          )
        } else {
          setTimeout(() => setIsDeleting(true), pauseTime)
        }
      } else {
        if (displayedPlaceholder.length > 0) {
          setDisplayedPlaceholder(displayedPlaceholder.slice(0, -1))
        } else {
          setIsDeleting(false)
          setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length)
        }
      }
    }, typingSpeed)

    return () => clearTimeout(timeout)
  }, [displayedPlaceholder, isDeleting, placeholderIndex])

  // Loading stages animation
  useEffect(() => {
    if (!loading) {
      setCurrentStage(0)
      return
    }

    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= loadingStages.length - 1) {
          return prev
        }
        return prev + 1
      })
    }, 2000)

    return () => clearInterval(stageInterval)
  }, [loading])

  // Handle "since-last-login" logic
  const processSinceLastLogin = (trades: any[]) => {
    const tradesSinceLogin = trades.filter((trade) => {
      const tradeTime = new Date(trade.created_at)
      return tradeTime.getTime() > lastLoginTime.getTime()
    })

    if (tradesSinceLogin.length === 0) {
      return {
        stats: null,
        trades: [],
      }
    }

    const filled = tradesSinceLogin.filter((t) => t.status === "filled")
    const pending = tradesSinceLogin.filter((t) =>
      ["accepted", "pending", "new"].includes(t.status),
    )
    const cancelled = tradesSinceLogin.filter((t) => t.status === "canceled")

    const totalBuys = tradesSinceLogin.filter((t) => t.side === "buy").length
    const totalSells = tradesSinceLogin.filter((t) => t.side === "sell").length

    // Calculate P/L for filled trades only
    let totalPL = 0
    const buyTrades = new Map<string, { qty: number; totalCost: number }>()

    // Process trades in chronological order
    const sortedTrades = [...tradesSinceLogin].sort(
      (a, b) =>
        new Date(a.filled_at || a.created_at).getTime() -
        new Date(b.filled_at || b.created_at).getTime(),
    )

    sortedTrades.forEach((trade) => {
      if (trade.status !== "filled") return

      const qty = parseFloat(trade.filled_qty || trade.qty || "0")
      const price = parseFloat(
        trade.filled_avg_price || trade.limit_price || "0",
      )
      const symbol = trade.symbol

      if (trade.side === "buy") {
        // Track buy position
        const existing = buyTrades.get(symbol) || { qty: 0, totalCost: 0 }
        buyTrades.set(symbol, {
          qty: existing.qty + qty,
          totalCost: existing.totalCost + qty * price,
        })
      } else if (trade.side === "sell") {
        // Calculate P/L on sell
        const buyPosition = buyTrades.get(symbol)
        if (buyPosition && buyPosition.qty > 0) {
          const avgBuyPrice = buyPosition.totalCost / buyPosition.qty
          const pl = (price - avgBuyPrice) * qty
          totalPL += pl

          // Update or remove buy position
          const remainingQty = buyPosition.qty - qty
          if (remainingQty > 0) {
            buyTrades.set(symbol, {
              qty: remainingQty,
              totalCost: avgBuyPrice * remainingQty,
            })
          } else {
            buyTrades.delete(symbol)
          }
        }
      }
    })

    return {
      stats: {
        lastLogin: lastLoginTime.toLocaleString(),
        totalTrades: tradesSinceLogin.length,
        filled: filled.length,
        pending: pending.length,
        cancelled: cancelled.length,
        totalBuys,
        totalSells,
        totalPL, // Add P/L to stats
      },
      trades: tradesSinceLogin,
    }
  }

  // Handle "past-7-days" logic
  const processPast7Days = (trades: any[]) => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const tradesPast7Days = trades.filter((trade) => {
      const tradeTime = new Date(trade.created_at)
      return tradeTime.getTime() > sevenDaysAgo.getTime()
    })

    if (tradesPast7Days.length === 0) {
      return {
        stats: null,
        trades: [],
      }
    }

    const filled = tradesPast7Days.filter((t) => t.status === "filled")
    const pending = tradesPast7Days.filter((t) =>
      ["accepted", "pending", "new"].includes(t.status),
    )
    const cancelled = tradesPast7Days.filter((t) => t.status === "canceled")

    const totalBuys = tradesPast7Days.filter((t) => t.side === "buy").length
    const totalSells = tradesPast7Days.filter((t) => t.side === "sell").length

    // Calculate P/L for filled trades only
    let totalPL = 0
    const buyTrades = new Map<string, { qty: number; totalCost: number }>()

    // Process trades in chronological order
    const sortedTrades = [...tradesPast7Days].sort(
      (a, b) =>
        new Date(a.filled_at || a.created_at).getTime() -
        new Date(b.filled_at || b.created_at).getTime(),
    )

    sortedTrades.forEach((trade) => {
      if (trade.status !== "filled") return

      const qty = parseFloat(trade.filled_qty || trade.qty || "0")
      const price = parseFloat(
        trade.filled_avg_price || trade.limit_price || "0",
      )
      const symbol = trade.symbol

      if (trade.side === "buy") {
        // Track buy position
        const existing = buyTrades.get(symbol) || { qty: 0, totalCost: 0 }
        buyTrades.set(symbol, {
          qty: existing.qty + qty,
          totalCost: existing.totalCost + qty * price,
        })
      } else if (trade.side === "sell") {
        // Calculate P/L on sell
        const buyPosition = buyTrades.get(symbol)
        if (buyPosition && buyPosition.qty > 0) {
          const avgBuyPrice = buyPosition.totalCost / buyPosition.qty
          const pl = (price - avgBuyPrice) * qty
          totalPL += pl

          // Update or remove buy position
          const remainingQty = buyPosition.qty - qty
          if (remainingQty > 0) {
            buyTrades.set(symbol, {
              qty: remainingQty,
              totalCost: avgBuyPrice * remainingQty,
            })
          } else {
            buyTrades.delete(symbol)
          }
        }
      }
    })

    return {
      stats: {
        dateRange: `${sevenDaysAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
        totalTrades: tradesPast7Days.length,
        filled: filled.length,
        pending: pending.length,
        cancelled: cancelled.length,
        totalBuys,
        totalSells,
        totalPL, // Add P/L to stats
      },
      trades: tradesPast7Days,
    }
  }

  // Handle quick query (uses trading orders API)
  const handleQuickQuerySearch = async (queryId: string, query: string) => {
    setCurrentQuery(query)
    setLoading(true)
    setResult(null)
    setTradesData(null)
    setStatsData(null)
    setCurrentStage(0)

    const startTime = Date.now()

    try {
      if (queryId === "since-last-login" || queryId === "past-7-days") {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/orders/all`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )

        if (!response.ok) {
          throw new Error("Failed to fetch trading orders")
        }

        const trades = await response.json()

        // Choose processing function based on query ID
        const { stats, trades: filteredTrades } =
          queryId === "since-last-login"
            ? processSinceLastLogin(trades)
            : processPast7Days(trades)

        if (stats) {
          setStatsData(stats)
          setTradesData(filteredTrades)
          setResult("Trading activity loaded")
        } else {
          const message =
            queryId === "since-last-login"
              ? `No trades have been made since your last login at ${lastLoginTime.toLocaleString()}`
              : "No trades have been made in the past 7 days"
          setResult(message)
        }
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_CHAT_API_URL}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              query: query,
            }),
          },
        )

        if (!response.ok) {
          throw new Error("Query not supported")
        }

        const data = await response.json()
        setResult(data.response || data.result || "No results found")
      }
    } catch (error) {
      console.error("Error processing query:", error)
      setResult("This query is not currently supported by the trades screener.")
    } finally {
      const elapsedTime = Date.now() - startTime
      const minLoadingTime = 7000
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime)

      await new Promise((resolve) => setTimeout(resolve, remainingTime))
      setLoading(false)
    }
  }
  // Handle custom user input (uses chat API)
  const handleCustomSearch = async (userMessage: string) => {
    setCurrentQuery(userMessage)
    setLoading(true)
    setResult(null)
    setTradesData(null)
    setStatsData(null)
    setCurrentStage(0)

    const startTime = Date.now() // Track start time

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: userMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Query not supported")
      }

      const data = await response.json()
      setResult(data.response || data.result || "No results found")
    } catch (error) {
      console.error("Error querying chat API:", error)
      setResult(
        "This query is not currently supported by the finance screener.",
      )
    } finally {
      // Ensure minimum 3 second loading time
      const elapsedTime = Date.now() - startTime
      const minLoadingTime = 7000
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime)

      await new Promise((resolve) => setTimeout(resolve, remainingTime))
      setLoading(false)
    }
  }

  const handleQuickQuery = (query: SavedQuery) => {
    setInputValue(query.query)
    handleQuickQuerySearch(query.id, query.query)
  }

  const handleSubmit = () => {
    handleCustomSearch(inputValue)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "filled":
        return "text-green-500 bg-green-500/10 border-green-500/20"
      case "partial":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
      case "pending":
      case "accepted":
      case "new":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20"
      case "canceled":
        return "text-red-500 bg-red-500/10 border-red-500/20"
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20"
    }
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <p className="text-md font-semibold text-foreground">Trades Screener</p>
      </div>

      {/* Input Section */}
      <div>
        <div className="flex gap-2">
          <div className="relative flex-1 bg-card rounded-2xl border">
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder={displayedPlaceholder}
                disabled={loading}
                className="z-10 absolute inset-x-3 mt-3 h-32 resize-none rounded-2xl border border-1 bg-muted px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                rows={1}
              />
              <Button
                onClick={handleSubmit}
                disabled={loading || !inputValue.trim()}
                size="icon"
                className="z-10 absolute bottom-14 top-20 mt-2 right-6 flex-shrink-0"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              {/* Quick Query Buttons */}
              <div className="absolute z-20 top-20 left-6 flex flex-wrap gap-2 mt-2">
                {SAVED_QUERIES.map((query) => (
                  <Button
                    key={query.id}
                    size="sm"
                    onClick={() => handleQuickQuery(query)}
                    disabled={loading}
                    className="bg-card text-foreground text-xs hover:bg-card/50"
                  >
                    {query.title}
                  </Button>
                ))}
              </div>
            </div>

            {/* Results Section */}
            <div className="relative">
              {/* Matrix Container - Always visible */}
              <div
                className={`flex flex-col items-center justify-center my-3 mt-40 mx-3 rounded-2xl border relative overflow-hidden ${
                  hasQueried
                    ? "border-teal-400/40 bg-muted/30 backdrop-blur-2xl min-h-[250px]"
                    : "border-border bg-muted/30 h-[250px]"
                }`}
              >
                {/* Dot Matrix Background - Changes based on loading state */}
                <div className="absolute inset-0 p-4">
                  {Array.from({ length: 50 }).map((_, i) =>
                    Array.from({ length: 50 }).map((_, j) => {
                      const gap = 25
                      const totalDots = 50 * 50 // 2500 dots
                      const dotsPerSecond = 10
                      const avgCycleDuration = totalDots / dotsPerSecond // 500 seconds total cycle

                      // Random delay spread across the full cycle
                      const delay = Math.random() * avgCycleDuration

                      // Duration of each individual pulse (how long it takes to light up and fade)
                      const pulseDuration = 0.7 // 0.5 seconds per pulse (quick flash)

                      return (
                        <div
                          key={`${i}-${j}`}
                          className={`absolute w-1 h-1 ${
                            loading ? "bg-foreground/10" : "bg-foreground/5"
                          }`}
                          style={{
                            top: `${i * gap - 20}px`,
                            left: `${j * gap}px`,
                            animation: loading
                              ? `dot-pulse ${pulseDuration}s ease-in-out ${delay}s infinite`
                              : "none",
                          }}
                        />
                      )
                    }),
                  )}
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 w-full">
                  {/* Loading State */}
                  {loading && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                      <p className="text-sm text-muted-foreground">
                        {loadingStages[currentStage]}
                      </p>
                    </div>
                  )}

                  {/* Idle State */}
                  {!loading && !result && (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-sm text-muted-foreground backdrop-blur-sm border-2 p-8 bg-muted/5 rounded-full">
                        Ready to display trades
                      </p>
                    </div>
                  )}

                  {/* Results State */}
                  {result && !loading && (
                    <div className="p-4 max-h-[65vh] overflow-y-auto">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span>Results for: "{currentQuery}"</span>
                        </div>

                        {/* Show result message when no trades data */}
                        {!statsData && result && (
                          <div className="rounded-xl bg-card backdrop-blur-sm p-6">
                            <p className="whitespace-pre-wrap text-left text-foreground">
                              {result}
                            </p>
                          </div>
                        )}

                        {/* Trades Table with Stats Cards */}
                        {tradesData && tradesData.length > 0 && (
                          <div className="space-y-4">
                            {/* Statistics Cards */}
                            {statsData && (
                              <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
                                {/* Total Trades */}
                                <div className="rounded-lg bg-card/95 backdrop-blur-sm border border-border p-3">
                                  <div className="mb-1 text-[10px] font-medium text-muted-foreground">
                                    Total Trades
                                  </div>
                                  <div className="text-xl font-bold text-foreground">
                                    {statsData.totalTrades}
                                  </div>
                                </div>

                                {/* Filled */}
                                <div className="rounded-lg bg-card/95 backdrop-blur-sm border border-border p-3">
                                  <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                    <span className="text-green-500">✅</span>
                                    Filled
                                  </div>
                                  <div className="text-xl font-bold text-green-500">
                                    {statsData.filled}
                                  </div>
                                </div>

                                {/* Pending */}
                                <div className="rounded-lg bg-card/95 backdrop-blur-sm border border-border p-3">
                                  <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                    <span className="text-blue-500">⏳</span>
                                    Pending
                                  </div>
                                  <div className="text-xl font-bold text-blue-500">
                                    {statsData.pending}
                                  </div>
                                </div>

                                {/* Cancelled */}
                                <div className="rounded-lg bg-card/95 backdrop-blur-sm border border-border p-3">
                                  <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                    <span className="text-red-500">❌</span>
                                    Cancelled
                                  </div>
                                  <div className="text-xl font-bold text-red-500">
                                    {statsData.cancelled}
                                  </div>
                                </div>

                                {/* Buy Orders */}
                                <div className="rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-sm border border-green-500/20 p-3">
                                  <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                    Buys
                                  </div>
                                  <div className="text-xl font-bold text-green-500">
                                    {statsData.totalBuys}
                                  </div>
                                </div>

                                {/* Sell Orders */}
                                <div className="rounded-lg bg-gradient-to-br from-red-500/20 to-red-500/5 backdrop-blur-sm border border-red-500/20 p-3">
                                  <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                    <TrendingDown className="h-3 w-3 text-red-500" />
                                    Sells
                                  </div>
                                  <div className="text-xl font-bold text-red-500">
                                    {statsData.totalSells}
                                  </div>
                                </div>

                                {/* P/L - NEW CARD */}
                                <div
                                  className={`rounded-lg backdrop-blur-sm border p-3 ${
                                    statsData.totalPL >= 0
                                      ? "bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/20"
                                      : "bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/20"
                                  }`}
                                >
                                  <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                    {statsData.totalPL >= 0 ? "💰" : "📉"}
                                    P/L
                                  </div>
                                  <div
                                    className={`text-xl font-bold ${
                                      statsData.totalPL >= 0
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {statsData.totalPL >= 0 ? "+" : ""}$
                                    {statsData.totalPL.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Trade Details Table */}
                            <div className="rounded-xl bg-card border p-4">
                              <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-foreground">
                                  Trade Details
                                </h3>
                                {statsData && (
                                  <p className="text-xs text-muted-foreground">
                                    {statsData.lastLogin
                                      ? `Last Login: ${statsData.lastLogin}`
                                      : `Period: ${statsData.dateRange}`}
                                  </p>
                                )}
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-border">
                                      <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                                        Time
                                      </th>
                                      <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                                        Symbol
                                      </th>
                                      <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                                        Side
                                      </th>
                                      <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                                        Quantity
                                      </th>
                                      <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                                        Price
                                      </th>
                                      <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                                        Total
                                      </th>
                                      <th className="pb-3 text-left font-medium text-muted-foreground">
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tradesData.map((trade) => {
                                      const time = new Date(
                                        trade.filled_at || trade.created_at,
                                      ).toLocaleString()
                                      const qty = parseFloat(
                                        trade.filled_qty || trade.qty || "0",
                                      )
                                      const price = parseFloat(
                                        trade.filled_avg_price ||
                                          trade.limit_price ||
                                          "0",
                                      )
                                      const total = qty * price

                                      return (
                                        <tr
                                          key={trade.id}
                                          className="border-b border-border/50 transition-colors hover:bg-muted/30"
                                        >
                                          <td className="py-3 pr-4 text-xs text-muted-foreground">
                                            {time}
                                          </td>
                                          <td className="py-3 pr-4 font-semibold text-foreground">
                                            {trade.symbol}
                                          </td>
                                          <td className="py-3 pr-4">
                                            <span
                                              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
                                                trade.side === "buy"
                                                  ? "bg-green-500/10 text-green-500"
                                                  : "bg-red-500/10 text-red-500"
                                              }`}
                                            >
                                              {trade.side === "buy" ? (
                                                <TrendingUp className="h-3 w-3" />
                                              ) : (
                                                <TrendingDown className="h-3 w-3" />
                                              )}
                                              {trade.side.toUpperCase()}
                                            </span>
                                          </td>
                                          <td className="py-3 pr-4 text-right text-foreground">
                                            {qty}
                                          </td>
                                          <td className="py-3 pr-4 text-right text-foreground">
                                            ${price.toFixed(2)}
                                          </td>
                                          <td className="py-3 pr-4 text-right font-semibold text-foreground">
                                            ${total.toFixed(2)}
                                          </td>
                                          <td className="py-3">
                                            <span
                                              className={`inline-block rounded border px-2 py-0.5 text-xs ${getStatusColor(
                                                trade.status,
                                              )}`}
                                            >
                                              {trade.status}
                                            </span>
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <p className="text-xs text-right text-muted-foreground">
                              Results limited to user trades data. This is not
                              meant to be a global query. Maximum of 1000 trades
                              returned per query.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <style jsx>{`
                  @keyframes dot-pulse {
                    0%,
                    100% {
                      background-color: rgb(255, 255, 255);
                      transform: scale(1);
                    }
                    50% {
                      background-color: rgb(126, 189, 181);
                      transform: scale(1.5);
                    }
                  }
                `}</style>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
