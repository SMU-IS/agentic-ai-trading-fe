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

export default function TradeCard({
  trade,
  isSelected,
  onSelect,
}: TradeCardProps) {
  return (
    <div
      onClick={() => onSelect(trade)}
      className={`group relative flex cursor-pointer gap-4 rounded-lg border-2 p-3 transition-colors ${
        isSelected
          ? "border-primary/20 bg-primary/10"
          : "border-transparent hover:bg-muted/80"
      }`}
    >
      {/* Timeline Connector */}
      <div className="flex flex-col items-center pt-1">
        <div
          className={`h-3 w-3 rounded-full border-2 ${
            trade.trade_type === "buy"
              ? "border-green-500 bg-green-500"
              : "border-red-500 bg-red-500"
          }`}
        />
        <div className="mt-2 w-0.5 flex-1 bg-border" />
      </div>

      {/* Trade Content */}
      <div className="flex-1">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="min-w-[70px] text-xs text-muted-foreground">
              {trade.time_label}
            </div>

            <div className="bg-muted/50 border p-2 flex flex-row gap-2 rounded-xl">
              <div className="flex flex-row items-center gap-2 flex-1 text-sm font-semibold">
                <StockLogo
                  symbol={trade.symbol}
                  name={trade.symbol}
                  size="sm"
                />
                <p className="text-xs">{trade.symbol}</p>
              </div>
            </div>

            <div className="bg-muted/50 border p-2 flex flex-row gap-2 rounded-xl">
              <div
                className={`flex-1 rounded border px-2 py-1 text-xs font-medium ${
                  trade.trade_type === "buy"
                    ? "border-green-500/20 bg-green-500/10 text-green-600"
                    : "border-red-500/20 bg-red-500/10 text-red-500"
                }`}
              >
                {trade.trade_type.toUpperCase()}
              </div>
              <div
                className={`justify-center content-center rounded border px-2 py-0.5 text-xs ${getStatusColor(trade.status)}`}
              >
                {trade.status}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold">
              {trade.quantity} shares @ ${trade.price.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              Total: ${trade.total_value.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Order type: {trade.order_type}</span>
            {trade.order_class !== "simple" && (
              <>
                <span>•</span>
                <span>Class: {trade.order_class}</span>
              </>
            )}
            <span>•</span>
            <span>ID: {trade.id.slice(0, 8)}...</span>
          </div>

          {trade.is_agent_trade ? (
            <div className="flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <Bot className="h-3 w-3" />
              Agent
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded border border-muted bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <User className="h-3 w-3" />
              Manual
            </div>
          )}
        </div>

        {trade.is_agent_trade && trade.trading_agent_reasonings && (
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  Agent Reasoning
                </span>
              </div>
              <p className="text-xs leading-relaxed text-foreground line-clamp-2">
                {trade.trading_agent_reasonings}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
