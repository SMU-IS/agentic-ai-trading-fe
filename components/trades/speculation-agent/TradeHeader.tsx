"use client"

import { Bot, User } from "lucide-react"
import { CardTitle } from "@/components/ui/card"
import { TradeEvent } from "@/lib/types"

interface TradeHeaderProps {
  selectedTrade: TradeEvent
}

export default function TradeHeader({ selectedTrade }: TradeHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between flex-shrink-0 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center">
            Trade Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedTrade.is_agent_trade
              ? "Detailed AI agent reasoning and risk analysis"
              : "Detailed breakdown of selected trade"}
          </p>
        </div>
      </div>
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">{selectedTrade.symbol}</span>
          {selectedTrade.is_agent_trade ? (
            <div className="flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
              <Bot className="h-4 w-4" />
              Agent
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded border border-muted bg-muted/50 px-2 py-1 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Manual
            </div>
          )}
          {(() => {
            const isCovering =
              selectedTrade.trade_type === "buy" &&
              selectedTrade.closed_position != null
            const isClosingLong =
              selectedTrade.trade_type === "sell" &&
              selectedTrade.closed_position != null

            let label = selectedTrade.trade_type.toUpperCase()
            let colorClass =
              selectedTrade.trade_type === "buy"
                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20"

            if (isCovering) {
              label = "BUY TO COVER"
              colorClass =
                "bg-blue-500/10 text-blue-500 border border-blue-500/20"
            } else if (isClosingLong) {
              label = "SELL TO CLOSE"
              colorClass =
                "bg-orange-500/10 text-orange-500 border border-orange-500/20"
            }

            return (
              <div
                className={`px-3 py-1 rounded text-sm font-medium ${colorClass}`}
              >
                {label}
              </div>
            )
          })()}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Order</p>
          <div
            className={`text-lg ${
              selectedTrade.status === "filled"
                ? "text-green-500"
                : selectedTrade.status === "expired" ||
                    selectedTrade.status === "cancelled"
                  ? "text-red-500"
                  : "text-yellow-700"
            }`}
          >
            {selectedTrade.status.toUpperCase()}
          </div>
        </div>
      </CardTitle>
      <div className="text-xs text-muted-foreground mt-0 p-0">
        Order Made: {selectedTrade.date_label} at {selectedTrade.time_label}
      </div>
    </>
  )
}
