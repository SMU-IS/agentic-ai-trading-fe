"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { ChevronDown, TrendingUp, TrendingDown, Target, ShieldAlert, Zap } from "lucide-react"
import { useState } from "react"

// ─── Trade Signal Card ───────────────────────────────────────────────────────

interface TradeSignalData {
  catalystStrength?: string
  catalystDetail?: string
  candleSentiment?: string
  candleDetail?: string
  alignmentCount?: string
  alignmentDetail?: string
  currentPrice?: string
  support?: string
  bbLower?: string
  sl?: string
  tp?: string
  risk?: string
  reward?: string
  rr?: string
  direction?: "BUY" | "SELL"
  validity?: string
}

// Extract the final resolved number from a complex SL/TP expression like:
// "lower of support 1.480 BB Lower 1.545 minus 0.25xATR14=1.545-0.040=1.505 adjusted to 1.255 for structure"
// Strategy: prefer "adjusted to X", else last standalone decimal before comma/end
function extractFinalValue(expr: string): string | null {
  const adjustedMatch = expr.match(/adjusted\s+to\s+([\d.]+)/i)
  if (adjustedMatch) return adjustedMatch[1]
  // Last number that looks like a price (has decimal point) before a comma or end
  const allNumbers = [...expr.matchAll(/([\d]+\.[\d]+)/g)]
  if (allNumbers.length) return allNumbers[allNumbers.length - 1][1]
  return null
}

// ─── Conflict / Hold Analysis Card ──────────────────────────────────────────

interface ConflictAnalysis {
  outcome: "HOLD" | "INVALID"
  ticker?: string
  currentPrice?: string
  catalystSummary?: string
  catalystStrength?: string
  candleSentiment?: string
  conflicts: string[]
  conclusion: string
}

function parseConflictAnalysis(text: string): ConflictAnalysis | null {
  const isConflict =
    /\b(HOLD|invalid|conflict detected|contradiction|revert(?:ing)? to HOLD)\b/i.test(text) &&
    /\b(catalyst|RSI|MACD|resistance|support)\b/i.test(text) &&
    text.length > 200

  if (!isConflict) return null

  const d: ConflictAnalysis = { outcome: "HOLD", conflicts: [], conclusion: "" }

  // Current price
  const priceMatch = text.match(/current price \$?([\d.]+)/i)
  if (priceMatch) d.currentPrice = priceMatch[1]

  // Catalyst strength + summary
  const catalystMatch = text.match(/\b(STRONG|MODERATE|WEAK)\s+catalyst[:\s]+([^.]+\.)/i)
  if (catalystMatch) {
    d.catalystStrength = catalystMatch[1].toUpperCase()
    d.catalystSummary = catalystMatch[2].trim()
  }

  // Candle
  const candleMatch = text.match(
    /\b(STRONG_BULLISH|BULLISH|MODERATE_BULLISH|NEUTRAL|MODERATE_BEARISH|BEARISH|STRONG_BEARISH)\s+candle\b/i,
  )
  if (candleMatch) d.candleSentiment = candleMatch[1].toUpperCase()

  // Extract conflict statements — sentences containing "conflict", "invalid", "contradiction", "no TP", "already at"
  const sentences = text.split(/(?<=[.!?])\s+/)
  for (const s of sentences) {
    if (
      /\b(conflict|invalid|contradiction|no\s+TP|already at|cannot|below entry|makes no sense|not.*valid)\b/i.test(
        s,
      )
    ) {
      const clean = s.trim()
      if (clean.length > 20 && clean.length < 220) d.conflicts.push(clean)
    }
  }
  // Cap at 4 most relevant
  d.conflicts = d.conflicts.slice(0, 4)

  // Conclusion — last sentence containing HOLD or the final sentence
  const holdMatch = text.match(/(?:Revert(?:ing)? to|Reverting:|conclusion[:\s]+)\s*([^.]+\.)/i)
  if (holdMatch) {
    d.conclusion = holdMatch[1].trim()
  } else {
    const lastSentences = sentences.filter((s) => s.trim().length > 20)
    d.conclusion = lastSentences[lastSentences.length - 1]?.trim() ?? ""
  }

  return d
}

