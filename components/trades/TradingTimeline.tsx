"use client"

import { useState, useEffect } from "react"
import StockLogo from "@/components/StockLogo"
import { motion, LayoutGroup, AnimatePresence } from "framer-motion"
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  DollarSign,
  Filter,
  Info,
  Bot,
  User,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TradeEvent } from "@/lib/types"
import LoaderSpinner from "@/components/loader-spinner"

interface TradingTimelineProps {
  selectedTrade: TradeEvent | null
  onSelectTrade: (trade: TradeEvent) => void
}

export default function TradingTimeline({
  selectedTrade,
  onSelectTrade,
}: TradingTimelineProps) {
  const [trades, setTrades] = useState<TradeEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<"all" | "buy" | "sell">("all")
  const [filterStatus, setFilterStatus] = useState<
    "all" | "filled" | "pending" | "cancelled"
  >("all")
  const [filterSource, setFilterSource] = useState<"all" | "agent" | "manual">(
    "all",
  )
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [filterSymbols, setFilterSymbols] = useState<string[]>([])
  const [filterPeriod, setFilterPeriod] = useState("all")

  useEffect(() => {
    fetchTradeHistory()
  }, [])

  const transformAlpacaOrderToTrade = (
    order: any,
    legs?: any[] | null,
  ): TradeEvent | null => {
    const qty = parseFloat(order.qty || order.filled_qty || "0")
    const price = parseFloat(order.filled_avg_price || order.limit_price || "0")
    const totalValue = qty * price

    if (qty === 0) return null

    let status: "filled" | "partial" | "pending" | "cancelled" | "expired" =
      "pending"

    if (order.status === "filled") {
      status = "filled"
    } else if (order.status === "partially_filled") {
      status = "partial"
    } else if (order.status === "canceled" || order.status === "cancelled") {
      status = "cancelled"
    } else if (order.status === "expired") {
      status = "expired"
    } else if (
      [
        "accepted",
        "held",
        "pending",
        "new",
        "pending_new",
        "accepted_for_bidding",
      ].includes(order.status)
    ) {
      status = "pending"
    }

    const timestamp = order.filled_at || order.submitted_at || order.created_at
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    let dateLabel = ""
    if (isToday) {
      dateLabel = "Today"
    } else if (isYesterday) {
      dateLabel = "Yesterday"
    } else {
      dateLabel = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      })
    }

    const timeLabel = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    const isAgentTrade = order.is_trading_agent === true

    return {
      id: order.id,
      symbol: order.symbol,
      timestamp,
      datetime: order.created_at,
      date_label: dateLabel,
      time_label: timeLabel,
      trade_type: order.side as "buy" | "sell",
      quantity: qty,
      price,
      total_value: totalValue,
      order_type: order.order_type || order.type,
      order_class: order.order_class || "simple",
      status,
      is_agent_trade: isAgentTrade,
      trigger_reason: isAgentTrade ? "AI Agent trade" : "Manual trade",

      // Agent reasoning data
      trading_agent_reasonings: order.trading_agent_reasonings,
      risk_evaluation: order.risk_evaluation,
      risk_adjustments_made: order.risk_adjustments_made,

      legs: legs ?? (Array.isArray(order.legs) ? order.legs : undefined),

      // ── Signal data — null if not present ────────────────────────────────
      signal_data: order.signal_data ?? null,

      closed_position: order.closed_position ?? null,
    }
  }

  const fetchTradeHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/orders/all`,
        { credentials: "include" },
      )

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const orders = await res.json()

      const allTrades: TradeEvent[] = []

      for (const order of orders) {
        const mainTrade = transformAlpacaOrderToTrade(order, order.legs)
        if (mainTrade) {
          allTrades.push(mainTrade)
        }
      }

      allTrades.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )

      setTrades(allTrades)
    } catch (error) {
      console.error("Error fetching trade history:", error)
      setTrades([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTrades = trades.filter((trade) => {
    if (filterType !== "all" && trade.trade_type !== filterType) return false

    if (filterStatus === "filled" && trade.status !== "filled") return false
    if (filterStatus === "pending" && trade.status !== "pending") return false
    if (filterStatus === "cancelled" && trade.status !== "cancelled")
      return false

    if (filterSource === "agent" && !trade.is_agent_trade) return false
    if (filterSource === "manual" && trade.is_agent_trade) return false

    // Symbol filter
    if (filterSymbols.length > 0 && !filterSymbols.includes(trade.symbol))
      return false

    // Period filter
    if (filterPeriod !== "all") {
      const tradeDate = new Date(trade.timestamp)
      const now = new Date()
      if (filterPeriod === "today") {
        if (tradeDate.toDateString() !== now.toDateString()) return false
      } else if (filterPeriod === "week") {
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        if (tradeDate < weekAgo) return false
      } else if (filterPeriod === "month") {
        if (
          tradeDate.getMonth() !== now.getMonth() ||
          tradeDate.getFullYear() !== now.getFullYear()
        )
          return false
      } else if (filterPeriod === "3months") {
        const threeMonthsAgo = new Date(now)
        threeMonthsAgo.setMonth(now.getMonth() - 3)
        if (tradeDate < threeMonthsAgo) return false
      } else if (filterPeriod === "year") {
        if (tradeDate.getFullYear() !== now.getFullYear()) return false
      }
    }

    return true
  })

  const groupedTrades = filteredTrades.reduce(
    (acc, trade) => {
      const dateKey = trade.date_label
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(trade)
      return acc
    },
    {} as Record<string, TradeEvent[]>,
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "filled":
        return "text-green-600 bg-muted/10 border-none"
      case "partial":
        return "text-yellow-500 bg-muted/10 border-none "
      case "pending":
        return "text-yellow-700 bg-muted/10 border-none "
      case "cancelled":
      case "expired":
        return "text-red-500 bg-muted/10  border-none"
      default:
        return "text-gray-500 bg-muted/10 border-none"
    }
  }

  const getRiskStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600 bg-green-500/10"
      case "WARNING":
        return "text-yellow-500 bg-yellow-500/10"
      case "REJECTED":
        return "text-red-500 bg-red-500/10"
      default:
        return "text-gray-500 bg-gray-500/10"
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Card className="border-border bg-card h-full">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            {/* Left - Title & Description */}
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                View Trades ({filteredTrades.length} trades)
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Overview of all trades
              </p>
            </div>

            {/* Right - Buttons */}
            <div className="flex items-center gap-2">
              {/* Stats Dropdown */}
              {!loading && filteredTrades.length > 0 && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-lg border border-foreground/30 bg-muted text-foreground hover:bg-muted/20"
                    onClick={() => setShowStats(!showStats)}
                  >
                    <Info className="mr-2 h-3 w-3" />
                    Statistics
                  </Button>

                  <AnimatePresence>
                    {showStats && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                        className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card p-4 shadow-lg"
                      >
                        <h4 className="mb-3 text-sm font-medium">
                          Trading Statistics
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-muted/50 p-3">
                            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                              <ArrowRightLeft className="h-3 w-3" />
                              <span className="text-xs">Total Trades</span>
                            </div>
                            <div className="text-xl font-bold">
                              {filteredTrades.length}
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3">
                            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              <span className="text-xs">Total Volume</span>
                            </div>
                            <div className="text-xl font-bold">
                              $
                              {filteredTrades
                                .reduce((sum, t) => sum + t.total_value, 0)
                                .toFixed(0)}
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3">
                            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                              <Bot className="h-3 w-3" />
                              <span className="text-xs">Agent Trades</span>
                            </div>
                            <div className="text-xl font-bold text-primary">
                              {
                                filteredTrades.filter((t) => t.is_agent_trade)
                                  .length
                              }
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3">
                            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="text-xs">Manual Trades</span>
                            </div>
                            <div className="text-xl font-bold">
                              {
                                filteredTrades.filter((t) => !t.is_agent_trade)
                                  .length
                              }
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3">
                            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              <span className="text-xs">Buy Orders</span>
                            </div>
                            <div className="text-xl font-bold text-green-600">
                              {
                                filteredTrades.filter(
                                  (t) => t.trade_type === "buy",
                                ).length
                              }
                            </div>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3">
                            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                              <TrendingDown className="h-3 w-3" />
                              <span className="text-xs">Sell Orders</span>
                            </div>
                            <div className="text-xl font-bold text-red-500">
                              {
                                filteredTrades.filter(
                                  (t) => t.trade_type === "sell",
                                ).length
                              }
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Filter Dropdown */}
              <div className="relative">
                <Button
                  size="sm"
                  className="h-8 text-xs rounded-lg border border-foreground/30 bg-muted text-foreground hover:bg-muted/20"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="mr-2 h-3 w-3" />
                  Filters
                  <AnimatePresence>
                    {(filterType !== "all" ||
                      filterStatus !== "all" ||
                      filterSource !== "all" ||
                      filterSymbols.length > 0 ||
                      filterPeriod !== "all") && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground"
                      >
                        {[
                          filterType !== "all" ? 1 : 0,
                          filterStatus !== "all" ? 1 : 0,
                          filterSource !== "all" ? 1 : 0,
                          filterSymbols.length > 0 ? 1 : 0,
                          filterPeriod !== "all" ? 1 : 0,
                        ].reduce((a, b) => a + b, 0)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                      className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h4 className="text-sm font-bold">
                          Filters
                          {[
                            filterType !== "all" ? 1 : 0,
                            filterStatus !== "all" ? 1 : 0,
                            filterSource !== "all" ? 1 : 0,
                            filterSymbols.length > 0 ? 1 : 0,
                            filterPeriod !== "all" ? 1 : 0,
                          ].reduce((a, b) => a + b, 0) > 0 && (
                            <span className="ml-2 text-xs font-bold text-muted-foreground">
                              (
                              {[
                                filterType !== "all" ? 1 : 0,
                                filterStatus !== "all" ? 1 : 0,
                                filterSource !== "all" ? 1 : 0,
                                filterSymbols.length > 0 ? 1 : 0,
                                filterPeriod !== "all" ? 1 : 0,
                              ].reduce((a, b) => a + b, 0)}
                              )
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setFilterType("all")
                              setFilterStatus("all")
                              setFilterSource("all")
                              setFilterSymbols([])
                              setFilterPeriod("all")
                            }}
                            className="text-xs font-semibold text-red-500 hover:text-red-400 transition-colors"
                          >
                            Clear All
                          </button>
                          <button
                            onClick={() => setShowFilters(false)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Symbol Filter */}
                        <div>
                          <h4 className="mb-2 text-xs  text-muted-foreground ">
                            Symbol
                          </h4>
                          <AnimatePresence>
                            {filterSymbols.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 30,
                                }}
                                className="flex flex-wrap gap-1.5 mb-2 overflow-hidden"
                              >
                                <AnimatePresence>
                                  {filterSymbols.map((sym) => (
                                    <motion.div
                                      key={sym}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 25,
                                      }}
                                      className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"
                                    >
                                      {sym}
                                      <button
                                        onClick={() =>
                                          setFilterSymbols(
                                            filterSymbols.filter(
                                              (s) => s !== sym,
                                            ),
                                          )
                                        }
                                        className="ml-0.5 rounded-full hover:bg-primary-foreground/20 p-0.5"
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </button>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <input
                            type="text"
                            placeholder="Type a symbol and press Enter..."
                            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = (e.target as HTMLInputElement).value
                                  .trim()
                                  .toUpperCase()
                                if (val && !filterSymbols.includes(val)) {
                                  setFilterSymbols([...filterSymbols, val])
                                }
                                ;(e.target as HTMLInputElement).value = ""
                              }
                            }}
                          />

                          {(() => {
                            const uniqueSymbols = [
                              ...new Set(trades.map((t) => t.symbol)),
                            ]
                              .filter((s) => !filterSymbols.includes(s))
                              .slice(0, 6)
                            return uniqueSymbols.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {uniqueSymbols.map((sym) => (
                                  <motion.button
                                    key={sym}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      setFilterSymbols([...filterSymbols, sym])
                                    }
                                    className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                  >
                                    {sym}
                                  </motion.button>
                                ))}
                              </div>
                            ) : null
                          })()}
                        </div>

                        {/* Date Period */}
                        <div>
                          <h4 className="mb-2 text-xs text-muted-foreground">
                            Date Period
                          </h4>
                          <LayoutGroup id="period">
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { label: "All Time", value: "all" },
                                { label: "Today", value: "today" },
                                { label: "This Week", value: "week" },
                                { label: "This Month", value: "month" },
                                { label: "3 Months", value: "3months" },
                                { label: "This Year", value: "year" },
                              ].map(({ label, value }) => (
                                <button
                                  key={value}
                                  onClick={() => setFilterPeriod(value)}
                                  className="relative h-8 rounded-lg text-xs font-medium border border-border overflow-hidden"
                                >
                                  {filterPeriod === value && (
                                    <motion.div
                                      layoutId="period-active"
                                      className="absolute inset-0 bg-primary"
                                      transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                      }}
                                    />
                                  )}
                                  <span
                                    className={`relative z-10 transition-colors duration-150 ${
                                      filterPeriod === value
                                        ? "text-primary-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </LayoutGroup>
                        </div>

                        {/* Trade Source */}
                        <div>
                          <h4 className="mb-2 text-xs text-muted-foreground ">
                            Trade Source
                          </h4>
                          <LayoutGroup id="source">
                            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                              {[
                                { label: "All", value: "all", icon: null },
                                {
                                  label: "Agent",
                                  value: "agent",
                                  icon: <Bot className="h-3 w-3" />,
                                },
                                {
                                  label: "Manual",
                                  value: "manual",
                                  icon: <User className="h-3 w-3" />,
                                },
                              ].map(({ label, value, icon }) => (
                                <button
                                  key={value}
                                  onClick={() =>
                                    setFilterSource(
                                      value as "all" | "agent" | "manual",
                                    )
                                  }
                                  className="relative h-8 flex-1 flex items-center justify-center gap-1 rounded text-xs z-10"
                                >
                                  {filterSource === value && (
                                    <motion.div
                                      layoutId="source-active"
                                      className="absolute inset-0 bg-primary rounded"
                                      transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                      }}
                                    />
                                  )}
                                  <span
                                    className={`relative z-10 flex items-center gap-1 font-medium transition-colors duration-150 ${
                                      filterSource === value
                                        ? "text-primary-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {icon}
                                    {label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </LayoutGroup>
                        </div>

                        {/* Trade Type */}
                        <div>
                          <h4 className="mb-2 text-xs  text-muted-foreground ">
                            Trade Type
                          </h4>
                          <LayoutGroup id="type">
                            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                              {[
                                { label: "All", value: "all", icon: null },
                                {
                                  label: "Buys",
                                  value: "buy",
                                  icon: <TrendingUp className="h-3 w-3" />,
                                },
                                {
                                  label: "Sells",
                                  value: "sell",
                                  icon: <TrendingDown className="h-3 w-3" />,
                                },
                              ].map(({ label, value, icon }) => (
                                <button
                                  key={value}
                                  onClick={() =>
                                    setFilterType(
                                      value as "all" | "buy" | "sell",
                                    )
                                  }
                                  className="relative h-8 flex-1 flex items-center justify-center gap-1 rounded text-xs z-10"
                                >
                                  {filterType === value && (
                                    <motion.div
                                      layoutId="type-active"
                                      className="absolute inset-0 bg-primary rounded"
                                      transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                      }}
                                    />
                                  )}
                                  <span
                                    className={`relative z-10 flex items-center gap-1 font-medium transition-colors duration-150 ${
                                      filterType === value
                                        ? "text-primary-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {icon}
                                    {label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </LayoutGroup>
                        </div>

                        {/* Status */}
                        <div>
                          <h4 className="mb-2 text-xs text-muted-foreground">
                            Status
                          </h4>
                          <LayoutGroup id="status">
                            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                              {[
                                { label: "All", value: "all" },
                                { label: "Filled", value: "filled" },
                                { label: "Pending", value: "pending" },
                                { label: "Cancelled", value: "cancelled" },
                              ].map(({ label, value }) => (
                                <button
                                  key={value}
                                  onClick={() =>
                                    setFilterStatus(
                                      value as
                                        | "all"
                                        | "filled"
                                        | "pending"
                                        | "cancelled",
                                    )
                                  }
                                  className="relative h-8 rounded text-xs z-10 overflow-hidden"
                                >
                                  {filterStatus === value && (
                                    <motion.div
                                      layoutId="status-active"
                                      className="absolute inset-0 bg-primary rounded"
                                      transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                      }}
                                    />
                                  )}
                                  <span
                                    className={`relative z-10 font-medium transition-colors duration-150 ${
                                      filterStatus === value
                                        ? "text-primary-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </LayoutGroup>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Scrollable Content Area */}
        <CardContent className="h-[calc(100vh-300px)] min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8 text-center text-muted-foreground">
              <LoaderSpinner customSize="h-10 w-10" />
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No trades found matching your filters
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedTrades).map(([dateLabel, dateTrades]) => (
                <div key={dateLabel}>
                  {/* Date Header */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="text-sm font-semibold text-foreground">
                      {dateLabel}
                    </div>
                    <div className="h-px flex-1 bg-border" />
                    <div className="text-xs text-muted-foreground">
                      {dateTrades.length} trade
                      {dateTrades.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Trades for this date */}
                  <div className="space-y-3">
                    {dateTrades.map((trade) => (
                      <div
                        key={trade.id}
                        onClick={() => onSelectTrade(trade)}
                        className={`group relative flex cursor-pointer gap-4 rounded-lg border-2 p-3 transition-colors ${
                          selectedTrade?.id === trade.id
                            ? "border-primary/20 bg-primary/10"
                            : "border-transparent hover:bg-muted/80"
                        }`}
                      >
                        {/* Timeline Connector */}
                        <div className="flex flex-col items-center pt-1">
                          <div
                            className={`h-3 w-3 rounded-full border-2 ${
                              trade.trade_type === "buy"
                                ? "border-green-500 bg-green-500"
                                : "border-red-500 bg-red-500"
                            }`}
                          />
                          <div className="mt-2 w-0.5 flex-1 bg-border" />
                        </div>

                        {/* Trade Content */}
                        <div className="flex-1">
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="min-w-[70px] text-xs text-muted-foreground">
                                {trade.time_label}
                              </div>

                              {/* Stock/Symbol Name */}
                              <div className="bg-muted/50 border p-2 flex flex-row gap-2 rounded-xl">
                                <div className="flex flex-row items-center gap-2 flex-1 text-sm font-semibold">
                                  <StockLogo
                                    symbol={trade.symbol}
                                    name={trade.symbol}
                                    size="sm"
                                  />
                                  <p className="text-xs">{trade.symbol}</p>
                                </div>
                              </div>

                              <div className="bg-muted/50 border p-2 flex flex-row gap-2 rounded-xl">
                                <div
                                  className={`flex-1 rounded border px-2 py-1 text-xs font-medium ${
                                    trade.trade_type === "buy"
                                      ? "border-green-500/20 bg-green-500/10 text-green-600"
                                      : "border-red-500/20 bg-red-500/10 text-red-500"
                                  }`}
                                >
                                  {trade.trade_type.toUpperCase()}
                                </div>
                                <div
                                  className={`justify-center content-center rounded border px-2 py-0.5 text-xs ${getStatusColor(trade.status)}`}
                                >
                                  {trade.status}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-semibold">
                                {trade.quantity} shares @ $
                                {trade.price.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Total: ${trade.total_value.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            {/* Left side — Orders reason */}
                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Order type: {trade.order_type}</span>
                              {trade.order_class !== "simple" && (
                                <>
                                  <span>•</span>
                                  <span>Class: {trade.order_class}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>ID: {trade.id.slice(0, 8)}...</span>
                            </div>
                            {/* Right side — Agent/Manual Badge */}
                            {trade.is_agent_trade ? (
                              <div className="flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                <Bot className="h-3 w-3" />
                                Agent
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 rounded border border-muted bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                <User className="h-3 w-3" />
                                Manual
                              </div>
                            )}
                          </div>

                          {/* Agent Reasoning Section */}
                          {trade.is_agent_trade &&
                            trade.trading_agent_reasonings && (
                              <div className="mt-3 space-y-3">
                                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <Bot className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-semibold text-primary">
                                      Agent Reasoning
                                    </span>
                                  </div>
                                  <p className="text-xs leading-relaxed text-foreground line-clamp-2">
                                    {trade.trading_agent_reasonings}
                                  </p>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(showFilters || showStats) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowFilters(false)
            setShowStats(false)
          }}
        />
      )}
    </div>
  )
}
