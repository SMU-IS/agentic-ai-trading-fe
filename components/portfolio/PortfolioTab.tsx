'use client'

import { StockWithHistory } from '@/lib/types'
import { useEffect, useState } from 'react'
import HoldingsTable from './HoldingsTable'
import PerformanceChart from './PerformanceChart'
import StockHistoryModal from './StockHistoryModal'
import SummaryCards from './SummaryCards'
import { getCompanyName } from '@/lib/tickerMap'

type AccountResponse = {
  cash: string
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
  side: 'long' | 'short'
}

export default function PortfolioTab() {
  const [selectedStock, setSelectedStock] = useState<StockWithHistory | null>(
    null,
  )
  const [cashValue, setCashValue] = useState<number>(0)
  const [totalValue, setTotalValue] = useState<number>(0)
  const [totalCost, setTotalCost] = useState<number>(0)
  const [totalGain, setTotalGain] = useState<number>(0)
  const [todayChange, setTodayChange] = useState<number>(0)
  const [positions, setPositions] = useState<Position[]>([])
  const [tradingAccStatus, setTradingAccStatus] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // 1) Account (Total Value)
        const accountRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/account`,
        )
        if (!accountRes.ok) throw new Error('Failed to fetch account')
        const account: AccountResponse = await accountRes.json()
        setTotalValue(Number(account.portfolio_value))
        setCashValue(Number(account.cash))
        setTradingAccStatus(true)

        // 2) Positions (for gain/loss and today change)
        const posRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/positions`,
        )
        if (!posRes.ok) throw new Error('Failed to fetch positions')
        const posData: Position[] = await posRes.json()
        setPositions(posData)

        // Aggregate numbers
        let cost = 0
        let gain = 0
        let today = 0

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

  return (
    <>
      <div className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-foreground">
            Your Portfolio
          </h1>

          {loading ? (
            <div className="flex animate-pulse items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-600" />
              <div className="h-3 w-48 rounded bg-gray-600" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  tradingAccStatus ? 'animate-pulse bg-teal-500' : 'bg-red-500'
                }`}
              />
              <p
                className={`text-xs ${
                  tradingAccStatus ? 'text-teal-500' : 'text-red-500'
                }`}
              >
                {tradingAccStatus
                  ? 'Agent M is connected to Alpaca Trading'
                  : 'Alpaca Trading connection failed, please try again later'}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <SummaryCardsSkeleton />
        ) : (
          <SummaryCards
            cash={cashValue}
            totalValue={totalValue}
            totalGain={totalGain}
            totalCost={totalCost}
            todayChange={todayChange}
          />
        )}
      </div>

      <div className="mb-8">
        <PerformanceChart />
      </div>

      <div>
        {loading ? (
          <HoldingsTableSkeleton />
        ) : (
          <HoldingsTable
            stocks={positions.map((p) => ({
              ...p,
              name: getCompanyName(p.symbol), // Add name here
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-border bg-card p-4"
        >
          <div className="mb-3 h-4 w-24 rounded bg-gray-700" />
          <div className="mb-2 h-8 w-32 rounded bg-gray-600" />
          <div className="h-3 w-20 rounded bg-gray-700" />
        </div>
      ))}
    </div>
  )
}

// Holdings Table Skeleton
function HoldingsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-700" />
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-7 gap-4 border-b border-border bg-muted/30 px-6 py-3">
        {[
          'Stock',
          'Shares',
          'Avg Price',
          'Current Price',
          'Market Value',
          'Gain/Loss',
          'Today',
        ].map((_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-gray-700" />
        ))}
      </div>

      {/* Table Rows */}
      {[1, 2, 3, 4, 5].map((row) => (
        <div
          key={row}
          className="grid animate-pulse grid-cols-7 gap-4 border-b border-border px-6 py-4 last:border-b-0"
        >
          {/* Stock Symbol & Name */}
          <div className="space-y-2">
            <div className="h-5 w-16 rounded bg-gray-600" />
            <div className="h-3 w-24 rounded bg-gray-700" />
          </div>

          {/* Other columns */}
          {[1, 2, 3, 4, 5, 6].map((col) => (
            <div key={col} className="flex items-center">
              <div className="h-5 w-20 rounded bg-gray-700" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
