"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaReddit } from "react-icons/fa"
import { SiTradingview } from "react-icons/si"
import { useEffect, useRef } from "react"

import {
  useDevFilters,
  REDDIT_SUBREDDITS,
  Subreddit,
} from "@/hooks/use-dev-filters"

// ─── Motion Toggle ─────────────────────────────────────────────────────────────
const MotionToggle = ({
  enabled,
  onToggle,
  label,
  icon,
  activeRgb,
  inactiveRgb = "rgb(39, 39, 42)",
}: {
  enabled: boolean
  onToggle: () => void
  label: string
  icon: React.ReactNode
  activeRgb: string
  inactiveRgb?: string
}) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left text-xs hover:bg-muted/60 transition-colors duration-200"
  >
    <span className="text-base">{icon}</span>
    <span className="font-medium text-foreground">{label}</span>
    <div className="ml-auto">
      <div className="relative inline-flex h-6 w-11 items-center rounded-full">
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ backgroundColor: enabled ? activeRgb : inactiveRgb }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-md"
          animate={{ x: enabled ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </div>
  </button>
)
// ──────────────────────────────────────────────────────────────────────────────

export function DevFilterPanel() {
  const {
    sources,
    riskMode,
    customPrompt,
    setCustomPrompt,
    isHydrating,
    isSaving,
    savedPulse,
    toggleSource,
    toggleSubreddit,
    handleTickerInput,
    handleTickerKeyDown,
    removeTicker,
    toggleRiskMode,
    handleSave,
  } = useDevFilters()
  const subredditListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sources.reddit.enabled) return
    const el = subredditListRef.current
    if (!el) return

    // Small delay so AnimatePresence finishes its entrance first
    const timeout = setTimeout(() => {
      el.scrollTo({ top: 60, behavior: "smooth" })
      setTimeout(() => {
        el.scrollTo({ top: 0, behavior: "smooth" })
      }, 500)
    }, 300)

    return () => clearTimeout(timeout)
  }, [sources.reddit.enabled])



  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute right-4 top-16 z-[1000] pointer-events-auto"
    >
      <Card className="border border-primary/20 bg-card/95 backdrop-blur-sm shadow-xl p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">
              Modify Agents
            </p>
          </div>
          <AnimatePresence>
            {isHydrating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-3 w-3 rounded-full border-2 border-primary/40 border-t-primary animate-spin"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-[1fr_200px] gap-4">
          {/* Column 1: Sources */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              News Sources
            </p>
            {/* Source toggles */}
            <div className="space-y-2">
              <MotionToggle
                enabled={sources.reddit.enabled}
                onToggle={() => toggleSource("reddit")}
                label="Reddit"
                icon={<FaReddit className="h-4 w-4 text-orange-600" />}
                activeRgb="rgb(255, 143, 95)"
              />
              <MotionToggle
                enabled={sources.tradingview.enabled}
                onToggle={() => toggleSource("tradingview")}
                label="TradingView"
                icon={<SiTradingview className="h-4 w-4 text-blue-400" />}
                activeRgb="rgb(59, 130, 246)"
              />
            </div>

            {/* Sub-filter: Reddit subreddits */}
            <AnimatePresence>
              {sources.reddit.enabled && (
                <motion.div
                  key="reddit-filter"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-2"
                >
                  <p className="text-xs text-muted-foreground">
                    Filter subreddits
                  </p>
                  <div ref={subredditListRef} className="flex flex-col gap-0.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    {REDDIT_SUBREDDITS.map((sub) => {
                      const selected = sources.reddit.selectedSubreddits.includes(sub)
                      return (
                        <button
                          key={sub}
                          onClick={() => toggleSubreddit(sub as Subreddit)}
                          className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 text-left ${selected
                            ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
                            : "border-transparent bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:border-border"
                            }`}
                        >
                          <FaReddit
                            className={`h-3.5 w-3.5 shrink-0 ${selected ? "text-orange-400" : "text-muted-foreground"}`}
                          />
                          <span className="flex-1">{sub}</span>
                          <motion.div
                            animate={{
                              scale: selected ? 1 : 0,
                              opacity: selected ? 1 : 0,
                            }}
                            transition={{ duration: 0.15 }}
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400"
                          />
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {!isHydrating &&
              !sources.reddit.enabled &&
              !sources.tradingview.enabled && (
                <p className="text-[11px] text-muted-foreground/50 text-center italic py-1">
                  Toggle a source to configure filters
                </p>
              )}
          </div>

          {/* Column 2: Risk Adjustment */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              Risk Adjustment
            </p>
            <div className="relative flex items-center rounded-lg border border-border bg-muted/30 p-1 text-xs overflow-hidden">
              {/* Sliding background */}
              <motion.div
                className="absolute top-1 bottom-1 rounded-md pointer-events-none"
                style={{ width: "calc(33.333% - 2.67px)", left: 4 }}
                initial={false}
                animate={{
                  x: `calc(${(riskMode === "conservative" ? 0 : riskMode === "aggressive" ? 1 : 2) * 100}%)`,
                  backgroundColor:
                    riskMode === "conservative"
                      ? "hsl(var(--primary) / 0.6)"
                      : riskMode === "aggressive"
                        ? "rgb(239, 68, 68)"
                        : "rgb(100, 116, 139)",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
              {(["conservative", "aggressive", "custom"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => toggleRiskMode(mode)}
                  className={`relative z-10 flex-1 py-1 text-center font-medium transition-colors duration-300 capitalize ${
                    riskMode === mode ? "text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Custom prompt textarea */}
            <AnimatePresence>
              {riskMode === "custom" && (
                <motion.div
                  key="custom-prompt"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter custom risk instructions..."
                    className="w-full mt-1 min-h-[80px] resize-y rounded-md border border-border bg-muted/30 px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-8 text-xs rounded-lg gap-2 bg-teal-500"
        >
          <AnimatePresence mode="wait">
            {savedPulse ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  className="h-2 w-2 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 0.4 }}
                />
                Saved
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Save className="h-3 w-3" />
                  </motion.div>
                ) : (
                  <Save className="h-3 w-3" />
                )}
                {isSaving ? "Saving..." : "Save Filters"}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </Card>
    </motion.div>
  )
}
