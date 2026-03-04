"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRightLeft,
  DollarSign,
  Bot,
  User,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TradeEvent } from "@/lib/types"

interface StatsDropdownProps {
  filteredTrades: TradeEvent[]
  showStats: boolean
  setShowStats: (v: boolean) => void
  totalRealizedPnL: number
  totalUnrealizedPnL: number
}

export default function StatsDropdown({
  filteredTrades,
  showStats,
  setShowStats,
  totalRealizedPnL,
  totalUnrealizedPnL,
}: StatsDropdownProps) {
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs rounded-lg border border-foreground/30 bg-muted text-foreground hover:bg-muted/20"
        onClick={() => setShowStats(!showStats)}
      >
        <Info className="mr-2 h-3 w-3" />
        Statistics
      </Button>

      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card p-4 shadow-lg"
          >
            <h4 className="mb-3 text-sm font-medium">Trading Statistics</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: <ArrowRightLeft className="h-3 w-3" />,
                  label: "Total Trades",
                  value: filteredTrades.length,
                  color: "",
                },
                {
                  icon: <DollarSign className="h-3 w-3" />,
                  label: "Total Volume",
                  value: `$${filteredTrades.reduce((sum, t) => sum + t.total_value, 0).toFixed(0)}`,
                  color: "",
                },
                {
                  icon: <Bot className="h-3 w-3" />,
                  label: "Agent Trades",
                  value: filteredTrades.filter((t) => t.is_agent_trade).length,
                  color: "text-primary",
                },
                {
                  icon: <User className="h-3 w-3" />,
                  label: "Manual Trades",
                  value: filteredTrades.filter((t) => !t.is_agent_trade).length,
                  color: "",
                },
                {
                  icon: <TrendingUp className="h-3 w-3" />,
                  label: "Buy Orders",
                  value: filteredTrades.filter((t) => t.trade_type === "buy")
                    .length,
                  color: "text-green-600",
                },
                {
                  icon: <TrendingDown className="h-3 w-3" />,
                  label: "Sell Orders",
                  value: filteredTrades.filter((t) => t.trade_type === "sell")
                    .length,
                  color: "text-red-500",
                },
                {
                  icon: <TrendingUp className="h-3 w-3" />,
                  label: "Realized P&L",
                  value: `${totalRealizedPnL >= 0 ? "+" : ""}$${totalRealizedPnL.toFixed(2)}`,
                  color:
                    totalRealizedPnL >= 0 ? "text-green-500" : "text-red-500",
                },
                {
                  icon: <TrendingUp className="h-3 w-3" />,
                  label: "Unrealized P&L",
                  value: `${totalUnrealizedPnL >= 0 ? "+" : ""}$${totalUnrealizedPnL.toFixed(2)}`,
                  color:
                    totalUnrealizedPnL >= 0 ? "text-green-500" : "text-red-500",
                },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="rounded-lg bg-muted/50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                    {icon}
                    <span className="text-xs">{label}</span>
                  </div>
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
