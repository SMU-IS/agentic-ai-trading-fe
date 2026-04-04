"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AskAIDemo from "@/components/portfolio/chat/AskAIDemo"

// ─── Types ────────────────────────────────────────────────────────────────────

type Feature = {
  id: string
  tab: string
  icon: React.ReactNode
  headline: string
  description: string
  prompt: string
  response: React.ReactNode
  accentColor: string
  bgClass: string
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const icons = {
  trade: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  chat: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  news: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
    </svg>
  ),
  notify: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  risk: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
}

// ─── Mock UI blocks for each feature ─────────────────────────────────────────

function TradeResponse() {
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-lg border border-border bg-background/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">Trade Executed</span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">BUY</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div><p className="text-foreground font-medium">NVDA</p><p>Symbol</p></div>
          <div><p className="text-foreground font-medium">$134.20</p><p>Price</p></div>
          <div><p className="text-foreground font-medium">12 shares</p><p>Quantity</p></div>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-background/60 p-3 text-xs text-muted-foreground leading-relaxed">
        <span className="text-foreground font-medium">Reasoning: </span>
        FinBERT sentiment score +0.82 on NVDA earnings beat. Credibility-weighted signal exceeded buy threshold of 0.75. Position sized within your 8% risk limit.
      </div>
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-0.5">Broker: Alpaca</span>
        <span className="rounded-full bg-muted px-2 py-0.5">Order filled ✓</span>
        <span className="rounded-full bg-muted px-2 py-0.5">14:32 SGT</span>
      </div>
    </div>
  )
}

function ChatResponse() {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-xl rounded-br-sm border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-foreground">
          Why did Agent M sell my TSLA position last week?
        </div>
      </div>
      <div className="max-w-[88%] rounded-xl rounded-bl-sm bg-transparent px-1 py-1 text-xs text-foreground leading-relaxed space-y-2">
        <p>On <strong>28 Mar</strong>, multiple high-credibility sources reported concerns around Tesla's delivery miss for Q1 2025. Here's what triggered the sell:</p>
        <ul className="space-y-1 pl-3 text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary">—</span>Reuters, FT, Bloomberg all flagged negative sentiment (avg. score: <strong className="text-foreground">-0.71</strong>)</li>
          <li className="flex gap-2"><span className="text-primary">—</span>Combined credibility weight exceeded your configured sell threshold</li>
          <li className="flex gap-2"><span className="text-primary">—</span>Position exited at <strong className="text-foreground">$168.40</strong>, avoiding a further 6.2% decline</li>
        </ul>
      </div>
    </div>
  )
}

function NewsResponse() {
  const items = [
    { ticker: "AAPL", headline: "Apple reports record services revenue, beats estimates", sentiment: 0.86, source: "Reuters" },
    { ticker: "TSLA", headline: "Tesla misses Q1 delivery targets amid production slowdown", sentiment: -0.71, source: "FT" },
    { ticker: "NVDA", headline: "NVIDIA data center revenue surges 110% year-on-year", sentiment: 0.91, source: "Bloomberg" },
  ]
  return (
    <div className="space-y-2 text-xs">
      {items.map((item) => (
        <div key={item.ticker} className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3">
          <span className="mt-0.5 rounded bg-muted px-1.5 py-0.5 font-mono font-semibold text-foreground">{item.ticker}</span>
          <div className="flex-1 min-w-0">
            <p className="text-foreground leading-snug truncate">{item.headline}</p>
            <p className="mt-0.5 text-muted-foreground">{item.source}</p>
          </div>
          <span className={`shrink-0 font-semibold ${item.sentiment > 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {item.sentiment > 0 ? "+" : ""}{item.sentiment.toFixed(2)}
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
          type: "Breaking News",
          color: "text-amber-400",
          bg: "bg-amber-500/10 border-amber-500/20",
          title: "Fed signals rate cut delay — impacts your bond holdings",
          time: "2 min ago",
        },
        {
          type: "Trade Alert",
          color: "text-emerald-400",
          bg: "bg-emerald-500/10 border-emerald-500/20",
          title: "Agent M bought 8 shares of META at $512.30",
          time: "14 min ago",
        },
        {
          type: "Portfolio Alert",
          color: "text-sky-400",
          bg: "bg-sky-500/10 border-sky-500/20",
          title: "AMZN position up 4.2% — trailing stop adjusted",
          time: "1 hr ago",
        },
      ].map((n) => (
        <div key={n.title} className={`rounded-lg border ${n.bg} p-3 space-y-1`}>
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
        <p className="font-semibold text-foreground text-sm">Your Risk Profile</p>
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
        Agent M will never execute a trade that breaches your configured limits — regardless of signal strength.
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
    prompt: "Execute a buy order for NVDA based on latest earnings sentiment",
    response: <TradeResponse />,
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
    prompt: "Why did Agent M sell my TSLA position last week?",
    response: <ChatResponse />,
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
    prompt: "Show me today's top sentiment signals for my watchlist",
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
    prompt: "Alert me when high-credibility news hits any of my holdings",
    response: <NotifyResponse />,
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
    prompt: "Set my max single-position size to 8% and pause trading if daily loss exceeds 3%",
    response: <RiskResponse />,
    accentColor: "text-rose-400",
    bgClass: "from-rose-900/20 to-transparent",
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentMFeatures() {
  const [activeId, setActiveId] = useState(FEATURES[0].id)
  const active = FEATURES.find((f) => f.id === activeId)!

  return (
    <section className="w-full py-20 px-4">
      <div className="mx-auto max-w-6xl space-y-12">

        {/* Section header */}
        <div className="text-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            let it cook
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How you can use Agent M
          </h2>
          <p className="mx-auto max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
            From news ingestion to trade execution, Agent M orchestrates the entire trading workflow —
            autonomously, within your guardrails.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap justify-center gap-2">
          {FEATURES.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveId(f.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200
                ${activeId === f.id
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                }`}
            >
              <span className={activeId === f.id ? active.accentColor : ""}>{f.icon}</span>
              {f.tab}
            </button>
          ))}
        </div>

        {/* Feature panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${active.bgClass} bg-card`}
          >
            <div className="grid gap-0 md:grid-cols-2">

              {/* Left — description */}
              <div className="flex flex-col justify-center gap-5 p-8 md:p-10 border-b md:border-b-0 md:border-r border-border">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-card border border-border ${active.accentColor}`}>
                  {active.icon}
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold tracking-tight leading-snug">
                    {active.headline}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {active.description}
                  </p>
                </div>
              </div>

              {/* Right — mock UI */}
              <div className="flex flex-col gap-4 p-8 md:p-10">
                {/* Prompt bubble */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Prompt</p>
                  <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground leading-relaxed">
                    {active.prompt}
                  </div>
                </div>

                {/* Response */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Agent M</p>
                  <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
                    {active.response}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Live demo chat */}
        {/* <div className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold tracking-tight">Try it yourself</h3>
            <p className="text-sm text-muted-foreground">
              Ask Agent M anything about how it works.
            </p>
          </div>
          <AskAIDemo />
        </div> */}

      </div>
    </section>
  )
}