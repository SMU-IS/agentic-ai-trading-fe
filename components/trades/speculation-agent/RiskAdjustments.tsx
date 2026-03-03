"use client"

import { Target } from "lucide-react"
import { TradeEvent } from "@/lib/types"

interface RiskAdjustmentsProps {
  selectedTrade: TradeEvent
}

export default function RiskAdjustments({
  selectedTrade,
}: RiskAdjustmentsProps) {
  if (
    !selectedTrade.risk_adjustments_made ||
    selectedTrade.risk_adjustments_made.length === 0
  ) {
    return null
  }

  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-5 w-5 text-yellow-600" />
        <span className="text-sm font-bold text-yellow-600">
          Risk Adjustments Applied ({selectedTrade.risk_adjustments_made.length}
          )
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
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </div>
            </div>
            <div className="mb-2 text-xs text-muted-foreground">
              <span className="font-medium">Reason:</span> {adj.reason}
            </div>
            <div className="text-xs font-medium text-foreground">
              <span className="text-muted-foreground">Adjustment:</span>{" "}
              {adj.adjustment}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
