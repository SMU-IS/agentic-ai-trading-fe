"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRightLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TradeEvent } from "@/lib/types"
import LoaderSpinner from "@/components/loader-spinner"
import { transformAlpacaOrderToTrade } from "./utils"
import StatsDropdown from "./StatsDropdown"
import FiltersDropdown from "./FiltersDropdown"
import TradeCard from "./TradeCard"
import Cookies from "js-cookie"

const getToken = () => Cookies.get("jwt") ?? ""

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

  const fetchTradeHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/orders/all`,
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const orders = await res.json()

      const allTrades: TradeEvent[] = []
      for (const order of orders) {
        const mainTrade = transformAlpacaOrderToTrade(order, order.legs)
        if (mainTrade) allTrades.push(mainTrade)
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
    if (filterSymbols.length > 0 && !filterSymbols.includes(trade.symbol))
      return false

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

  // Add these computed values alongside filteredTrades
  const totalRealizedPnL = filteredTrades.reduce((sum, trade) => {
    if (!trade.legs) return sum
    const filledLegs = trade.legs.filter((leg: any) => leg.status === "filled")
    const tradePnL = filledLegs.reduce((legSum: number, leg: any) => {
      const legQty = parseFloat(leg.filled_qty || leg.quantity || "0")
      const legPrice = parseFloat(
        leg.filled_avg_price || leg.limit_price || leg.stop_price || "0",
      )
      return legSum + (legPrice - trade.price) * legQty
    }, 0)
    return sum + tradePnL
  }, 0)

  // unrealized computation
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})

  useEffect(() => {
    const openSymbols = [
      ...new Set(
        trades
          .filter(
            (t) =>
              t.status === "filled" &&
              !t.legs?.some((l: any) => l.status === "filled"),
          )
          .map((t) => t.symbol),
      ),
    ]

    Promise.all(
      openSymbols.map((sym) =>
        fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/yahoo/latest/${sym}`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          },
        )
          .then((r) => r.json())
          .then((d) => ({ sym, price: d.price?.current_price ?? null }))
          .catch(() => ({ sym, price: null })),
      ),
    ).then((results) => {
      const map: Record<string, number> = {}
      results.forEach(({ sym, price }) => {
        if (price) map[sym] = price
      })
      setLivePrices(map)
    })
  }, [trades])

  const totalUnrealizedPnL = filteredTrades
    .filter(
      (t) =>
        t.status === "filled" &&
        !t.legs?.some((l: any) => l.status === "filled"),
    )
    .reduce((sum, t) => {
      const livePrice = livePrices[t.symbol]
      if (!livePrice) return sum
      return sum + (livePrice - t.price) * t.quantity
    }, 0)

  const groupedTrades = filteredTrades.reduce(
    (acc, trade) => {
      const dateKey = trade.date_label
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(trade)
      return acc
    },
    {} as Record<string, TradeEvent[]>,
  )

  return (
    <div className="flex h-full flex-col">
      <Card className="border-border bg-card h-full">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                View Trades ({filteredTrades.length} trades)
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Overview of all trades
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!loading && filteredTrades.length > 0 && (
                <StatsDropdown
                  filteredTrades={filteredTrades}
                  showStats={showStats}
                  setShowStats={setShowStats}
                  totalRealizedPnL={totalRealizedPnL}
                  totalUnrealizedPnL={totalUnrealizedPnL}
                />
              )}
              <FiltersDropdown
                trades={trades}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                filterType={filterType}
                setFilterType={setFilterType}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterSource={filterSource}
                setFilterSource={setFilterSource}
                filterSymbols={filterSymbols}
                setFilterSymbols={setFilterSymbols}
                filterPeriod={filterPeriod}
                setFilterPeriod={setFilterPeriod}
              />
            </div>
          </div>
        </CardHeader>

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
                  <div className="space-y-3">
                    {dateTrades.map((trade) => (
                      <TradeCard
                        key={trade.id}
                        trade={trade}
                        isSelected={selectedTrade?.id === trade.id}
                        onSelect={onSelectTrade}
                      />
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
