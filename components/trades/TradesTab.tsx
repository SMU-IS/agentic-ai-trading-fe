"use client"

import { useState, useEffect } from "react"
import TradingTimeline from "./TradingTimeline"
import SpeculationAgent from "./SpeculationAgent"
import AgentSummary from "./AgentSummary"
import { TradeEvent } from "@/lib/types"
import { accessToken } from "@/app/util/getAccessToken"

interface HoldingInfo {
  avg_entry_price: number
  quantity: number
}

export default function TradesTab() {
  const [selectedTrade, setSelectedTrade] = useState<TradeEvent | null>(null)
  const [holdings, setHoldings] = useState<Record<string, HoldingInfo>>({})
  const [holdingsLoading, setHoldingsLoading] = useState(true)

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/positions`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        )
        const data = await response.json()
        console.log("testing", data)

        // Transform your API response into the shape SpeculationAgent expects:
        // { AAPL: { avg_entry_price: 150.00, quantity: 7 }, TSLA: { ... } }
        const holdingsMap: Record<string, HoldingInfo> = {}
        data.forEach((holding: any) => {
          holdingsMap[holding.symbol] = {
            avg_entry_price: parseFloat(holding.avg_entry_price), // "325.615" → 325.615
            quantity: parseFloat(holding.qty), // "20" → 20
          }
        })

        setHoldings(holdingsMap)
      } catch (err) {
        console.error("Failed to fetch holdings:", err)
      } finally {
        setHoldingsLoading(false)
      }
    }

    fetchHoldings()
  }, [])

  return (
    <div>
      <AgentSummary />
      <div className="my-8 flex gap-6">
        <div className="w-[55%]">
          <TradingTimeline
            selectedTrade={selectedTrade}
            onSelectTrade={setSelectedTrade}
          />
        </div>
        <div className="flex-1">
          <SpeculationAgent selectedTrade={selectedTrade} holdings={holdings} />
        </div>
      </div>
    </div>
  )
}
