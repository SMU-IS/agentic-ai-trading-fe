"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useState } from "react"

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}`

interface LiquidateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  symbol: string
  currentPrice: number
  currentShares: number
  onSuccess?: () => void
}

interface OrderPayload {
  symbol: string
  side: "buy" | "sell"
  limit_price: number
  qty: number
  notional: number
  time_in_force: "day" | "gtc" | "ioc" | "fok"
}

export default function LiquidateModal({
  open,
  onOpenChange,
  symbol,
  currentPrice,
  currentShares,
  onSuccess,
}: LiquidateModalProps) {
  const defaultSide: "buy" | "sell" = currentShares > 0 ? "sell" : "buy"
  const defaultQty = Math.abs(currentShares)

  const [formData, setFormData] = useState<OrderPayload>({
    symbol,
    side: defaultSide,
    limit_price: currentPrice,
    qty: defaultQty,
    notional: 0,
    time_in_force: "day",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // Reset form when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSubmitError("")
      setFormData({
        symbol,
        side: defaultSide,
        limit_price: currentPrice,
        qty: defaultQty,
        notional: 0,
        time_in_force: "day",
      })
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setSubmitError("")

      const res = await fetch(`${BASE_URL}/trading/orders/limit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error("Error response:", errorText)
        throw new Error(errorText || "Failed to submit order")
      }

      const orderData = await res.json()

      // Show success message
      alert(`Order ${orderData.status}! Order ID: ${orderData.id}`)

      // Close modal and trigger success callback
      handleOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Order submission failed:", error)
      setSubmitError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => handleOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="bg-black-900 w-full max-w-md border-border shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Buy/Sell Position
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{symbol}</p>
            </div>
            <button
              onClick={() => handleOpenChange(false)}
              className="rounded-full p-1 transition-colors hover:bg-muted"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4 p-6">
            {/* Side */}
            <div className="space-y-2">
              <Label htmlFor="side">Side</Label>
              <select
                id="side"
                value={formData.side}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    side: e.target.value as "buy" | "sell",
                  })
                }
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min="0"
                step="0.01"
                value={formData.qty}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    qty: parseFloat(e.target.value) || 0,
                  })
                }
                className="border-border bg-muted"
              />
            </div>

            {/* Limit Price */}
            <div className="space-y-2">
              <Label htmlFor="limit_price">Limit Price ($)</Label>
              <Input
                id="limit_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.limit_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    limit_price: parseFloat(e.target.value) || 0,
                  })
                }
                className="border-border bg-muted"
              />
            </div>

            {/* Notional (optional) */}
            <div className="space-y-2">
              <Label htmlFor="notional">Notional (optional)</Label>
              <Input
                id="notional"
                type="number"
                min="0"
                step="0.01"
                value={formData.notional}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notional: parseFloat(e.target.value) || 0,
                  })
                }
                className="border-border bg-muted"
              />
            </div>

            {/* Time in Force */}
            <div className="space-y-2">
              <Label htmlFor="time_in_force">Time in Force</Label>
              <select
                id="time_in_force"
                value={formData.time_in_force}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    time_in_force: e.target.value as
                      | "day"
                      | "gtc"
                      | "ioc"
                      | "fok",
                  })
                }
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="day">Day</option>
                <option value="gtc">Good Till Cancel (GTC)</option>
                <option value="ioc">Immediate or Cancel (IOC)</option>
                <option value="fok">Fill or Kill (FOK)</option>
              </select>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-400">{submitError}</p>
              </div>
            )}

            {/* Order Summary */}
            <div className="space-y-1 rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Order Summary</p>
              <p className="text-sm text-foreground">
                {formData.side.toUpperCase()} {formData.qty} shares of{" "}
                {formData.symbol} at ${formData.limit_price.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Est. Total: ${(formData.qty * formData.limit_price).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 border-t border-border p-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-500 text-white hover:bg-red-600"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Confirm Order"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}
