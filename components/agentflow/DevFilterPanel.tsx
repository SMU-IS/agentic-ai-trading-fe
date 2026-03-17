"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FaReddit } from "react-icons/fa"
import { SiTradingview } from "react-icons/si"
import { useDevFilters, Source } from "@/hooks/use-dev-filters"

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
    isHydrating,
    isSaving,
    savedPulse,
    toggleSource,
    handleRedditChange,
    handleTickerInput,
    handleTickerKeyDown,
    removeTicker,
    handleSave,
  } = useDevFilters()

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute right-4 top-16 z-[1000] w-64 pointer-events-auto"
    >
      <Card className="border border-primary/20 bg-card/95 backdrop-blur-sm shadow-xl p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">
              Modify Sources
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

        {/* Sub-filters — appear below both toggles */}
        <AnimatePresence>
          {sources.reddit.enabled && (
            <motion.div
              key="reddit-filter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-1"
            >
              <p className="text-xs text-muted-foreground">
                Reddit — filter by account
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  u/
                </span>
                <Input
                  value={sources.reddit.redditAccount}
                  onChange={(e) => handleRedditChange(e.target.value)}
                  placeholder="username"
                  className="pl-7 h-8 text-xs bg-muted/30 border-border focus:border-orange-500/50"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sources.tradingview.enabled && (
            <motion.div
              key="tradingview-filter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-2"
            >
              <p className="text-xs text-muted-foreground">
                TradingView — filter by tickers{" "}
                <span className="text-foreground/40">(press Enter)</span>
              </p>
              <Input
                value={sources.tradingview.tickerInput}
                onChange={(e) => handleTickerInput(e.target.value)}
                onKeyDown={handleTickerKeyDown}
                placeholder="e.g. NVDA, AAPL..."
                className="h-8 text-xs bg-muted/30 border-border focus:border-blue-500/50 uppercase"
              />
              {sources.tradingview.tickers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap gap-1.5 pt-1"
                >
                  {sources.tradingview.tickers.map((ticker) => (
                    <motion.div
                      key={ticker}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1 rounded-md bg-blue-500/15 border border-blue-500/30 px-2 py-0.5"
                    >
                      <span className="text-[11px] font-semibold text-blue-400">
                        {ticker}
                      </span>
                      <button
                        onClick={() => removeTicker(ticker)}
                        className="text-blue-400/60 hover:text-blue-400 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
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
