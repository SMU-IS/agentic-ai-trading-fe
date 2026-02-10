"use client"

import { useState, useEffect } from "react"
import StockLogo from "@/components/StockLogo"
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  DollarSign,
  Filter,
  Info,
  Bot,
  User,
  AlertTriangle,
  Target,
  Shield,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TradeEvent } from "@/lib/types"

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

    // ✅ Updated status mapping logic
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
    }
  }

  const fetchTradeHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/orders/all`,
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

    // ✅ Updated filter logic
    if (filterStatus === "filled" && trade.status !== "filled") return false
    if (filterStatus === "pending" && trade.status !== "pending") return false
    if (filterStatus === "cancelled" && trade.status !== "cancelled")
      return false

    if (filterSource === "agent" && !trade.is_agent_trade) return false
    if (filterSource === "manual" && trade.is_agent_trade) return false

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
        return "text-green-500 bg-green-500/10 border-green-500/20"
      case "partial":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
      case "pending":
        return "text-yellow-700 bg-yellow-500/10 border-yellow-500/20"
      case "cancelled":
      case "expired":
        return "text-red-500 bg-red-500/10 border-red-500/20"
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20"
    }
  }

  const getRiskStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-500 bg-green-500/10"
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
      <Card className="border-border bg-card">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-xl">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            View Trades ({filteredTrades.length} trades)
          </CardTitle>
          <p className="mt-1 pb-2 text-sm text-muted-foreground">
            Complete history of all trades made manually & by AI Agent
          </p>
          <div className="mt-2 flex items-center gap-2">
            {/* Filter Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-3 w-3" />
                Filters
                {(filterType !== "all" ||
                  filterStatus !== "all" ||
                  filterSource !== "all") && (
                  <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                    Active
                  </span>
                )}
              </Button>

              {showFilters && (
                <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card p-4 shadow-lg">
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Trade Source</h4>
                      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                        <button
                          onClick={() => setFilterSource("all")}
                          className={`h-8 flex-1 rounded text-xs transition-colors ${
                            filterSource === "all"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted-foreground/10"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setFilterSource("agent")}
                          className={`flex h-8 flex-1 items-center justify-center gap-1 rounded text-xs transition-colors ${
                            filterSource === "agent"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted-foreground/10"
                          }`}
                        >
                          <Bot className="h-3 w-3" />
                          Agent
                        </button>
                        <button
                          onClick={() => setFilterSource("manual")}
                          className={`flex h-8 flex-1 items-center justify-center gap-1 rounded text-xs transition-colors ${
                            filterSource === "manual"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted-foreground/10"
                          }`}
                        >
                          <User className="h-3 w-3" />
                          Manual
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium">Trade Type</h4>
                      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                        <button
                          onClick={() => setFilterType("all")}
                          className={`h-8 flex-1 rounded text-xs transition-colors ${
                            filterType === "all"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted-foreground/10"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setFilterType("buy")}
                          className={`flex h-8 flex-1 items-center justify-center gap-1 rounded text-xs transition-colors ${
                            filterType === "buy"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted-foreground/10"
                          }`}
                        >
                          <TrendingUp className="h-3 w-3" />
                          Buys
                        </button>
                        <button
                          onClick={() => setFilterType("sell")}
                          className={`flex h-8 flex-1 items-center justify-center gap-1 rounded text-xs transition-colors ${
                            filterType === "sell"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted-foreground/10"
                          }`}
                        >
                          <TrendingDown className="h-3 w-3" />
                          Sells
                        </button>
                      </div>
                    </div>

                    {/* ✅ Updated Status Filter with 4 options */}
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Status</h4>
                      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                        <button
                          onClick={() => setFilterStatus("all")}
                          className={`h-8 rounded text-xs transition-colors ${
                            filterStatus === "all"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted-foreground/10"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setFilterStatus("filled")}
                          className={`h-8 rounded text-xs transition-colors ${
                            filterStatus === "filled"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted-foreground/10"
                          }`}
                        >
                          Filled
                        </button>
                        <button
                          onClick={() => setFilterStatus("pending")}
                          className={`h-8 rounded text-xs transition-colors ${
                            filterStatus === "pending"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted-foreground/10"
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => setFilterStatus("cancelled")}
                          className={`h-8 rounded text-xs transition-colors ${
                            filterStatus === "cancelled"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted-foreground/10"
                          }`}
                        >
                          Cancelled
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Dropdown */}
            {!loading && filteredTrades.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowStats(!showStats)}
                >
                  <Info className="mr-2 h-3 w-3" />
                  Statistics
                </Button>

                {showStats && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card p-4 shadow-lg">
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
                        <div className="text-xl font-bold text-foreground">
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
                        <div className="text-xl font-bold text-green-500">
                          {
                            filteredTrades.filter((t) => t.trade_type === "buy")
                              .length
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
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        {/* Scrollable Content Area */}
        <CardContent className="h-[calc(100vh-300px)] min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading trade history...
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
                              <div className="flex flex-row items-center gap-2 flex-1 text-sm font-semibold">
                                <StockLogo
                                  symbol={trade.symbol}
                                  name={trade.symbol}
                                  size="sm"
                                />
                                <p className="text-sm">{trade.symbol}</p>
                              </div>

                              {/* Agent/Manual Badge */}
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

                              <div className="bg-muted/50 border p-3 flex flex-row gap-2 rounded-xl">
                                <div
                                  className={`flex-1 rounded border px-2 py-1 text-xs font-medium ${
                                    trade.trade_type === "buy"
                                      ? "border-green-500/20 bg-green-500/10 text-green-500"
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

                          {trade.trigger_reason && (
                            <div className="mb-2 text-xs text-muted-foreground">
                              <span className="font-medium">Trigger:</span>{" "}
                              {trade.trigger_reason}
                            </div>
                          )}

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

      {/* Click outside to close dropdowns */}
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
