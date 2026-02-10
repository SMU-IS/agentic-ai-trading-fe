"use client"

import { useState } from "react"
import TradingTimeline from "./TradingTimeline"
import SpeculationAgent from "./SpeculationAgent"
import AgentSummary from "./AgentSummary"

export type Trade = {
  id: string
  symbol: string
  name: string
  type: "buy" | "sell"
  shares: number
  price: number
  totalValue: number
  timestamp: string
  status: "pending" | "executed" | "failed"
  reason?: string
}

export default function TradesTab() {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)

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
          <SpeculationAgent selectedTrade={selectedTrade} />
        </div>
      </div>
    </div>
  )
}
