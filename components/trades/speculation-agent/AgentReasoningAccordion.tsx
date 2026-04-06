"use client"

import { Bot, Shield, AlertTriangle, MessageSquare } from "lucide-react"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { TradeEvent } from "@/lib/types"
import { getRiskStatusColor } from "./utils"
import RiskAdjustments from "./RiskAdjustments"
import { number } from "framer-motion"

interface AgentReasoningAccordionProps {
  selectedTrade: TradeEvent
}

export default function AgentReasoningAccordion({
  selectedTrade,
}: AgentReasoningAccordionProps) {
  if (!selectedTrade.is_agent_trade) return null
  if (!selectedTrade.trading_agent_reasonings) return null
  if (selectedTrade.trading_agent_reasonings.startsWith("[Trade Conflict]"))
    return null

  const parsePrice = (val: string) => parseFloat(val.replace(/[^0-9.-]/g, ''))



  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">

        <AccordionItem
          value="agent-reasoning"
          className="rounded-lg border-2 border-primary/30 bg-primary/5 px-4"
        >
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-primary">
                Agent Technical Reasoning
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm leading-relaxed text-foreground">
              {selectedTrade.trading_agent_reasonings}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {selectedTrade.trigger_reason && !selectedTrade.is_agent_trade && (
        <div className="bg-muted border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold">Trade Trigger</span>
            </div>
          </div>
          <p className="text-sm text-foreground bg-card p-4 rounded-lg">
            {selectedTrade.trigger_reason}
          </p>
        </div>
      )}

      {selectedTrade.risk_evaluation &&
        Object.keys(selectedTrade.risk_evaluation).length > 0 && (
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="risk-evaluation"
            key={selectedTrade.id}
          >
            <AccordionItem
              value="risk-evaluation"
              className="rounded-lg border border-border bg-muted/30 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-bold">Risk Evaluation</span>
                  </div>
                  <div
                    className={`rounded border px-3 py-1 text-xs font-bold ${getRiskStatusColor(
                      selectedTrade.risk_evaluation.risk_status,
                    )}`}
                  >
                    {selectedTrade.risk_evaluation.risk_status}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    {
                      label: "Reward:Risk Ratio",
                      value: selectedTrade.risk_evaluation.actual_rr,
                      color: "text-primary",
                    },
                    {
                      label: "Total Risk",
                      value: selectedTrade.risk_evaluation.total_risk,
                      color: "text-red-500",
                    },
                    {
                      label: "Risk per Share",
                      value: `${selectedTrade.risk_evaluation.risk_per_share} (${(parsePrice(selectedTrade.risk_evaluation.risk_per_share) / selectedTrade.price * 100).toFixed(2)}%)`,
                    },
                    {
                      label: "Reward per Share",
                      value: `${selectedTrade.risk_evaluation.reward_per_share} (${(parsePrice(selectedTrade.risk_evaluation.reward_per_share) / selectedTrade.price * 100).toFixed(2)}%)`, color: "text-green-500",
                    },
                    {
                      label: "ATR Distance",
                      value: selectedTrade.risk_evaluation.atr_distance,
                      color: "",
                    },
                    {
                      label: "Risk Score",
                      value:
                        selectedTrade.risk_evaluation.risk_score.toFixed(2),
                      color: "",
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg bg-background p-3">
                      <div className="text-xs text-muted-foreground mb-1">
                        {label}
                      </div>
                      <div className={`text-lg font-bold ${color}`}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedTrade.risk_evaluation.near_resistance && (
                  <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Trade near resistance level
                    </span>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

      <RiskAdjustments selectedTrade={selectedTrade} />
    </div>
  )
}
