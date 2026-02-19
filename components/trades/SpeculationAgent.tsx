"use client"

import { useState, useEffect, useMemo } from "react"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  MessageSquare,
  Sparkles,
  Bot,
  Shield,
  Target,
  AlertTriangle,
  User,
  Copy,
  Check,
  Newspaper,
  Star,
  ExternalLink,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AskAI from "../portfolio/chat/AskAI"
import { TradeEvent } from "@/lib/types"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion"

interface HoldingInfo {
  avg_entry_price: number
  quantity: number
}

interface SpeculationAgentProps {
  selectedTrade: TradeEvent | null
  holdings: Record<string, HoldingInfo>
}

const generateDots = () => {
  const dots = []
  const rows = 14
  const cols = 14
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      dots.push({
        id: `${i}-${j}`,
        top: `${(i / rows) * 150}%`,
        left: `${(j / cols) * 150}%`,
        delay: Math.random() * 10,
        duration: 4 + Math.random() * 2,
      })
    }
  }
  return dots
}

// ── Credibility badge color ────────────────────────────────────────────────
const getCredibilityColor = (credibility: string) => {
  switch (credibility?.toLowerCase()) {
    case "high":
      return "text-green-500 bg-green-500/10 border-green-500/20"
    case "medium":
      return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
    case "low":
      return "text-red-500 bg-red-500/10 border-red-500/20"
    default:
      return "text-gray-500 bg-gray-500/10 border-gray-500/20"
  }
}

