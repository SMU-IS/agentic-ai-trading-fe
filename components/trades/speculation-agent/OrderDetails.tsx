"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { TradeEvent } from "@/lib/types"

interface OrderDetailsProps {
  selectedTrade: TradeEvent
}

export default function OrderDetails({ selectedTrade }: OrderDetailsProps) {
  const [copiedOrderId, setCopiedOrderId] = useState(false)

  return (
    <div className="border-t border-border pt-4">
      <h3 className="text-sm font-semibold mb-3">Order Details</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Order Type:</span>
          <span className="ml-2 font-medium">{selectedTrade.order_type}</span>
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
  )
}
