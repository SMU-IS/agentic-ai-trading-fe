"use client"

import { getCompanyName } from "@/lib/tickerMap"
import { StockWithHistory } from "@/lib/types"
import { useEffect, useState } from "react"
import MarketNews from "../news/MarketNews"
import HoldingsTable from "./HoldingsTable"
import PerformanceChart from "./PerformanceChart"
import StockHistoryModal from "./StockHistoryModal"
import SummaryCards from "./SummaryCards"
import { Card, CardHeader, CardContent } from "../ui/card"
import Cookies from "js-cookie"


const getToken = () => Cookies.get("jwt") ?? ""


export interface TradeEvent {
  id: string
  symbol: string
  timestamp: string
  date_label: string
  time_label: string
  trade_type: "buy" | "sell"
  quantity: number
  price: number
  total_value: number
  order_type: "market" | "limit" | "stop" | "bracket"
  status: "filled" | "partial" | "pending" | "cancelled"
  trigger_reason?: string
  narrative_context?: {
    platform: string
    author: string
    credibility: number
    summary: string
  }
  pnl?: number
  pnl_percent?: number
}


type AccountResponse = {
  non_marginable_buying_power: string
  portfolio_value: string
}


type Position = {
  symbol: string
  qty: string
  market_value: string
  cost_basis: string
  unrealized_pl: string
  unrealized_intraday_pl: string
  current_price: string
  change_today: string
  side: "long" | "short"
}


/** Returns true if the current US/Eastern time is within standard market hours (Mon–Fri 09:30–16:00). */
function isMarketOpen(): boolean {
  const now = new Date()
  // Convert to US Eastern Time
  const etString = now.toLocaleString("en-US", { timeZone: "America/New_York" })
  const et = new Date(etString)
  const day = et.getDay()          // 0 = Sun, 6 = Sat
  const hours = et.getHours()
  const minutes = et.getMinutes()
  const totalMinutes = hours * 60 + minutes
  // Mon–Fri only, 09:30 (570) to 16:00 (960) exclusive
  if (day === 0 || day === 6) return false
  return totalMinutes >= 570 && totalMinutes < 960
}


