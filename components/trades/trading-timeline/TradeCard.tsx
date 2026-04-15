"use client"

import StockLogo from "@/components/StockLogo"
import { Bot, User } from "lucide-react"
import { TradeEvent } from "@/lib/types"
import { getStatusColor } from "./utils"

interface TradeCardProps {
  trade: TradeEvent
  isSelected: boolean
  onSelect: (trade: TradeEvent) => void
}

export default function TradeCard({ trade, isSelected, onSelect }: TradeCardProps) {
  const filledLegs = trade.legs?.filter((leg: any) => leg.status === "filled") ?? []
  const tpFilled = filledLegs.some((leg: any) => leg.order_type === "limit" || leg.type === "limit")
  const slFilled = filledLegs.some((leg: any) => leg.order_type === "stop" || leg.type === "stop")

  const getLegPL = (leg: any) => {
    const legQty = parseFloat(leg.filled_qty || leg.quantity || "0")
    const legPrice = parseFloat(leg.filled_avg_price || leg.limit_price || leg.stop_price || "0")
    return trade.trade_type === "sell"
      ? (trade.price - legPrice) * legQty
      : (legPrice - trade.price) * legQty
  }
  const totalLegPL = filledLegs.reduce((sum: number, leg: any) => sum + getLegPL(leg), 0)

  return (
    <div
      onClick={() => onSelect(trade)}
      className={`group relative flex cursor-pointer gap-3 rounded-lg border-2 p-3 transition-colors ${
        isSelected
          ? "border-primary/20 bg-primary/10"
          : "border-transparent hover:bg-muted/80"
      }`}
    >
      {/* Timeline Connector */}
      <div className="flex flex-col items-center pt-1">
        <div
          className={`h-3 w-3 flex-shrink-0 rounded-full border-2 ${
            trade.trade_type === "buy"
              ? "border-green-500 bg-green-500"
              : "border-red-500 bg-red-500"
          }`}
        />
        <div className="mt-2 w-0.5 flex-1 bg-border" />
      </div>

      {/* Trade Content */}
      <div className="min-w-0 flex-1">

        {/* ── Row 1: Time + Symbol + Buy/Sell+Status ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time */}
          <span className="flex-shrink-0 text-xs text-muted-foreground">
            {trade.time_label}
          </span>

          {/* Symbol pill */}
          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border bg-muted/50 px-2 py-1">
            <StockLogo symbol={trade.symbol} name={trade.symbol} size="sm" />
            <span className="text-xs font-semibold">{trade.symbol}</span>
          </div>

          {/* Buy/Sell + Status pills */}
          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border bg-muted/50 px-2 py-1">
            <span
              className={`rounded border px-1.5 py-0.5 text-xs font-medium ${
                trade.trade_type === "buy"
                  ? "border-green-500/20 bg-green-500/10 text-green-600"
                  : "border-red-500/20 bg-red-500/10 text-red-500"
              }`}
            >
              {trade.trade_type.toUpperCase()}
            </span>
            <span
              className={`rounded border px-1.5 py-0.5 text-xs ${getStatusColor(trade.status)}`}
            >
              {trade.status}
            </span>
          </div>

          {/* TP / SL badge */}
          {tpFilled && (
            <div className="flex items-center gap-1 rounded border border-green-500/30 bg-green-500/10 px-1.5 py-0.5">
              <span className="text-xs font-bold text-green-500">TP</span>
              <span className="text-border">|</span>
              <span className={`text-xs font-semibold ${totalLegPL >= 0 ? "text-green-500" : "text-red-500"}`}>
                {totalLegPL >= 0 ? "+" : ""}${totalLegPL.toFixed(2)}
              </span>
            </div>
          )}
          {slFilled && (
            <div className="flex items-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5">
              <span className="text-xs font-bold text-red-500">SL</span>
              <span className="text-border">|</span>
              <span className={`text-xs font-semibold ${totalLegPL >= 0 ? "text-green-500" : "text-red-500"}`}>
                {totalLegPL >= 0 ? "+" : ""}${totalLegPL.toFixed(2)}
              </span>
            </div>
          )}

          {/* Agent / Manual badge — pushed right on sm+, wraps naturally on mobile */}
          <div className="ml-auto">
            {trade.is_agent_trade ? (
              <div className="flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Bot className="h-3 w-3" />
                <span>Agent</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded border border-muted bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <User className="h-3 w-3" />
                <span>Manual</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Quantity / Price / Total ── */}
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <span className="text-sm font-semibold">
            {trade.quantity} shares @ ${trade.price.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            Total: ${trade.total_value.toFixed(2)}
          </span>
        </div>

        {/* ── Row 3: Order meta ── */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>Order type: {trade.order_type}</span>
          {trade.order_class !== "simple" && (
            <>
              <span className="text-border">•</span>
              <span>Class: {trade.order_class}</span>
            </>
          )}
          <span className="text-border">•</span>
          {/* Show fewer chars of ID on mobile to avoid overflow */}
          <span className="hidden sm:inline">ID: {trade.id.slice(0, 8)}...</span>
          <span className="sm:hidden">ID: {trade.id.slice(0, 5)}…</span>
        </div>

        {/* ── Agent Reasoning (if present) ── */}
        {trade.is_agent_trade && trade.trading_agent_reasonings && (
          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <Bot className="h-4 w-4 flex-shrink-0 text-primary" />
              <span className="text-xs font-semibold text-primary">
                Agent Reasoning
              </span>
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-foreground">
              {trade.trading_agent_reasonings}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}