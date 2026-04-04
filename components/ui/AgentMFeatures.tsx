"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot,
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  MessageSquare,
  Newspaper,
  Bell,
  Shield,
  MoreHorizontal,
} from "lucide-react"
import AskAIDemo from "@/components/portfolio/chat/AskAIDemo"
import SpeculationAgent from "../trades/speculation-agent/SpeculationAgent"

// ─── Types ────────────────────────────────────────────────────────────────────

type Feature = {
  id: string
  tab: string
  icon: React.ReactNode
  headline: string
  description: string
  response: React.ReactNode
  accentColor: string
  prompt?: string
  image?: string
  bgClass: string
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const icons = {
  trade: <TrendingUp width={18} height={18} />,
  chat: <MessageSquare width={18} height={18} />,
  news: <Newspaper width={18} height={18} />,
  notify: <Bell width={18} height={18} />,
  risk: <Shield width={18} height={18} />,
}
// ─── TradeResponse — mirrors SpeculationAgent card UI ─────────────────────────

function TradeResponse() {
  const [signalOpen, setSignalOpen] = useState(false)
  const [reasoningOpen, setReasoningOpen] = useState(true)

  return (
    <div className="w-full h-full flex items-center justify-center">
      <img
        src="/images/demo/trades.png"
        alt="Autonomous trading — trade detail view"
        width={800}
        height={600}
        className="w-[75vw] sm:w-[50vw] md:w-[30vw] object-full object-top rounded-2xl lg:rounded-3xl border border-border"
        loading="lazy"
      />
    </div>
  )
}

// ─── Other mock responses (unchanged) ────────────────────────────────────────

function ChatResponse() {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-xl rounded-br-sm border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-foreground">
          Why did Agent M sell GOOGL last week?
        </div>
      </div>
      <div className="max-w-[88%] rounded-xl rounded-bl-sm bg-transparent px-1 py-1 text-xs text-foreground leading-relaxed space-y-2">
        <div className="space-y-2 pl-1 text-muted-foreground text-[10px] lg:text-xs  ">
          <p>
            Let's dive into the details of this GOOGL transaction. The agent
            decided to sell{" "}
            <strong className="text-foreground">
              15 shares of GOOGL at $297.47
            </strong>{" "}
            on <strong className="text-foreground">April 2, 2026</strong>. This
            decision was likely driven by a combination of factors, including a
            bearish rumor about{" "}
            <strong className="text-foreground">
              ad revenue concentration
            </strong>{" "}
            and the potential disruption caused by AI.
          </p>
          <p>
            Although GOOGL had a strong Q4 2025 earnings report, the massive{" "}
            <strong className="text-foreground">
              $175–185 billion capex forecast for 2026
            </strong>{" "}
            might have raised concerns about{" "}
            <strong className="text-foreground">
              margin pressure and profitability
            </strong>
            . The fact that Google Cloud is growing at{" "}
            <strong className="text-foreground">48% year-over-year</strong> is
            certainly a positive, but it might not be enough to offset the
            potential risks.
          </p>
          <p className="hidden sm:block">
            From a technical analysis perspective, the charts were also flashing
            warning signs. The stock had broken down from a{" "}
            <strong className="text-foreground">
              head-and-shoulders pattern
            </strong>
            , was trading below its{" "}
            <strong className="text-foreground">50-day moving average</strong>,
            and had a relatively weak{" "}
            <strong className="text-foreground">RSI of 40.17</strong>. The{" "}
            <strong className="text-foreground">MACD was also bearish</strong>,
            which further supported the sell decision.
          </p>
        </div>
      </div>
    </div>
  )
}