function ConflictAnalysisCard({ analysis, rawText }: { analysis: ConflictAnalysis; rawText: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="my-3 rounded-xl border border-yellow-500/25 bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-yellow-500/15">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-yellow-400" />
          <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
            No Trade — Conflict Detected
          </span>
        </div>
        <div className="flex items-center gap-2">
          {analysis.catalystStrength && (
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide",
                analysis.catalystStrength === "STRONG"
                  ? "bg-teal-500/10 text-teal-400 border-teal-500/25"
                  : analysis.catalystStrength === "WEAK"
                    ? "bg-muted/40 text-muted-foreground border-border"
                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
              )}
            >
              {analysis.catalystStrength} catalyst
            </span>
          )}
          {analysis.candleSentiment && (
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide",
                /BULLISH/i.test(analysis.candleSentiment)
                  ? "bg-green-500/10 text-green-400 border-green-500/25"
                  : /BEARISH/i.test(analysis.candleSentiment)
                    ? "bg-red-500/10 text-red-400 border-red-500/25"
                    : "bg-muted/40 text-muted-foreground border-border",
              )}
            >
              {analysis.candleSentiment.replace(/_/g, " ")} candle
            </span>
          )}
          {analysis.currentPrice && (
            <span className="text-xs text-muted-foreground">@ ${analysis.currentPrice}</span>
          )}
        </div>
      </div>

      {/* Catalyst summary */}
      {analysis.catalystSummary && (
        <div className="px-4 pt-3 pb-1 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 mt-0.5 text-yellow-400 shrink-0" />
          <span>{analysis.catalystSummary}</span>
        </div>
      )}

      {/* Conflicts */}
      {analysis.conflicts.length > 0 && (
        <div className="px-4 pt-2 pb-1 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">
            Why this trade was rejected
          </p>
          {analysis.conflicts.map((c, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground/80">
              <span className="text-red-400 shrink-0 mt-0.5">✕</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      )}

      {/* Conclusion */}
      {analysis.conclusion && (
        <div className="border-t border-border/30 px-4 py-2.5 text-xs text-muted-foreground italic">
          {analysis.conclusion}
        </div>
      )}

      {/* Full text toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors border-t border-border/20"
      >
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", expanded ? "rotate-180" : "")}
        />
        {expanded ? "hide" : "full analysis"}
      </button>
      {expanded && (
        <div className="px-4 pb-3 text-[11px] text-muted-foreground/60 leading-relaxed border-t border-border/20 pt-2 whitespace-pre-wrap">
          {/* Re-flow into readable paragraphs by splitting on ". " */}
          {rawText}
        </div>
      )}
    </div>
  )
}