export default function SpeculationAgent({
  selectedTrade,
  holdings,
}: SpeculationAgentProps) {
  const [dots] = useState(() => generateDots())
  const [showAskAI, setShowAskAI] = useState(false)
  const [askAIData, setAskAIData] = useState<any>(null)
  const [copiedOrderId, setCopiedOrderId] = useState(false)

  useEffect(() => {
    setShowAskAI(false)
    setAskAIData(null)
  }, [selectedTrade?.id])

  const pnlData = useMemo(() => {
    if (!selectedTrade) return null

    // ── If closed_position data exists, use it as the source of truth ────────
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
        fromClosedPosition: true, // flag so UI can optionally show source
      }
    }

    // ── Fallback: existing logic for non-closed positions ────────────────────
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
      closed_position: selectedTrade.closed_position ?? null, // ← added
      id: selectedTrade.id,
    }
  }, [selectedTrade, pnlData])

  const handleAskAIClick = () => {
    setAskAIData(askAIContext)
    setShowAskAI(true)
  }

  const getRiskStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-500 bg-green-500/10 border-green-500/20"
      case "WARNING":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
      case "REJECTED":
        return "text-red-500 bg-red-500/10 border-red-500/20"
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20"
    }
  }

  if (!selectedTrade) {
    return (
      <div className="h-full flex items-center justify-center rounded-xl overflow-hidden relative bg-teal-900/10 border">
        <div className="absolute inset-0">
          {dots.map((dot) => (
            <div
              key={dot.id}
              className="absolute w-1 h-1 rounded-full bg-muted/30"
              style={{
                top: dot.top,
                left: dot.left,
                animation: `spec-dot-pulse ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
              }}
            />
          ))}
        </div>
        <div className="border w-80 bg-teal-900/20 rounded-full z-10 p-4 flex items-center">
          <Activity className="w-8 h-8 text-teal-900 mx-4" />
          <div className="flex-1 items-start text-left">
            <h2 className="text-xs font-bold text-foreground">
              View trade analysis
            </h2>
            <p className="text-xs text-foreground">
              Click on any trade from the left to view detailed analysis
            </p>
          </div>
        </div>
        <style jsx>{`
          @keyframes spec-dot-pulse {
            0%,
            100% {
              background-color: rgb(148 163 184 / 0.1);
              transform: scale(1);
            }
            50% {
              background-color: rgb(14, 108, 97);
              transform: scale(1.5);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto pr-2">
      <Card className="bg-card border-border flex-shrink-0 h-[calc(100vh-150px)] overflow-y-auto">
        <CardHeader>
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
              <div
                className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedTrade.trade_type === "buy"
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                }`}
              >
                {selectedTrade.trade_type.toUpperCase()}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Status</p>
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
        </CardHeader>

        <CardContent className="space-y-4 mt-0">
          {/* ── P&L Section ──────────────────────────────────────────────── */}

          {pnlData?.type === "realized_no_entry" && (
            <div className="bg-muted border border-border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-semibold">Position Closed</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTrade.trade_type === "buy" ? "Bought" : "Sold"}{" "}
                {pnlData.quantitySold} share(s) @ $
                {pnlData.sellPrice.toFixed(2)}. Entry price unavailable —
                position fully closed and no longer in holdings.
              </p>
            </div>
          )}

          {pnlData?.type === "open_position" && (
            <div className="bg-muted border border-border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Position Open</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No realized P&L yet. This position is still open.
              </p>
            </div>
          )}

          {pnlData?.type === "realized" && (
            <div
              className={`rounded-lg p-4 border ${
                pnlData.realizedPnlUsd >= 0
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-red-500/5 border-red-500/20"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Realized P&L</h3>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    pnlData.realizedPnlUsd >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {pnlData.realizedPnlUsd >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {pnlData.realizedPnlPercent >= 0 ? "+" : ""}
                  {pnlData.realizedPnlPercent.toFixed(2)}%
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {selectedTrade.trade_type === "buy"
                      ? "Avg Entry Bought Price"
                      : "Avg Entry Sold Price"}
                  </div>
                  <div className="text-sm font-bold">
                    ${pnlData.avgEntryPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Realized P&L
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      pnlData.realizedPnlUsd >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {pnlData.realizedPnlUsd >= 0 ? "+" : ""}$
                    {pnlData.realizedPnlUsd.toFixed(2)}
                  </div>
                </div>

                {/* Market Value — only available from closed_position */}
                {selectedTrade.closed_position?.market_value != null && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Market Value
                    </div>
                    <div className="text-sm font-bold">
                      $
                      {Math.abs(
                        selectedTrade.closed_position.market_value,
                      ).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {pnlData.isPartialClose && pnlData.remainingQty !== null && (
                <div className="mt-3 rounded-lg bg-orange-500/10 border border-orange-500/20 p-3">
                  <p className="text-xs text-orange-500 font-medium">
                    Partial close — {pnlData.quantitySold} shares sold.{" "}
                    {pnlData.remainingQty} shares still open.
                  </p>
                </div>
              )}
            </div>
          )}

          {pnlData?.type === "unfilled" && (
            <div className="bg-muted border border-border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-semibold">Order Not Filled</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This order was not executed. No P&L to display.
              </p>
            </div>
          )}

          {/* ── Trade Summary ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted rounded-lg p-4 border">
              <div className="text-xs text-muted-foreground mb-1">
                {selectedTrade.trade_type === "buy"
                  ? "Entry Price"
                  : "Sell Price"}
              </div>
              <div className="text-xl font-bold">
                ${selectedTrade.price.toFixed(2)}
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4 border">
              <div className="text-xs text-muted-foreground mb-1">Quantity</div>
              <div className="text-xl font-bold">
                {selectedTrade.quantity} shares
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4 border">
              <div className="text-xs text-muted-foreground mb-1">
                Total Value
              </div>
              <div className="text-xl font-bold">
                ${selectedTrade.total_value.toFixed(2)}
              </div>
            </div>
          </div>

          {/* ── TPSL Legs ─────────────────────────────────────────────────── */}
          {selectedTrade.order_class === "bracket" &&
            selectedTrade.legs &&
            selectedTrade.legs.length > 0 && (
              <div className="rounded-lg border border-border bg-muted p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-bold">
                    Take Profit / Stop Loss
                  </span>
                </div>

                {(() => {
                  const filledLegs = selectedTrade.legs.filter(
                    (leg: any) => leg.status === "filled",
                  )
                  const getLegPL = (leg: any) => {
                    const legQty = parseFloat(
                      leg.filled_qty || leg.quantity || "0",
                    )
                    const legPrice = parseFloat(
                      leg.filled_avg_price ||
                        leg.limit_price ||
                        leg.stop_price ||
                        "0",
                    )
                    return (legPrice - selectedTrade.price) * legQty
                  }
                  const totalLegPL = filledLegs.reduce(
                    (sum: number, leg: any) => sum + getLegPL(leg),
                    0,
                  )

                  return (
                    <>
                      {filledLegs.length > 0 &&
                        (() => {
                          const tpFilled = filledLegs.some(
                            (leg: any) =>
                              leg.order_type === "limit" ||
                              leg.type === "limit",
                          )
                          const slFilled = filledLegs.some(
                            (leg: any) =>
                              leg.order_type === "stop" || leg.type === "stop",
                          )
                          const isProfit = tpFilled && !slFilled

                          return (
                            <div className="mb-2 p-3 rounded-lg bg-muted/40 border flex items-center justify-between">
                              <div>
                                <div className="text-xs font-semibold text-foreground">
                                  Realized P/L ({filledLegs.length}/
                                  {selectedTrade.legs.length} order legs filled)
                                </div>
                                <div className="text-xl font-bold">
                                  <span
                                    className={
                                      isProfit
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }
                                  >
                                    {isProfit ? "+" : ""}$
                                    {totalLegPL.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  isProfit
                                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                                }`}
                              >
                                {isProfit ? "PROFIT" : "LOSS"}
                              </div>
                            </div>
                          )
                        })()}

                      <div className="space-y-2">
                        {selectedTrade.legs.map((leg: any, idx: number) => {
                          const legQty = parseFloat(
                            leg.filled_qty || leg.quantity || "0",
                          )
                          const legPrice = parseFloat(
                            leg.filled_avg_price ||
                              leg.limit_price ||
                              leg.stop_price ||
                              "0",
                          )
                          const isFilled = leg.status === "filled"
                          const isTakeProfit =
                            leg.order_type === "limit" || leg.type === "limit"
                          const legPL = isFilled ? getLegPL(leg) : 0
                          const isProfit = isTakeProfit

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-lg p-3 border transition-all bg-background border-border"
                            >
                              <div>
                                <div className="text-xs text-muted-foreground">
                                  {isTakeProfit ? "Take Profit" : "Stop Loss"}
                                </div>
                                <div className="text-sm font-bold">
                                  {isTakeProfit
                                    ? `Limit: $${legPrice.toFixed(2)}`
                                    : `Stop: $${legPrice.toFixed(2)}`}
                                </div>
                                {isFilled && (
                                  <div className="text-xs mt-1">
                                    <span
                                      className={`font-bold px-2 py-0.5 rounded-full ${
                                        isProfit
                                          ? "bg-green-500/20 text-green-500"
                                          : "bg-red-500/20 text-red-500"
                                      }`}
                                    >
                                      {isProfit ? "+" : ""}${legPL.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="text-center">
                                <div
                                  className={`rounded px-2 py-1 text-xs font-medium ${
                                    isFilled
                                      ? isFilled
                                        ? "bg-green-500/10 text-green-500"
                                        : "bg-red-500/10 text-red-500"
                                      : leg.status === "cancelled"
                                        ? "bg-red-500/10 text-red-500"
                                        : leg.status === "expired"
                                          ? "bg-orange-500/10 text-orange-500"
                                          : "bg-blue-500/10 text-blue-500"
                                  }`}
                                >
                                  {leg.status}
                                </div>
                                {isFilled && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {legQty} shares
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

          {/* ── Agent Reasoning Section ───────────────────────────────────── */}
          {selectedTrade.is_agent_trade &&
            selectedTrade.trading_agent_reasonings &&
            !selectedTrade.trading_agent_reasonings.startsWith(
              "[Trade Conflict]",
            ) && (
              <div className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem
                    value="agent-reasoning"
                    className="rounded-lg border-2 border-primary/30 bg-primary/5 px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <span className="text-sm font-bold text-primary">
                          AI Agent Reasoning
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm leading-relaxed text-foreground">
                        {selectedTrade.trading_agent_reasonings}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* ── Trigger Reason — manual trades only ───────────────────────── */}
                {selectedTrade.trigger_reason &&
                  !selectedTrade.is_agent_trade && (
                    <div className="bg-muted border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          <span className="text-sm font-bold">
                            Trade Trigger
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground bg-card p-4 rounded-lg">
                        {selectedTrade.trigger_reason}
                      </p>
                    </div>
                  )}

                {selectedTrade.risk_evaluation &&
                  Object.keys(selectedTrade.risk_evaluation).length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem
                        value="risk-evaluation"
                        className="rounded-lg border border-border bg-muted/30 px-4"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-2">
                            <div className="flex items-center gap-2">
                              <Shield className="h-5 w-5 text-muted-foreground" />
                              <span className="text-sm font-bold">
                                Risk Evaluation
                              </span>
                            </div>
                            <div
                              className={`rounded border px-3 py-1 text-xs font-bold ${getRiskStatusColor(selectedTrade.risk_evaluation.risk_status)}`}
                            >
                              {selectedTrade.risk_evaluation.risk_status}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {[
                              {
                                label: "Risk/Reward Ratio",
                                value: selectedTrade.risk_evaluation.actual_rr,
                                color: "text-primary",
                              },
                              {
                                label: "Total Risk",
                                value: selectedTrade.risk_evaluation.total_risk,
                                color: "text-red-500",
                              },
                              {
                                label: "Risk per Share",
                                value:
                                  selectedTrade.risk_evaluation.risk_per_share,
                                color: "",
                              },
                              {
                                label: "Reward per Share",
                                value:
                                  selectedTrade.risk_evaluation
                                    .reward_per_share,
                                color: "text-green-500",
                              },
                              {
                                label: "ATR Distance",
                                value:
                                  selectedTrade.risk_evaluation.atr_distance,
                                color: "",
                              },
                              {
                                label: "Risk Score",
                                value:
                                  selectedTrade.risk_evaluation.risk_score.toFixed(
                                    2,
                                  ),
                                color: "",
                              },
                            ].map(({ label, value, color }) => (
                              <div
                                key={label}
                                className="rounded-lg bg-background p-3"
                              >
                                <div className="text-xs text-muted-foreground mb-1">
                                  {label}
                                </div>
                                <div className={`text-lg font-bold ${color}`}>
                                  {value}
                                </div>
                              </div>
                            ))}
                          </div>
                          {selectedTrade.risk_evaluation.near_resistance && (
                            <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-yellow-500">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Trade near resistance level
                              </span>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                {selectedTrade.risk_adjustments_made &&
                  selectedTrade.risk_adjustments_made.length > 0 && (
                    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Target className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm font-bold text-yellow-600">
                          Risk Adjustments Applied (
                          {selectedTrade.risk_adjustments_made.length})
                        </span>
                      </div>
                      <div className="space-y-3">
                        {selectedTrade.risk_adjustments_made.map((adj, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3"
                          >
                            <div className="mb-2">
                              <div className="rounded bg-yellow-500/20 px-2 py-1 text-xs font-semibold text-foreground inline-block">
                                {adj.field
                                  .split("_")
                                  .map(
                                    (w) =>
                                      w.charAt(0).toUpperCase() + w.slice(1),
                                  )
                                  .join(" ")}
                              </div>
                            </div>
                            <div className="mb-2 text-xs text-muted-foreground">
                              <span className="font-medium">Reason:</span>{" "}
                              {adj.reason}
                            </div>
                            <div className="text-xs font-medium text-foreground">
                              <span className="text-muted-foreground">
                                Adjustment:
                              </span>{" "}
                              {adj.adjustment}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

          {/* ── Signal News Data — only shown if present ──────────────────────── */}
          {selectedTrade.signal_data && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem
                value="signal-data"
                className="rounded-lg border border-border bg-muted px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2 min-w-0 ">
                    <div className="flex items-center gap-2 shrink-0">
                      <Newspaper className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-bold">
                        Signal News Data
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">
                          {selectedTrade.signal_data.confidence}/10
                        </span>
                      </div>
                      <span
                        className={`rounded border px-2 py-0.5 text-xs font-bold ${
                          selectedTrade.signal_data.trade_signal === "BUY"
                            ? "border-green-500/20 bg-green-500/10 text-green-500"
                            : "border-red-500/20 bg-red-500/10 text-red-500"
                        }`}
                      >
                        {selectedTrade.signal_data.trade_signal}
                      </span>
                      <span
                        className={`rounded border px-2 py-0.5 text-xs font-medium ${getCredibilityColor(selectedTrade.signal_data.credibility)}`}
                      >
                        {selectedTrade.signal_data.credibility}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="space-y-4 pt-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Rumor Summary
                    </p>
                    {/* ✅ Fix 2: break-words prevents long text from stretching */}
                    <p className="text-sm text-foreground leading-relaxed break-words">
                      {selectedTrade.signal_data.rumor_summary}
                    </p>
                  </div>

                  <div className="rounded-lg bg-background p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Credibility Reason
                    </p>
                    <p className="text-xs text-foreground leading-relaxed break-words">
                      {selectedTrade.signal_data.credibility_reason}
                    </p>
                  </div>

                  <div className="rounded-lg bg-background p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <p className="text-xs font-semibold text-muted-foreground">
                        Trade Rationale
                      </p>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed break-words">
                      {selectedTrade.signal_data.trade_rationale}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-background p-3">
                      <div className="text-xs text-muted-foreground mb-1">
                        Target
                      </div>
                      <div className="text-sm font-bold text-green-500">
                        +{selectedTrade.signal_data.target_pct}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-background p-3">
                      <div className="text-xs text-muted-foreground mb-1">
                        Stop Loss
                      </div>
                      <div className="text-sm font-bold text-red-500">
                        -{selectedTrade.signal_data.stop_loss_pct}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-background p-3">
                      <div className="text-xs text-muted-foreground mb-1">
                        Position Size
                      </div>
                      <div className="text-sm font-bold">
                        {selectedTrade.signal_data.position_size_pct}%
                      </div>
                    </div>
                  </div>

                  {selectedTrade.signal_data.references &&
                    selectedTrade.signal_data.references.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          References
                        </p>
                        <div className="space-y-1">
                          {selectedTrade.signal_data.references.map(
                            (ref: string, i: number) => {
                              // Extract just the hostname for display
                              let displayHost = ref
                              try {
                                const url = new URL(ref)
                                displayHost = url.hostname.replace("www.", "")
                              } catch {}

                              return (
                                <a
                                  key={i}
                                  href={ref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={ref} // ← full URL on hover
                                  className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                  {/* Hostname in bold, path truncated */}
                                  <span className="font-medium shrink-0">
                                    {displayHost}
                                  </span>
                                  <span className="truncate opacity-60">
                                    {new URL(ref).pathname}
                                  </span>
                                </a>
                              )
                            },
                          )}
                        </div>
                      </div>
                    )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* ── Conflict Resolution Badge ─────────────────────────────────── */}
          {selectedTrade.is_agent_trade &&
            selectedTrade.trading_agent_reasonings?.startsWith(
              "[Trade Conflict]",
            ) && (
              <div className="rounded-lg border-2 border-orange-500/30 bg-orange-500/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Bot className="w-6 h-6 text-orange-500 mr-2" />
                  <span className="text-sm font-bold text-orange-500">
                    AI Agent Reasoning
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {selectedTrade.trading_agent_reasonings}
                </p>
              </div>
            )}

          {/* ── Ask AI Button — agent trades only ─────────────────────────── */}
          {selectedTrade.is_agent_trade && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={handleAskAIClick}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Ask AI about this trade
              </Button>
              <AskAI
                open={showAskAI}
                onOpenChange={(open) => {
                  setShowAskAI(open)
                  if (!open) setAskAIData(null)
                }}
                contextData={askAIData}
              />
            </div>
          )}

          {/* ── Order Details ─────────────────────────────────────────────── */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-3">Order Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Order Type:</span>
                <span className="ml-2 font-medium">
                  {selectedTrade.order_type}
                </span>
              </div>
              {selectedTrade.order_class &&
                selectedTrade.order_class !== "simple" && (
                  <div>
                    <span className="text-muted-foreground">Order Class:</span>
                    <span className="ml-2 font-medium capitalize">
                      {selectedTrade.order_class}
                    </span>
                  </div>
                )}
              <div>
                <span className="text-muted-foreground">Order ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">
                    {selectedTrade.id.slice(0, 16)}...
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedTrade.id)
                      setCopiedOrderId(true)
                      setTimeout(() => setCopiedOrderId(false), 2000)
                    }}
                    className="inline-flex items-center justify-center rounded p-1 hover:bg-muted transition-colors"
                    title={copiedOrderId ? "Copied!" : "Copy full order ID"}
                  >
                    {copiedOrderId ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