function NewsResponse() {
  const items = [
    {
      ticker: "AAPL",
      headline: "Apple reports record services revenue, beats estimates",
      sentiment: 0.86,
      source: "Reddit",
    },
    {
      ticker: "TSLA",
      headline: "Tesla misses Q1 delivery targets amid production slowdown",
      sentiment: -0.71,
      source: "TradingView Minds",
    },
    {
      ticker: "NVDA",
      headline: "NVIDIA data center revenue surges 110% year-on-year",
      sentiment: 0.91,
      source: "TradingView Ideas",
    },
    {
      ticker: "META",
      headline:
        "Meta AI assistant hits 1 billion users, ad revenue outlook raised",
      sentiment: 0.78,
      source: "Bloomberg",
    },
  ]
  return (
    <div className="space-y-2 text-xs">
      {items.map((item) => (
        <div
          key={item.ticker}
          className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3"
        >
          <span className="mt-0.5 rounded bg-muted px-1.5 py-0.5 font-mono font-semibold text-foreground">
            {item.ticker}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-foreground leading-snug truncate">
              {item.headline}
            </p>
            <p className="mt-0.5 text-muted-foreground">{item.source}</p>
          </div>
          <span
            className={`shrink-0 font-semibold ${item.sentiment > 0 ? "text-emerald-400" : "text-rose-400"}`}
          >
            {item.sentiment > 0 ? "+" : ""}
            {item.sentiment.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  )
}

function NotifyResponse() {
  return (
    <div className="space-y-3 text-xs">
      {[
        {
          type: "News",
          color: "text-amber-400",
          bg: "bg-amber-500/10 border-amber-500/20",
          title: "Fed signals rate cut delay — impacts your bond holdings",
          time: "2 min ago",
        },
        {
          type: "Signal Alert",
          color: "text-emerald-400",
          bg: "bg-emerald-500/10 border-emerald-500/20",
          title: "NVDA sentiment score hit +0.91 — buy signal triggered",
          time: "14 min ago",
        },
        {
          type: "Order Alert",
          color: "text-sky-400",
          bg: "bg-sky-500/10 border-sky-500/20",
          title: "Order filled — bought 8 shares of META at $512.30",
          time: "1 hr ago",
        },
      ].map((n) => (
        <div
          key={n.title}
          className={`rounded-lg border ${n.bg} p-3 space-y-1`}
        >
          <div className="flex items-center justify-between">
            <span className={`font-semibold ${n.color}`}>{n.type}</span>
            <span className="text-muted-foreground">{n.time}</span>
          </div>
          <p className="text-foreground leading-snug">{n.title}</p>
        </div>
      ))}
    </div>
  )
}

function RiskResponse() {
  return (
    <div className="space-y-3 text-xs">
      <div className="rounded-lg border border-border bg-background/60 p-3 space-y-3">
        <p className="font-semibold text-foreground text-sm">
          Your Risk Profile
        </p>
        {[
          { label: "Max position size", value: "8%", bar: 8 },
          { label: "Daily drawdown limit", value: "3%", bar: 3 },
          { label: "Sector concentration", value: "25%", bar: 25 },
        ].map((r) => (
          <div key={r.label} className="space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>{r.label}</span>
              <span className="text-foreground font-medium">{r.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${r.bar * 4}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-background/60 p-3 text-muted-foreground leading-relaxed">
        <span className="text-foreground font-medium">Guardrail active: </span>
        Agent M will never execute a trade that breaches your configured limits
        — regardless of signal strength.
      </div>
    </div>
  )
}

// ─── Features data ────────────────────────────────────────────────────────────

const FEATURES: Feature[] = [
  {
    id: "trade",
    tab: "Autonomous Trading",
    icon: icons.trade,
    headline: "Agent M trades on your behalf",
    description:
      "Agent M continuously monitors market news, runs sentiment analysis, and executes optimised buy and sell orders through your broker — all without you lifting a finger.",
    response: <TradeResponse />,
    image: "public/images/demo/trades.png",
    accentColor: "text-emerald-400",
    bgClass: "from-emerald-900/20 to-transparent",
  },
  {
    id: "chat",
    tab: "AskAI",
    icon: icons.chat,
    headline: "Your portfolio, explained in plain language",
    description:
      "Ask anything about your holdings, past trades, or market events. Agent M retrieves verified news and portfolio context to give you grounded, specific answers.",
    response: <ChatResponse />,
    prompt: "Why did Agent M sell my GOOGL last week?",
    accentColor: "text-sky-400",
    bgClass: "from-sky-900/20 to-transparent",
  },
  {
    id: "news",
    tab: "News Intelligence",
    icon: icons.news,
    headline: "Sentiment-weighted news, in real time",
    description:
      "Agent M scrapes Reddit, Yahoo Finance, Bloomberg, and more — then scores each article for sentiment and credibility so only the most reliable signals drive decisions.",
    response: <NewsResponse />,
    accentColor: "text-violet-400",
    bgClass: "from-violet-900/20 to-transparent",
  },
  {
    id: "notify",
    tab: "Smart Alerts",
    icon: icons.notify,
    headline: "The right alert, at the right moment",
    description:
      "Get notified the instant breaking news directly impacts a stock you hold — and receive trade confirmations the moment Agent M acts on your behalf.",
    response: <NotifyResponse />,
    prompt: "Alert me when high-credibility news hits any of my holdings",
    accentColor: "text-amber-400",
    bgClass: "from-amber-900/20 to-transparent",
  },
  {
    id: "risk",
    tab: "Risk Controls",
    icon: icons.risk,
    headline: "You set the guardrails. Agent M stays within them.",
    description:
      "Configure max position sizes, drawdown limits, and sector caps. Agent M will never breach your limits — no matter how strong the signal.",
    response: <RiskResponse />,
    prompt:
      "Set my max single-position size to 8% and pause trading if daily loss exceeds 3%",
    accentColor: "text-rose-400",
    bgClass: "from-rose-900/20 to-transparent",
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentMFeatures() {
  const [activeId, setActiveId] = useState(FEATURES[0].id)
  const active = FEATURES.find((f) => f.id === activeId)!
  const [showMore, setShowMore] = useState(false)

  // For the trade tab, the right panel takes the full card height with its own scroll
  const isTradeTab =
    activeId === "trade" || activeId === "news" || activeId === "notify"

  return (
    <section id="features-section" className="w-full py-16 px-6 lg:px-12">
      <div className="mx-auto ">
        {/* Section header */}
        <div className="text-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            let it cook
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How you can use Agent M
          </h2>
          <p className="mx-auto max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
            From news ingestion to trade execution, Agent M orchestrates the
            entire trading workflow autonomously, within your guardrails.
          </p>
        </div>

        {/* Tab bar */}
        <div className="relative flex justify-center mt-12 mb-6">
          {/* Desktop: all tabs in one row */}
          <div className="hidden md:flex justify-center gap-1 border border-border rounded-xl bg-card p-1 w-fit mx-auto">
            {FEATURES.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveId(f.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200
          ${
            activeId === f.id
              ? "bg-primary/10 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
              >
                <span className={activeId === f.id ? active.accentColor : ""}>
                  {f.icon}
                </span>
                {f.tab}
              </button>
            ))}
          </div>

          {/* Mobile: first 3 tabs + ellipsis */}
          <div className="flex md:hidden justify-center gap-1 border border-border rounded-full bg-card p-1 w-fit mx-auto">
            {FEATURES.slice(0, 2).map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setActiveId(f.id)
                  setShowMore(false)
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs text-left font-medium transition-all duration-200
          ${
            activeId === f.id
              ? "bg-primary/10 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
              >
                <span className={activeId === f.id ? active.accentColor : ""}>
                  {f.icon}
                </span>
                {f.tab}
              </button>
            ))}

            {/* Ellipsis button */}
            <button
              onClick={() => setShowMore((v) => !v)}
              className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-medium transition-all duration-200
        ${
          FEATURES.slice(2).some((f) => f.id === activeId)
            ? "bg-primary/10 text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
            >
              {FEATURES.slice(2).some((f) => f.id === activeId) ? (
                <span className={active.accentColor}>{active.icon}</span>
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Dropdown for remaining tabs on mobile */}
          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-full mt-2 z-50 flex flex-col gap-1 rounded-xl border border-border bg-card p-1 shadow-lg min-w-[180px]"
              >
                {FEATURES.slice(2).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setActiveId(f.id)
                      setShowMore(false)
                    }}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 text-left
              ${
                activeId === f.id
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
                  >
                    <span className={activeId === f.id ? f.accentColor : ""}>
                      {f.icon}
                    </span>
                    {f.tab}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Feature panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`h-full relative overflow-hidden border border-border rounded-xl bg-gradient-to-br ${active.bgClass} bg-card`}
          >
            <div
              className={`min-h-[500px] grid gap-0 ${isTradeTab ? "md:grid-cols-[1fr_1.1fr]" : "md:grid-cols-2"}`}
            >
              {/* Left — description */}
              <div className="flex flex-col justify-center gap-5 p-8 md:p-10 border-b md:border-b-0 md:border-r border-border">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center bg-card border border-border ${active.accentColor}`}
                >
                  {active.icon}
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold tracking-tight leading-snug">
                    {active.headline}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {active.description}
                  </p>
                </div>
              </div>

              {/* Right — mock UI */}
              <div
                className={`flex flex-col gap-4 p-6 md:p-8 ${isTradeTab ? "overflow-hidden" : ""}`}
              >
                {isTradeTab ? (
                  active.response
                ) : (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Prompt
                      </p>
                      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground leading-relaxed">
                        {active.prompt}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Agent M
                      </p>
                      <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
                        {active.response}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
