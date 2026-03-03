"use client"

import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Check,
} from "lucide-react"
import { TradeEvent } from "@/lib/types"

export type PnlData =
  | { type: "realized_no_entry"; sellPrice: number; quantitySold: number }
  | { type: "open_position" }
  | {
      type: "realized"
      sellPrice: number
      avgEntryPrice: number
      quantitySold: number
      realizedPnlUsd: number
      realizedPnlPercent: number
      remainingQty: number | null
      isPartialClose: boolean
      fromClosedPosition: boolean
    }
  | { type: "unfilled" }
  | { type: "bracket" }

interface PnLSectionProps {
  pnlData: PnlData | null
  selectedTrade: TradeEvent
}

export default function PnLSection({
  pnlData,
  selectedTrade,
}: PnLSectionProps) {
  if (!pnlData) return null

  if (pnlData.type === "realized_no_entry") {
    return (
      <div className="bg-muted border border-border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <h3 className="text-sm font-semibold">Position Closed</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {(() => {
            const isCover =
              selectedTrade.trade_type === "buy" &&
              selectedTrade.closed_position != null
            const isClose =
              selectedTrade.trade_type === "sell" &&
              selectedTrade.closed_position != null
            if (isCover) return "Covered short position · "
            if (isClose) return "Closed long position · "
            return selectedTrade.trade_type === "buy" ? "Bought " : "Sold "
          })()}
          {pnlData.quantitySold} share(s) @ ${pnlData.sellPrice.toFixed(2)}.
          Entry price unavailable — position fully closed and no longer in
          holdings.
        </p>
      </div>
    )
  }

  if (pnlData.type === "open_position") {
    return (
      <div className="bg-muted border border-border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Position Open</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          No realized P&L yet. This position is still open.
        </p>
      </div>
    )
  }

  if (pnlData.type === "unfilled") {
    return (
      <div className="bg-muted border border-border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-semibold">Order Not Filled</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          This order was not executed. No P&L to display.
        </p>
      </div>
    )
  }

  if (pnlData.type === "realized") {
    return (
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
              pnlData.realizedPnlUsd >= 0 ? "text-green-500" : "text-red-500"
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
                pnlData.realizedPnlUsd >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {pnlData.realizedPnlUsd >= 0 ? "+" : ""}$
              {pnlData.realizedPnlUsd.toFixed(2)}
            </div>
          </div>
          {selectedTrade.closed_position?.market_value != null && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Market Value
              </div>
              <div className="text-sm font-bold">
                $
                {Math.abs(selectedTrade.closed_position.market_value).toFixed(
                  2,
                )}
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
    )
  }

  return null
}
