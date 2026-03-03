"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Activity, Target } from "lucide-react"
import { motion } from "framer-motion"
import { TradeEvent } from "@/lib/types"

interface TpSlSectionProps {
  selectedTrade: TradeEvent
}

export default function TpSlSection({ selectedTrade }: TpSlSectionProps) {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [loadingPrice, setLoadingPrice] = useState(false)

  const tpLeg = selectedTrade.legs?.find(
    (leg: any) => leg.order_type === "limit" || leg.type === "limit",
  )
  const slLeg = selectedTrade.legs?.find(
    (leg: any) => leg.order_type === "stop" || leg.type === "stop",
  )
  const tpIsFilled = tpLeg?.status === "filled"
  const slIsFilled = slLeg?.status === "filled"
  const anyLegFilled = tpIsFilled || slIsFilled

  useEffect(() => {
    if (anyLegFilled) {
      setCurrentPrice(null)
      return
    }

    const fetchPrice = async () => {
      setLoadingPrice(true)
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/trading/yahoo/latest/${selectedTrade.symbol}`,
        )
        if (!res.ok) return
        const data = await res.json()
        setCurrentPrice(data.price?.current_price ?? null)
      } catch {
        // silently fail — price is non-critical
      } finally {
        setLoadingPrice(false)
      }
    }

    fetchPrice()
  }, [selectedTrade.symbol, anyLegFilled])

  const getLegPL = (leg: any) => {
    const legQty = parseFloat(leg.filled_qty || leg.quantity || "0")
    const legPrice = parseFloat(
      leg.filled_avg_price || leg.limit_price || leg.stop_price || "0",
    )
    return (legPrice - selectedTrade.price) * legQty
  }

  const filledLegs = selectedTrade.legs.filter(
    (leg: any) => leg.status === "filled",
  )
  const totalLegPL = filledLegs.reduce(
    (sum: number, leg: any) => sum + getLegPL(leg),
    0,
  )

  const renderLeg = (leg: any, isTakeProfit: boolean) => {
    if (!leg) return null

    const legQty = parseFloat(leg.filled_qty || leg.quantity || "0")
    const legPrice = parseFloat(
      leg.filled_avg_price || leg.limit_price || leg.stop_price || "0",
    )
    const isFilled = leg.status === "filled"
    const legPL = isFilled ? (legPrice - selectedTrade.price) * legQty : 0
    const shares = selectedTrade.quantity
    const perShare = isTakeProfit
      ? parseFloat(selectedTrade.risk_evaluation?.reward_per_share || "0")
      : parseFloat(selectedTrade.risk_evaluation?.risk_per_share || "0")
    const potentialAmount = perShare * shares

    const statusColor = isFilled
      ? "bg-green-500/10 text-green-500"
      : leg.status === "cancelled"
        ? "bg-red-500/10 text-red-500"
        : leg.status === "expired"
          ? "bg-orange-500/10 text-orange-500"
          : "bg-blue-500/10 text-blue-500"

    return (
      <div className="flex flex-col gap-1 rounded-lg p-3 border bg-background border-border h-full">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground font-medium">
            {isTakeProfit ? "Take Profit" : "Stop Loss"}
          </div>
          <div
            className={`rounded px-2 py-0.5 text-xs font-medium ${statusColor}`}
          >
            {leg.status}
          </div>
        </div>

        <div className="text-sm font-bold">
          {isTakeProfit
            ? `Limit: $${legPrice.toFixed(2)}`
            : `Stop: $${legPrice.toFixed(2)}`}
        </div>

        {!anyLegFilled &&
          selectedTrade.risk_evaluation &&
          potentialAmount > 0 && (
            <div
              className={`mt-1 flex items-center gap-1 rounded-md px-2 py-1 w-fit text-xs font-semibold border ${
                isTakeProfit
                  ? "bg-green-500/5 border-green-500/20 text-green-500"
                  : "bg-red-500/5 border-red-500/20 text-red-500"
              }`}
            >
              {isTakeProfit ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{isTakeProfit ? "Max Profit" : "Max Loss"}</span>
              <span className="font-bold">
                {isTakeProfit ? "+" : "-"}${potentialAmount.toFixed(2)}
              </span>
            </div>
          )}

        {isFilled && (
          <div className="flex items-center justify-between mt-1">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isTakeProfit
                  ? "bg-green-500/20 text-green-500"
                  : "bg-red-500/20 text-red-500"
              }`}
            >
              {isTakeProfit ? "+" : ""}${legPL.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              {legQty} shares
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-muted p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-bold">Take Profit / Stop Loss</span>
        </div>

        {!anyLegFilled &&
          selectedTrade.status ===
            "filled" && (
              <>
                {loadingPrice ? (
                  <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1">
                    <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
                    <div className="h-3 w-3.5 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-12 rounded bg-muted animate-pulse" />
                  </div>
                ) : currentPrice !== null ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1"
                  >
                    {(() => {
                      const tpPrice = parseFloat(
                        tpLeg?.limit_price || tpLeg?.filled_avg_price || "0",
                      )
                      const slPrice = parseFloat(
                        slLeg?.stop_price || slLeg?.filled_avg_price || "0",
                      )
                      const distToTP =
                        tpPrice > 0
                          ? Math.abs(currentPrice - tpPrice)
                          : Infinity
                      const distToSL =
                        slPrice > 0
                          ? Math.abs(currentPrice - slPrice)
                          : Infinity
                      const isBullish = distToTP < distToSL
                      const pingColor = isBullish
                        ? "bg-green-400"
                        : "bg-red-400"
                      const dotColor = isBullish ? "bg-green-500" : "bg-red-500"

                      return (
                        <span className="relative flex h-2 w-2">
                          <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${pingColor} opacity-75`}
                          />
                          <span
                            className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`}
                          />
                        </span>
                      )
                    })()}

                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Unrealized P&L:
                    </span>

                    {(() => {
                      const unrealizedPnl =
                        (currentPrice - selectedTrade.price) *
                        selectedTrade.quantity
                      const isPositive = unrealizedPnl >= 0

                      return (
                        <motion.span
                          key={unrealizedPnl.toFixed(2)}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                          }}
                          className={`text-xs font-bold ${
                            isPositive ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {isPositive ? "+" : ""}${unrealizedPnl.toFixed(2)}
                        </motion.span>
                      )
                    })()}
                  </motion.div>
                ) : null}
              </>,
            )}
      </div>

      {filledLegs.length > 0 &&
        (() => {
          const tpFilled = filledLegs.some(
            (leg: any) => leg.order_type === "limit" || leg.type === "limit",
          )
          const slFilled = filledLegs.some(
            (leg: any) => leg.order_type === "stop" || leg.type === "stop",
          )
          const isProfit = tpFilled && !slFilled

          return (
            <div className="mb-2 p-3 rounded-lg bg-muted/40 border flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Realized P/L (order leg filled)
                </div>
                <div className="text-xl font-bold">
                  <span
                    className={isProfit ? "text-green-500" : "text-red-500"}
                  >
                    {isProfit ? "+" : ""}${totalLegPL.toFixed(2)}
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

      <div className="grid grid-cols-2 gap-2 items-stretch">
        <div>{renderLeg(slLeg, false)}</div>
        <div>{renderLeg(tpLeg, true)}</div>
      </div>
    </div>
  )
}