function parseTradeSignal(text: string): TradeSignalData | null {
  // Heuristic: must mention key trading terms to be considered a signal block
  // Direction is optional — a setup may be implicitly long/bullish from catalyst context
  const hasTradeTerms =
    /\b(RSI|MACD|ATR|SL=|TP=|RR=|oversold|overbought|catalyst)\b/i.test(text) &&
    /\b(risk|reward|RR)\s*=\s*[\d.]+/i.test(text) &&
    text.length > 80

  if (!hasTradeTerms) return null

  const d: TradeSignalData = {}

  // Direction — prefer explicit "for BUY/SELL", then standalone BUY/SELL
  const dirContextMatch = text.match(/\bfor\s+(BUY|SELL)\b/i) ?? text.match(/\b(BUY|SELL)\b/)
  if (dirContextMatch) d.direction = dirContextMatch[1].toUpperCase() as "BUY" | "SELL"
  // Infer from candle / catalyst if still missing
  if (!d.direction) {
    if (/\b(bullish|oversold|beat|raise|accumulate)\b/i.test(text)) d.direction = "BUY"
    else if (/\b(bearish|overbought|miss|downgrade)\b/i.test(text)) d.direction = "SELL"
  }

  // Catalyst — "STRONG catalyst (...)" or "WEAK catalyst (...)"
  const catalystMatch = text.match(/\b(STRONG|MODERATE|WEAK)\s+catalyst\s*\(([^)]+)\)/i)
  if (catalystMatch) {
    d.catalystStrength = catalystMatch[1].toUpperCase()
    d.catalystDetail = catalystMatch[2].trim()
  } else {
    const fallback = text.match(/^([^,)]*catalyst[^,)]*)/i)
    if (fallback) d.catalystDetail = fallback[1].trim()
  }

  // Candle sentiment — "MODERATE_BEARISH candle (...)" / "neutral candle (...)"
  // Also handles: "flush-and-recover price action (STRONG_BULLISH candle ...)"
  const candleMatch =
    text.match(
      /\b(STRONG_BULLISH|BULLISH|MODERATE_BULLISH|NEUTRAL|MODERATE_BEARISH|BEARISH|STRONG_BEARISH)\s+candle\s*\(([^)]+)\)/i,
    ) ??
    text.match(
      /[^(]*\(\s*(STRONG_BULLISH|BULLISH|MODERATE_BULLISH|NEUTRAL|MODERATE_BEARISH|BEARISH|STRONG_BEARISH)\s+candle\s+([^)]+)\)/i,
    )
  if (candleMatch) {
    d.candleSentiment = candleMatch[1].toUpperCase()
    d.candleDetail = candleMatch[2].trim()
  }
  // Also capture the outer price action label if present (e.g. "flush-and-recover price action")
  const priceActionMatch = text.match(
    /\b([\w-]+(?:\s+[\w-]+)*)\s+price\s+action\s*\(/i,
  )
  if (priceActionMatch && !d.candleSentiment) {
    d.candleSentiment = priceActionMatch[1].toUpperCase()
  } else if (priceActionMatch) {
    d.candleDetail = `${priceActionMatch[1]} — ${d.candleDetail ?? ""}`
  }

  // Alignment factors — "alignment factors=3 (...)", "alignment count 3 (...)", "3 alignment factors for BUY (...)"
  const afMatch =
    text.match(/alignment\s+(?:factors?=|count)\s*(\d+)\s*\(([^)]+)\)/i) ??
    text.match(/(\d+)\s+alignment\s+factors?\s+for\s+(?:BUY|SELL)\s*\(([^)]+)\)/i)
  if (afMatch) {
    d.alignmentCount = afMatch[1]
    d.alignmentDetail = afMatch[2].trim()
  }

  // Current price — "current price 1.680" or "current 4.380"
  const entryMatch = text.match(/current(?:\s+price)?\s+\$?([\d.]+)/i)
  if (entryMatch) d.currentPrice = entryMatch[1]

  // Support — "support 1.480", "support=13.520", "support $158.460"
  const supportMatch = text.match(/\bsupport\s*[=:$\s]\s*([\d.]+)/i)
  if (supportMatch) d.support = supportMatch[1]

  // BB Lower
  const bbMatch = text.match(/BB\s*Lower\s*[=:$\s]\s*([\d.]+)/i)
  if (bbMatch) d.bbLower = bbMatch[1]

  // SL — extract the segment after "SL=" up to the next comma (or end), then resolve final value
  const slSegmentMatch = text.match(/\bSL\s*=\s*([^,]+?)(?=,\s*(?:TP|risk|reward|RR)\b|$)/i)
  if (slSegmentMatch) {
    const segment = slSegmentMatch[1]
    // Fast path: SL= followed directly by a number
    const directNum = segment.match(/^([\d.]+)/)
    d.sl = directNum ? directNum[1] : (extractFinalValue(segment) ?? undefined)
  }

  // TP — same approach
  const tpSegmentMatch = text.match(/\bTP\s*=\s*([^,]+?)(?=,\s*(?:risk|reward|RR)\b|$)/i)
  if (tpSegmentMatch) {
    const segment = tpSegmentMatch[1]
    const directNum = segment.match(/^([\d.]+)/)
    d.tp = directNum ? directNum[1] : (extractFinalValue(segment) ?? undefined)
  }

  // Risk / Reward / RR
  const riskMatch = text.match(/\brisk\s*=\s*([\d.]+)/i)
  if (riskMatch) d.risk = riskMatch[1]
  const rewardMatch = text.match(/\breward\s*=\s*([\d.]+)/i)
  if (rewardMatch) d.reward = rewardMatch[1]
  // RR=2.53:1 or RR=1.834
  const rrMatch = text.match(/\bRR\s*=\s*([\d.]+)/i)
  if (rrMatch) d.rr = rrMatch[1]

  // Validity / trailing note — last clause starting with "valid", or trailing RR override note
  const validMatch =
    text.match(/valid\b.+$/i) ??
    text.match(/\bRR\s*=[\d.:]+\s+but\b.+$/i) ??
    text.match(/,\s*([^,]{10,})$/)
  if (validMatch) d.validity = (validMatch[1] ?? validMatch[0]).trim()

  return d
}

// ─── Structured JSON Signal ──────────────────────────────────────────────────

