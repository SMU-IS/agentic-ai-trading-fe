export interface Transaction {
  id: string
  symbol: string
  name: string
  type: "buy" | "sell"
  datetime: string
  price: number
  shares: number
  totalValue: number
  reason: string
}

export interface RiskEvaluation {
  risk_per_share: string
  reward_per_share: string
  actual_rr: string
  total_risk: string
  suggested_qty: string
  near_resistance: boolean
  atr_distance: string
  max_risk_5pct: string
  risk_score: number
  risk_status: string
}

export interface RiskAdjustment {
  field: string
  reason: string
  adjustment: string
}

export interface TradeEvent {
  id: string
  symbol: string
  timestamp: string
  date_label: string
  datetime: string
  time_label: string
  trade_type: "buy" | "sell"
  quantity: number
  price: number
  total_value: number
  order_type: "market" | "limit" | "stop"
  order_class: "simple" | "bracket" | "oco" | "oto"
  status: "filled" | "partial" | "pending" | "cancelled" | "expired"
  trigger_reason?: string
  is_agent_trade: boolean

  // Agent-specific fields
  trading_agent_reasonings?: string
  risk_evaluation?: RiskEvaluation
  risk_adjustments_made?: RiskAdjustment[]

  pnl?: number
  pnl_percent?: number
  legs?: any[]
}
