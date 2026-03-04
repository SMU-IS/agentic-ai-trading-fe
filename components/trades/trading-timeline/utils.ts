import { TradeEvent } from "@/lib/types"

export function transformAlpacaOrderToTrade(
  order: any,
  legs?: any[] | null,
): TradeEvent | null {
  const qty = parseFloat(order.qty || order.filled_qty || "0")
  const price = parseFloat(order.filled_avg_price || order.limit_price || "0")
  const totalValue = qty * price

  if (qty === 0) return null

  let status: "filled" | "partial" | "pending" | "cancelled" | "expired" =
    "pending"

  if (order.status === "filled") {
    status = "filled"
  } else if (order.status === "partially_filled") {
    status = "partial"
  } else if (order.status === "canceled" || order.status === "cancelled") {
    status = "cancelled"
  } else if (order.status === "expired") {
    status = "expired"
  } else if (
    [
      "accepted",
      "held",
      "pending",
      "new",
      "pending_new",
      "accepted_for_bidding",
    ].includes(order.status)
  ) {
    status = "pending"
  }

  const timestamp = order.filled_at || order.submitted_at || order.created_at
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  let dateLabel = ""
  if (isToday) {
    dateLabel = "Today"
  } else if (isYesterday) {
    dateLabel = "Yesterday"
  } else {
    dateLabel = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  const isAgentTrade = order.is_trading_agent === true

  return {
    id: order.id,
    symbol: order.symbol,
    timestamp,
    datetime: order.created_at,
    date_label: dateLabel,
    time_label: timeLabel,
    trade_type: order.side as "buy" | "sell",
    quantity: qty,
    price,
    total_value: totalValue,
    order_type: order.order_type || order.type,
    order_class: order.order_class || "simple",
    status,
    is_agent_trade: isAgentTrade,
    trigger_reason: isAgentTrade ? "AI Agent trade" : "Manual trade",
    trading_agent_reasonings: order.trading_agent_reasonings,
    risk_evaluation: order.risk_evaluation,
    risk_adjustments_made: order.risk_adjustments_made,
    legs: legs ?? (Array.isArray(order.legs) ? order.legs : undefined),
    signal_data: order.signal_data ?? null,
    closed_position: order.closed_position ?? null,
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "filled":
      return "text-green-600 bg-muted/10 border-none"
    case "partial":
      return "text-yellow-500 bg-muted/10 border-none"
    case "pending":
      return "text-yellow-700 bg-muted/10 border-none"
    case "cancelled":
    case "expired":
      return "text-red-500 bg-muted/10 border-none"
    default:
      return "text-gray-500 bg-muted/10 border-none"
  }
}
