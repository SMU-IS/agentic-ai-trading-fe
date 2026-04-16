"use client"

import { Newspaper, Star, ExternalLink, Zap } from "lucide-react"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { TradeEvent } from "@/lib/types"
import { getCredibilityColor } from "./utils"

interface SignalDataAccordionProps {
  selectedTrade: TradeEvent
}

export default function SignalDataAccordion({
  selectedTrade,
}: SignalDataAccordionProps) {
  if (!selectedTrade.signal_data) return null

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value="signal-data"
        className="rounded-lg border border-border bg-muted px-4 overflow-hidden w-full min-w-0"
      >
        <AccordionTrigger className="hover:no-underline w-full">
          <div className="flex items-center justify-between pr-2 w-full min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <Newspaper className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-bold">
                Signal Engine (news)
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-xs text-muted-foreground">
                  {selectedTrade.signal_data.confidence}/10 Confidence
                </span>
              </div>
              {/* <span
                className={`hidden md:block rounded border px-2 py-0.5 text-xs font-medium ${getCredibilityColor(
                  selectedTrade.signal_data.credibility,
                )}`}
              >
                {selectedTrade.signal_data.credibility}
              </span> */}
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="space-y-4 pt-2 overflow-hidden w-full min-w-0 max-w-full">
          <div className={`rounded-lg border p-3 ${selectedTrade.signal_data.trade_signal === "BUY" ? "border-green-500/20 bg-green-500/10" : "border-red-500/20 bg-red-500/10"}`}>
            <p className="text-xs text-muted-foreground mb-1">Trade Signal Agent suggests to</p>
            <p className={`text-sm font-bold ${selectedTrade.signal_data.trade_signal === "BUY" ? "text-green-500" : "text-red-500"}`}>
              {selectedTrade.signal_data.trade_signal}
            </p>
            <p className="mt-2 text-[10px] text-muted-foreground italic">
              Technical Analysis Agent still has to analyse market conditions before trading.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              Rumor Summary
            </p>
            <p className="text-sm text-foreground leading-relaxed break-words">
              {selectedTrade.signal_data.rumor_summary}
            </p>
          </div>

          <div className="rounded-lg bg-background p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              Credibility Reason
            </p>
            <p className="text-xs text-foreground leading-relaxed break-words">
              {selectedTrade.signal_data.credibility_reason}
            </p>
          </div>

          <div className="rounded-lg bg-background p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground">
                Trade Rationale
              </p>
            </div>
            <p className="text-xs text-foreground leading-relaxed break-words">
              {selectedTrade.signal_data.trade_rationale}
            </p>
          </div>

          {/* <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-background p-3">
              <div className="text-xs text-muted-foreground mb-1">Recommended Target</div>
              <div className="text-sm font-bold text-green-500">
                +{selectedTrade.signal_data.target_pct}%
              </div>
            </div>
            <div className="rounded-lg bg-background p-3">
              <div className="text-xs text-muted-foreground mb-1">
                Recommended Stop Loss
              </div>
              <div className="text-sm font-bold text-red-500">
                -{selectedTrade.signal_data.stop_loss_pct}%
              </div>
            </div>
            <div className="rounded-lg bg-background p-3">
              <div className="text-xs text-muted-foreground mb-1">
                Recommended Position
              </div>
              <div className="text-sm font-bold">
                {selectedTrade.signal_data.position_size_pct}%
              </div>
            </div>
          </div> */}

          {selectedTrade.signal_data.references &&
            selectedTrade.signal_data.references.length > 0 && (
              <div className="w-full overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  References
                </p>
                <div className="space-y-1 w-full overflow-hidden max-w-full">
                  {selectedTrade.signal_data.references.map(
                    (ref: string, i: number) => {
                      let displayHost = ref
                      let displayPath = ""
                      let validHref = ref

                      try {
                        const parsed = new URL(ref)
                        displayHost = parsed.hostname.replace("www.", "")
                        displayPath = parsed.pathname
                        validHref = parsed.href
                      } catch {
                        displayHost = ref
                        displayPath = ""
                        validHref = "#"
                      }

                      return (
                        <a
                          key={i}
                          href={validHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={ref}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (validHref === "#") { e.preventDefault(); return }
                            window.open(validHref, "_blank", "noopener,noreferrer")
                            e.preventDefault()
                          }}
                          className="flex min-w-0 max-w-full items-center gap-2 rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium flex-shrink-0">
                            {displayHost}
                          </span>
                          {displayPath && (
                            <span className="block min-w-0 w-0 flex-1 truncate opacity-60">
                              {displayPath}
                            </span>
                          )}
                        </a>
                      )
                    },
                  )}
                </div>
              </div>
            )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
