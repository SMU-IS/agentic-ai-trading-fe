"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TradeEvent } from "@/lib/types"
import { Bot, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import AskAI from "../../portfolio/chat/AskAI"

import AgentReasoningAccordion from "./AgentReasoningAccordion"
import EmptyState from "./EmptyState"
import OrderDetails from "./OrderDetails"
import PnLSection from "./PnLSection"
import SignalDataAccordion from "./SignalDataAccordion"
import TpSlSection from "./TpSlSection"
import TradeHeader from "./TradeHeader"

// console.log("Component check:", {
//   AskAI,
//   EmptyState,
//   TradeHeader,
//   PnLSection,
//   TpSlSection,
//   SignalDataAccordion,
//   AgentReasoningAccordion,
//   OrderDetails,
// })

interface HoldingInfo {
  avg_entry_price: number
  quantity: number
}

interface SpeculationAgentProps {
  selectedTrade: TradeEvent | null
  holdings: Record<string, HoldingInfo>
}

export default function SpeculationAgent({
  selectedTrade,
  holdings,
}: SpeculationAgentProps) {
  const [showAskAI, setShowAskAI] = useState(false)
  const [askAIData, setAskAIData] = useState<any>(null)

  useEffect(() => {
    setShowAskAI(false)
    setAskAIData(null)
  }, [selectedTrade?.id])

  const pnlData = useMemo(() => {
    if (!selectedTrade) return null

    if (selectedTrade.closed_position) {
      const cp = selectedTrade.closed_position
      const realizedPnlUsd = cp.pnl
      const avgEntryPrice = cp.avg_entry_price
      const quantitySold = Math.abs(cp.qty)
      const sellPrice = selectedTrade.price
      const realizedPnlPercent =
        avgEntryPrice !== 0
          ? (realizedPnlUsd / (avgEntryPrice * quantitySold)) * 100
          : 0

      return {
        type: "realized" as const,
        sellPrice,
        avgEntryPrice,
        quantitySold,
        realizedPnlUsd,
        realizedPnlPercent,
        remainingQty: null,
        isPartialClose: false,
        fromClosedPosition: true,
      }
    }

    const isFilled = selectedTrade.status === "filled"
    const hasBracketLegs =
      selectedTrade.order_class === "bracket" &&
      selectedTrade.legs &&
      selectedTrade.legs.length > 0

    const isConflict =
      selectedTrade.is_agent_trade &&
      selectedTrade.trading_agent_reasonings?.startsWith("[Trade Conflict]")

    const isConflictClose =
      isConflict &&
      selectedTrade.trading_agent_reasonings?.toLowerCase().includes("closed")

    const isSell = selectedTrade.trade_type === "sell" || isConflictClose
    const isBuy = !isSell

    if (!isFilled) return { type: "unfilled" as const }
    if (hasBracketLegs) return { type: "bracket" as const }
    if (isBuy) return { type: "open_position" as const }

    if (isSell) {
      const sellPrice = selectedTrade.price
      const quantitySold = Math.abs(selectedTrade.quantity)
      const holding = holdings[selectedTrade.symbol]

      if (!holding) {
        return { type: "realized_no_entry" as const, sellPrice, quantitySold }
      }

      const avgEntryPrice = holding.avg_entry_price
      const realizedPnlUsd = (sellPrice - avgEntryPrice) * quantitySold
      const realizedPnlPercent =
        avgEntryPrice !== 0
          ? ((sellPrice - avgEntryPrice) / avgEntryPrice) * 100
          : 0
      const remainingQty = holding.quantity - quantitySold

      return {
        type: "realized" as const,
        sellPrice,
        avgEntryPrice,
        quantitySold,
        realizedPnlUsd,
        realizedPnlPercent,
        remainingQty: isConflict ? remainingQty : null,
        isPartialClose: isConflict && remainingQty > 0,
        fromClosedPosition: false,
      }
    }

    return null
  }, [selectedTrade, holdings])

  const askAIContext = useMemo(() => {
    if (!selectedTrade) return null
    return {
      dataType: "transaction",
      orderId: selectedTrade.id,
      type: selectedTrade.trade_type,
      price: selectedTrade.price,
      filledQty: selectedTrade.quantity,
      totalValue: selectedTrade.total_value,
      reason: selectedTrade.trigger_reason ?? "Manual trade",
      symbol: selectedTrade.symbol,
      status: selectedTrade.status,
      order_type: selectedTrade.order_type,
      timestamp: selectedTrade.timestamp,
      date_label: selectedTrade.date_label,
      datetime: selectedTrade.datetime,
      time_label: selectedTrade.time_label,
      pnl: pnlData?.type === "realized" ? pnlData.realizedPnlUsd : null,
      pnl_percent:
        pnlData?.type === "realized" ? pnlData.realizedPnlPercent : null,
      avg_entry_price:
        pnlData?.type === "realized" ? pnlData.avgEntryPrice : null,
      trigger_reason: selectedTrade.trigger_reason,
      is_agent_trade: selectedTrade.is_agent_trade,
      trading_agent_reasonings: selectedTrade.trading_agent_reasonings,
      risk_evaluation: selectedTrade.risk_evaluation,
      risk_adjustments_made: selectedTrade.risk_adjustments_made,
      legs: selectedTrade.legs,
      signal_data: selectedTrade.signal_data ?? null,
      closed_position: selectedTrade.closed_position ?? null,
      id: selectedTrade.id,
    }
  }, [selectedTrade, pnlData])

  const handleAskAIClick = () => {
    setAskAIData(askAIContext)
    setShowAskAI(true)
  }

  if (!selectedTrade) {
    return <EmptyState />
  }

  return (
    <>
      <AskAI
        open={showAskAI}
        onOpenChange={(open) => {
          setShowAskAI(open)
          if (!open) setAskAIData(null)
        }}
        contextData={askAIData}
      />
      <div className="h-full flex flex-col overflow-y-auto">
        <Card className="bg-card border-border flex-shrink-0 h-[calc(80vh)] overflow-y-auto">
          <CardHeader>
            <TradeHeader selectedTrade={selectedTrade} />
          </CardHeader>

          <CardContent className="space-y-4 mt-0">
            <PnLSection pnlData={pnlData} selectedTrade={selectedTrade} />

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 ">
              <div className="bg-muted rounded-lg p-4 border">
                <div className="text-xs text-muted-foreground mb-1">
                  {selectedTrade.trade_type === "buy"
                    ? "Entry Price"
                    : "Sell Price"}
                </div>
                <div className="text-sm md:text-xl font-bold">
                  ${selectedTrade.price.toFixed(2)}
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 border">
                <div className="text-xs text-muted-foreground mb-1">
                  Quantity
                </div>
                <div className="text-sm md:text-xl font-bold">
                  {selectedTrade.quantity} shares
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 border">
                <div className="text-xs text-muted-foreground mb-1">
                  Total Value
                </div>
                <div className="text-sm md:text-xl font-bold">
                  ${selectedTrade.total_value.toFixed(2)}
                </div>
              </div>
            </div>

            {selectedTrade.order_class === "bracket" &&
              selectedTrade.legs &&
              selectedTrade.legs.length > 0 && (
                <TpSlSection selectedTrade={selectedTrade} />
              )}

            <SignalDataAccordion selectedTrade={selectedTrade} />

            <AgentReasoningAccordion selectedTrade={selectedTrade} />

            {selectedTrade.is_agent_trade &&
              selectedTrade.trading_agent_reasonings?.startsWith(
                "[Trade Conflict]",
              ) && (
                <div className="rounded-lg border-2 border-orange-500/30 bg-orange-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Bot className="w-6 h-6 text-orange-500 mr-2" />
                    <span className="text-sm font-bold text-orange-500">
                      Agent Reasoning
                    </span>
                  </div>
                  <p className="text-sm text-foreground">
                    {selectedTrade.trading_agent_reasonings}
                  </p>
                </div>
              )}

            {selectedTrade.is_agent_trade && (
              <div className="sticky bottom-0 left-0 right-0 bg-card py-4 border-t border-border -mx-6 px-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleAskAIClick}
                  className="w-full h-10 bg-foreground/80 text-background relative group transition-all duration-300 rounded-xl hover:bg-foreground/70 hover:text-background border-none"
                >
                  <span
                    className="pointer-events-none absolute -inset-[2px] rounded-xl animate-rotate-border"
                    style={{
                      padding: "3px",
                      background:
                        "conic-gradient(from var(--angle, 0deg), #14b8a6, #0d9488, #00faea, #134e4a, #14b8a6)",
                      WebkitMask:
                        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                      zIndex: -1,
                    }}
                  />
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ask AI about this trade
                </Button>
              </div>
            )}

            <OrderDetails selectedTrade={selectedTrade} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