interface StructuredSignal {
  setup: { direction: string; type: string; validity: boolean; override_note?: string }
  catalyst: { strength: string; description: string; basis: string; analyst_support?: string }
  price_action: { signal: string; current_price: number; atr_14: number }
  alignment: { total_score: number; factors: { factor: string; signal: string; score: number }[] }
  entry: { type: string; current_price: number }
  levels: { support?: number; bb_lower?: number; key_level_targeted?: number }
  risk_management: {
    stop_loss: { value: number }
    take_profit: { adjusted: number }
    risk: number
    reward: number
    rr_ratio: { simple: string; precise: string }
    rr_valid: boolean
  }
}

function parseStructuredSignal(text: string): StructuredSignal | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith("{") && !trimmed.startsWith("```")) return null
  try {
    const jsonStr = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    const parsed = JSON.parse(jsonStr)
    if (parsed?.setup && parsed?.risk_management && parsed?.alignment) {
      return parsed as StructuredSignal
    }
    return null
  } catch {
    return null
  }
}

function scoreColor(score: number) {
  if (score >= 2) return "text-green-400"
  if (score === 1) return "text-teal-400"
  return "text-muted-foreground/50"
}

function StructuredSignalCard({ signal }: { signal: StructuredSignal }) {
  const [expanded, setExpanded] = useState(false)
  const isBuy = signal.setup.direction.toUpperCase() === "BUY"
  const rm = signal.risk_management
  const rrComputed = rm.risk && rm.reward ? rm.reward / rm.risk : parseFloat(rm.rr_ratio.precise)

  return (
    <div
      className={cn(
        "my-3 rounded-xl border overflow-hidden",
        isBuy ? "border-green-500/25 bg-background" : "border-red-500/25 bg-background",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2.5 border-b",
          isBuy ? "border-green-500/15" : "border-red-500/15",
        )}
      >
        <div className="flex items-center gap-2">
          {isBuy ? (
            <TrendingUp className="h-4 w-4 text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-400" />
          )}
          <span className="text-xs text-muted-foreground">
            {isBuy ? "Targeted Buy" : "Targeted Sell"} @ ${signal.entry.current_price}
          </span>
          {/* <span
            className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide",
              signal.price_action.signal.toUpperCase() === "NEUTRAL"
                ? "bg-muted/40 text-muted-foreground border-border"
                : /BULLISH/i.test(signal.price_action.signal)
                  ? "bg-green-500/10 text-green-400 border-green-500/25"
                  : "bg-red-500/10 text-red-400 border-red-500/25",
            )}
          >
            {signal.price_action.signal} candle
          </span> */}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide",
              signal.catalyst.strength === "STRONG"
                ? "bg-teal-500/10 text-teal-400 border-teal-500/25"
                : signal.catalyst.strength === "WEAK"
                  ? "bg-muted/40 text-muted-foreground border-border"
                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
            )}
          >
            {signal.catalyst.strength} catalyst
          </span>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded border",
              rrComputed >= 2
                ? "bg-green-500/15 text-green-500 border-green-500/30"
                : "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
            )}
          >
            RR {rrComputed.toFixed(2)} : 1
          </span>
        </div>
      </div>

      {/* Setup type */}
      <div className="px-4 pt-2.5 pb-1 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground/70">{signal.setup.type}</span>
        {signal.setup.override_note && (
          <span className="ml-2 italic text-muted-foreground/60">— {signal.setup.override_note}</span>
        )}
      </div>

      {/* Key Levels Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 pb-3 pt-1">
        <Pill label="Entry" value={`$${signal.entry.current_price}`} color="teal" />
        {signal.levels.support && (
          <Pill label="Support" value={`$${signal.levels.support}`} color="muted" />
        )}
        <Pill label="Stop Loss" value={`$${rm.stop_loss.value}`} color="red" />
        <Pill label="Take Profit" value={`$${rm.take_profit.adjusted}`} color="green" />
        {signal.levels.bb_lower && (
          <Pill label="BB Lower" value={`$${signal.levels.bb_lower}`} color="yellow" />
        )}
      </div>

      {/* Risk / Reward row */}
      <div className="flex items-center gap-4 px-3 pb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ShieldAlert className="h-3 w-3 text-red-400" />
          Risk <span className="font-mono text-red-300">${rm.risk}</span>
        </span>
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3 text-green-400" />
          Reward <span className="font-mono text-green-300">${rm.reward}</span>
        </span>
      </div>

      {/* Catalyst */}
      <div className="border-t border-border/30 px-3 py-2 space-y-1">
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 mt-0.5 text-yellow-400 shrink-0" />
          <span>{signal.catalyst.description}</span>
        </div>
        <div className="text-[11px] text-muted-foreground/50 pl-4">
          {signal.catalyst.basis}
        </div>
      </div>

      {/* Alignment factors — toggle */}
      <div className="border-t border-border/30">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:bg-muted/10 transition-colors"
        >
          <span>
            Alignment score:{" "}
            <span className="font-semibold text-teal-400">{signal.alignment.total_score}</span>
            <span className="text-muted-foreground/50"> / {signal.alignment.factors.reduce((s, f) => s + (f.score > 0 ? f.score : 0), 0) + signal.alignment.factors.filter(f => f.score === 0).length}</span>
          </span>
          <ChevronDown
            className={cn("h-3 w-3 transition-transform", expanded ? "rotate-180" : "")}
          />
        </button>
        {expanded && (
          <div className="px-3 pb-3 space-y-1.5">
            {signal.alignment.factors.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={cn("font-mono font-bold shrink-0 w-4 text-right", scoreColor(f.score))}>
                  {f.score > 0 ? `+${f.score}` : "–"}
                </span>
                <span className="text-foreground/70 shrink-0">{f.factor}</span>
                <span className="text-muted-foreground/60 italic">{f.signal}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Pill({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: "teal" | "red" | "green" | "yellow" | "muted"
}) {
  const colors = {
    teal: "bg-teal-500/10 text-teal-500 border-teal-500/30",
    red: "bg-red-500/10 text-red-500 border-red-500/30",
    green: "bg-green-500/10 text-green-500 border-green-500/30",
    yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    muted: "bg-muted/40 text-muted-foreground border-border",
  }
  return (
    <div className={cn("flex flex-col rounded-lg border px-3 py-2", colors[color])}>
      <span className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">
        {label}
      </span>
      <span className="text-sm font-bold font-mono">{value}</span>
    </div>
  )
}

function TradeSignalCard({ data, rawText }: { data: TradeSignalData; rawText: string }) {
  const [expanded, setExpanded] = useState(false)
  const isBuy = data.direction === "BUY"
  const rrComputed =
    data.risk && data.reward
      ? parseFloat(data.reward) / parseFloat(data.risk)
      : data.rr
        ? parseFloat(data.rr)
        : null

  return (
    <div
      className={cn(
        "my-3 rounded-xl border overflow-hidden",
        isBuy
          ? "border-green-500/25 bg-background"
          : "border-red-500/25 bg-background",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2.5 border-b",
          isBuy ? "border-green-500/15" : "border-red-500/15",
        )}
      >
        <div className="flex items-center gap-2">
          {isBuy ? (
            <TrendingUp className="h-4 w-4 text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-400" />
          )}
          {data.currentPrice && (
            <span className="text-xs text-muted-foreground ml-1">
              {isBuy ? "Targeted Buy" : "Targeted Sell"} @ ${data.currentPrice}
            </span>
          )}
          {/* {data.candleSentiment && (
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide",
                /BULLISH/i.test(data.candleSentiment)
                  ? "bg-green-500/10 text-green-400 border-green-500/25"
                  : /BEARISH/i.test(data.candleSentiment)
                    ? "bg-red-500/10 text-red-400 border-red-500/25"
                    : "bg-muted/40 text-muted-foreground border-border",
              )}
            >
              {data.candleSentiment.replace(/_/g, " ")}
            </span>
          )} */}
        </div>
        <div className="flex items-center gap-2">
          {data.catalystStrength && (
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide",
                data.catalystStrength === "STRONG"
                  ? "bg-teal-500/10 text-teal-400 border-teal-500/25"
                  : data.catalystStrength === "WEAK"
                    ? "bg-muted/40 text-muted-foreground border-border"
                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
              )}
            >
              {data.catalystStrength} catalyst
            </span>
          )}
          {rrComputed !== null && (
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded border",
                rrComputed >= 2
                  ? "bg-green-500/15 text-green-500 border-green-500/30"
                  : "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
              )}
            >
              RR {rrComputed.toFixed(2)} : 1
            </span>
          )}
        </div>
      </div>

      {/* Key Levels Table */}
      <div className="flex justify-end">
      <table className="text-xs border-collapse">
        <thead>
          <tr className="border-b border-border/30">
            {data.currentPrice && <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground/50 uppercase tracking-wider text-[10px]">Entry</th>}
            {data.support && <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground/50 uppercase tracking-wider text-[10px]">Support</th>}
            {data.sl && <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground/50 uppercase tracking-wider text-[10px]">Stop Loss</th>}
            {data.tp && <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground/50 uppercase tracking-wider text-[10px]">Take Profit</th>}
            {data.bbLower && <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground/50 uppercase tracking-wider text-[10px]">BB Lower</th>}
          </tr>
        </thead>
        <tbody>
          <tr>
            {data.currentPrice && <td className="px-3 py-2 font-mono font-bold text-foreground">${data.currentPrice}</td>}
            {data.support && <td className="px-3 py-2 font-mono font-bold text-foreground">${data.support}</td>}
            {data.sl && <td className="px-3 py-2 font-mono font-bold text-foreground">${data.sl}</td>}
            {data.tp && <td className="px-3 py-2 font-mono font-bold text-foreground">${data.tp}</td>}
            {data.bbLower && <td className="px-3 py-2 font-mono font-bold text-foreground">${data.bbLower}</td>}
          </tr>
        </tbody>
      </table>
      </div>

      {/* Risk / Reward row */}
      {(data.risk || data.reward) && (
        <div className="flex items-center gap-4 px-3 pb-3 text-xs text-muted-foreground">
          {data.risk && (
            <span className="flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-red-500" />
              Suggested Risk <span className="font-mono text-red-500">${data.risk}</span>
            </span>
          )}
          {data.reward && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3 text-green-500" />
              Suggested Reward <span className="font-mono text-green-500">${data.reward}</span>
            </span>
          )}
        </div>
      )}

      {/* Catalyst / Alignment row */}
      {(data.catalystDetail || data.alignmentDetail) && (
        <div className="border-t border-border/30 px-3 py-2 space-y-1.5">
          {data.catalystDetail && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 mt-0.5 text-yellow-400 shrink-0" />
              <span>{data.catalystDetail}</span>
            </div>
          )}
          {data.alignmentDetail && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <span className="text-teal-400 shrink-0 font-mono text-[10px] mt-0.5">
                {data.alignmentCount}×
              </span>
              <span>{data.alignmentDetail}</span>
            </div>
          )}
          {data.candleDetail && (
            <div className="text-xs text-muted-foreground/60 italic pl-4">
              Candle: {data.candleDetail}
            </div>
          )}
        </div>
      )}

      {/* Validity */}
      {data.validity && (
        <div className="border-t border-border/30 px-3 py-2 text-xs text-muted-foreground italic">
          {data.validity}
        </div>
      )}

      {/* Raw text toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors border-t border-border/20"
      >
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", expanded ? "rotate-180" : "")}
        />
        {expanded ? "hide" : "raw analysis"}
      </button>
      {expanded && (
        <div className="px-4 pb-3 text-[11px] text-muted-foreground/60 leading-relaxed border-t border-border/20 pt-2">
          {rawText}
        </div>
      )}
    </div>
  )
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

function ThoughtBlock({ steps, isStreaming }: { steps: string[]; isStreaming?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!steps.length || steps.every((s) => !s.trim())) return null

  return (
    <div className="my-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        />
        <span className="shimmer-text">
          Ran {steps.length} {steps.length === 1 ? "Step" : "Steps"}
        </span>
      </button>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100 mt-2" : "max-h-0 opacity-0 overflow-hidden",
        )}
      >
        <div className="relative pl-4">
          {/* Vertical timeline line */}
          <div className="absolute left-[8.5px] top-1 bottom-1 w-px bg-teal-500/30" />
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="relative flex gap-3">
                {/* Dot */}
                <div className={cn(
                  "absolute -left-[11px] top-[5px] h-2 w-2 rounded-full border shrink-0",
                  i === steps.length - 1 && isStreaming
                    ? "border-teal-400 bg-teal-400/30 animate-pulse"
                    : "border-teal-500/50 bg-background",
                )} />
                <div className="text-xs italic text-muted-foreground/80 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {step}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Parse content into interleaved parts of text and thoughts
  const parts: { type: "text" | "thought"; content: string; streaming?: boolean }[] = []

  // Handle escaped tags like \<thought>
  const sanitizedContent = content.replace(/\\<thought>/g, "<thought>")

  // Regex to find all thought blocks
  const splitParts = sanitizedContent.split("<thought>")

  // The first part is always text (before the first <thought>)
  if (splitParts[0]) {
    parts.push({ type: "text", content: splitParts[0] })
  }

  for (let i = 1; i < splitParts.length; i++) {
    const thoughtAndRest = splitParts[i]
    if (thoughtAndRest.includes("</thought>")) {
      const [thought, ...rest] = thoughtAndRest.split("</thought>")
      parts.push({ type: "thought", content: thought, streaming: false })

      const restContent = rest.join("</thought>")
      if (restContent) {
        parts.push({ type: "text", content: restContent })
      }
    } else {
      // Still streaming this thought block
      parts.push({ type: "thought", content: thoughtAndRest, streaming: true })
    }
  }

  const markdownComponents = {
    p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }: any) => (
      <strong className="font-bold text-teal-400/90">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-teal-200/80">{children}</em>
    ),
    code: ({ node, inline, className, children, ...props }: any) => {
      if (inline) {
        return (
          <code
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-teal-300/90 border border-border/50"
            {...props}
          >
            {children}
          </code>
        )
      }
      return (
        <div className="relative my-4 group">
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-normal">
            <code {...props}>{children}</code>
          </pre>
        </div>
      )
    },
    ul: ({ children }: any) => (
      <ul className="mb-4 ml-4 list-disc space-y-1">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="mb-4 ml-4 list-decimal space-y-1">{children}</ol>
    ),
    li: ({ children }: any) => <li className="pl-1">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="my-4 border-l-4 border-teal-500/30 pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse border border-border text-xs text-left">
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className="border border-border bg-muted/50 px-3 py-2 font-semibold">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="border border-border px-3 py-2">{children}</td>
    ),
    h1: ({ children }: any) => (
      <h1 className="mb-4 text-lg font-bold text-foreground border-b border-border pb-2">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="mb-3 text-md font-bold text-foreground/90">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="mb-2 text-sm font-bold text-foreground/80">{children}</h3>
    ),
    hr: () => <hr className="my-6 border-border" />,
    a: ({ children, href }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-teal-400 underline underline-offset-4 hover:text-teal-300 transition-colors"
      >
        {children}
      </a>
    ),
  }

  // Collect all thought parts into a steps array for one accordion
  const thoughtParts = parts.filter((p) => p.type === "thought")
  const mergedThought =
    thoughtParts.length > 0
      ? (() => {
          const isStreaming = thoughtParts.some((p) => p.streaming)
          const steps = thoughtParts
            .map((p) => p.content.replace(/<\/t?h?o?u?g?h?t?>?$/, "").trim())
            .filter((c) => c.length >= 2)
          return steps.length > 0 ? { steps, streaming: isStreaming } : null
        })()
      : null

  const firstThoughtIdx = parts.findIndex((p) => p.type === "thought")

  return (
    <div
      className={cn(
        "prose prose-invert max-w-none text-sm leading-relaxed",
        className,
      )}
    >
      {parts.map((part, idx) => {
        if (part.type === "thought") {
          // Render merged accordion only at the first thought part's position
          if (idx !== firstThoughtIdx || !mergedThought) return null
          return (
            <ThoughtBlock
              key="merged-thought"
              steps={mergedThought.steps}
              isStreaming={mergedThought.streaming}
            />
          )
        }

        // Text part
        let cleanedText = part.content
        if (idx === parts.length - 1) {
          cleanedText = cleanedText
            .replace(/\\?$/, "")
            .replace(/<t?h?o?u?g?h?t?>?$/, "")
            .replace(/(?:^|\n)[\s>*-]+$/, "$1")
        }

        if (!cleanedText.trim()) return null

        const structured = parseStructuredSignal(cleanedText.trim())
        if (structured) {
          return <StructuredSignalCard key={idx} signal={structured} />
        }

        const conflictData = parseConflictAnalysis(cleanedText.trim())
        if (conflictData) {
          return <ConflictAnalysisCard key={idx} analysis={conflictData} rawText={cleanedText.trim()} />
        }

        const signalData = parseTradeSignal(cleanedText.trim())
        if (signalData) {
          return <TradeSignalCard key={idx} data={signalData} rawText={cleanedText.trim()} />
        }

        return (
          <ReactMarkdown
            key={idx}
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {cleanedText}
          </ReactMarkdown>
        )
      })}
    </div>
  )
}

