"use client"

import { useState, useEffect } from "react"
import TradingTimeline from "./trading-timeline/TradingTimeline"
import SpeculationAgent from "./speculation-agent/SpeculationAgent"
import AgentSummary from "./AgentSummary"
import { TradeEvent } from "@/lib/types"
import Cookies from "js-cookie"

const getToken = () => Cookies.get("jwt") ?? ""

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
            credentials: "include",
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        )
        const data = await response.json()
        const holdingsMap: Record<string, HoldingInfo> = {}
        data.forEach((holding: any) => {
          holdingsMap[holding.symbol] = {
            avg_entry_price: parseFloat(holding.avg_entry_price),
            quantity: parseFloat(holding.qty),
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

      <div className="my-8 flex flex-col gap-6 lg:flex-row">
        {/* Trading Timeline — full width on mobile, 55% on desktop */}
        <div className="w-full lg:w-[55%]">
          <TradingTimeline
            selectedTrade={selectedTrade}
            onSelectTrade={setSelectedTrade}
          />
        </div>

        {/* Speculation Agent — full width on mobile, fills remaining on desktop */}
        {/* On mobile: only show when a trade is selected, with a back affordance */}
        <div className="w-full lg:flex-1">
          {/* Mobile: contextual prompt when nothing is selected */}
          {!selectedTrade && (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-sm text-muted-foreground lg:hidden">
              Select a trade from the timeline to analyse it
            </div>
          )}

          {/* Show panel always on desktop, conditionally on mobile */}
          <div className={selectedTrade ? "block" : "h-full hidden lg:block"}>
            {/* Mobile back button */}
            {selectedTrade && (
              <button
                className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors lg:hidden"
                onClick={() => setSelectedTrade(null)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Back to timeline
              </button>
            )}

            <SpeculationAgent
              selectedTrade={selectedTrade}
              holdings={holdings}
            />
          </div>
        </div>
      </div>
    </div>
  )
}