/** Returns the current US Eastern time formatted as "HH:MM:SS AM/PM ET". */
function useUSEasternTime(): string {
  const [time, setTime] = useState("")

  useEffect(() => {
    const update = () => {
      const formatted = new Date().toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
      setTime(`${formatted} ET`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return time
}


export default function PortfolioTab() {
  const [selectedStock, setSelectedStock] = useState<StockWithHistory | null>(null)
  const [cashValue, setCashValue] = useState<number>(0)
  const [totalValue, setTotalValue] = useState<number>(0)
  const [totalCost, setTotalCost] = useState<number>(0)
  const [totalGain, setTotalGain] = useState<number>(0)
  const [todayChange, setTodayChange] = useState<number>(0)
  const [positions, setPositions] = useState<Position[]>([])
  const [tradingAccStatus, setTradingAccStatus] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [selectedTrade, setSelectedTrade] = useState<TradeEvent | null>(null)
  const [marketOpen, setMarketOpen] = useState<boolean>(false)

  const usTime = useUSEasternTime()


  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const accountRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/account`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        )
        if (!accountRes.ok) throw new Error("Failed to fetch account")
        const account: AccountResponse = await accountRes.json()
        setTotalValue(Number(account.portfolio_value))
        setCashValue(Number(account.non_marginable_buying_power))
        setTradingAccStatus(true)
        setMarketOpen(isMarketOpen())

        const posRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/positions`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        )
        if (!posRes.ok) throw new Error("Failed to fetch positions")
        const posData: Position[] = await posRes.json()
        setPositions(posData)

        let cost = 0, gain = 0, today = 0
        for (const p of posData) {
          cost += Number(p.cost_basis)
          gain += Number(p.unrealized_pl)
          today += Number(p.unrealized_intraday_pl)
        }
        setTotalCost(cost)
        setTotalGain(gain)
        setTodayChange(today)
      } catch (e) {
        console.error(e)
        setTradingAccStatus(false)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])


  // Recheck market open status every minute
  useEffect(() => {
    if (!tradingAccStatus) return
    const interval = setInterval(() => setMarketOpen(isMarketOpen()), 60_000)
    return () => clearInterval(interval)
  }, [tradingAccStatus])


  return (
    <>
      {/* Status bar */}
      <div className="mb-4">
        <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
          {loading ? (
            <div className="flex animate-pulse items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
            </div>
          ) : (
            <>
              {tradingAccStatus && (
                <>
                  {/* US Eastern Time */}
                  <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="font-mono text-xs text-primary tabular-nums">
                      {usTime}
                    </span>
                  </div>

                  {/* Market Open / Closed */}
                  <div
                    className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${marketOpen
                        ? "border-teal-600/30 bg-teal-600/10 text-teal-600"
                        : "border-border bg-muted/30 text-muted-foreground"
                      }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${marketOpen ? "animate-pulse bg-teal-500" : "bg-muted-foreground"
                        }`}
                    />
                    {marketOpen ? "Market Open" : "Market Closed"}
                  </div>

                  {/* NASDAQ Connected */}
                  <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1">
                    <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-teal-500" />
                    <span className="text-xs text-primary">NASDAQ</span>
                  </div>
                </>
              )}

              {/* Alpaca connection status */}
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${tradingAccStatus ? "animate-pulse bg-teal-600" : "bg-red-500"
                    }`}
                />
                <p
                  className={`text-right text-xs ${tradingAccStatus ? "text-primary" : "text-red-500"
                    }`}
                >
                  {tradingAccStatus
                    ? "Agent M is connected to Alpaca Trading"
                    : "Alpaca Trading connection failed, please try again later"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Summary Cards */}
        {loading ? <SummaryCardsSkeleton /> : (
          <SummaryCards
            non_marginable_buying_power={cashValue}
            totalValue={totalValue}
            totalGain={totalGain}
            totalCost={totalCost}
            todayChange={todayChange}
          />
        )}
      </div>

      {/* Chart + News: stacked on mobile, side-by-side on lg+ */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:flex-[40]">
          <PerformanceChart />
        </div>
        <div className="w-full min-w-0 overflow-hidden lg:flex-[60]">
          <MarketNews category="general" />
        </div>
      </div>

      {/* Holdings Table */}
      <div>
        {loading ? (
          <HoldingsTableSkeleton />
        ) : (
          <HoldingsTable
            stocks={positions.map((p) => ({
              ...p,
              name: getCompanyName(p.symbol),
            }))}
            onSelectStock={setSelectedStock}
          />
        )}
      </div>

      <StockHistoryModal
        stock={selectedStock}
        open={!!selectedStock}
        onOpenChange={(open) => !open && setSelectedStock(null)}
      />
    </>
  )
}


// Summary Cards Skeleton
function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="mb-2 h-8 w-40 animate-pulse rounded bg-muted-foreground/20" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


// Holdings Table Skeleton — scrollable on mobile
function HoldingsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
      </div>

      {/* Scrollable table area */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Table Header */}
          <div className="grid grid-cols-7 gap-4 border-b border-border bg-muted/30 px-6 py-3">
            {[
              "Stock",
              "Shares",
              "Avg Price",
              "Current Price",
              "Market Value",
              "Gain/Loss",
              "Today",
            ].map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" />
            ))}
          </div>

          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="grid animate-pulse grid-cols-7 gap-4 border-b border-border px-6 py-4 last:border-b-0"
            >
              <div className="space-y-2">
                <div className="h-5 w-16 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              {[1, 2, 3, 4, 5, 6].map((col) => (
                <div key={col} className="flex items-center">
                  <div className="h-5 w-20 rounded bg-muted" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}