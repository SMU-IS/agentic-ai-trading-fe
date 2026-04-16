"use client"

import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { Filter, Bot, User, TrendingUp, TrendingDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TradeEvent } from "@/lib/types"

interface FiltersDropdownProps {
  trades: TradeEvent[]
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  filterType: "all" | "buy" | "sell"
  setFilterType: (v: "all" | "buy" | "sell") => void
  filterStatus: "all" | "filled" | "pending" | "cancelled"
  setFilterStatus: (v: "all" | "filled" | "pending" | "cancelled") => void
  filterSource: "all" | "agent" | "manual"
  setFilterSource: (v: "all" | "agent" | "manual") => void
  filterSymbols: string[]
  setFilterSymbols: (v: string[]) => void
  filterDateFrom: Date | null
  setFilterDateFrom: (v: Date | null) => void
  filterDateTo: Date | null
  setFilterDateTo: (v: Date | null) => void
  filterTpSl: "all" | "tp" | "sl" | "ongoing"
  setFilterTpSl: (v: "all" | "tp" | "sl" | "ongoing") => void
}

export default function FiltersDropdown({
  trades,
  showFilters,
  setShowFilters,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  filterSource,
  setFilterSource,
  filterSymbols,
  setFilterSymbols,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
  filterTpSl,
  setFilterTpSl,
}: FiltersDropdownProps) {
  const activeCount = [
    filterType !== "all" ? 1 : 0,
    filterStatus !== "all" ? 1 : 0,
    filterSource !== "all" ? 1 : 0,
    filterSymbols.length > 0 ? 1 : 0,
    filterDateFrom || filterDateTo ? 1 : 0,
    filterTpSl !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const toInputValue = (d: Date | null) =>
    d ? d.toISOString().slice(0, 10) : ""

  const today = new Date().toISOString().slice(0, 10)

  const handleDateFromChange = (val: string) => {
    if (!val) { setFilterDateFrom(null); return }
    const next = new Date(val)
    if (filterDateTo && next > filterDateTo) return
    setFilterDateFrom(next)
  }

  const handleDateToChange = (val: string) => {
    if (!val) { setFilterDateTo(null); return }
    const next = new Date(val)
    if (filterDateFrom && next < filterDateFrom) return
    setFilterDateTo(next)
  }

  const clearAll = () => {
    setFilterType("all")
    setFilterStatus("all")
    setFilterSource("all")
    setFilterSymbols([])
    setFilterDateFrom(null)
    setFilterDateTo(null)
    setFilterTpSl("all")
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        className="h-8 text-xs rounded-lg border border-foreground/30 bg-muted text-foreground hover:bg-muted/20"
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter className="mr-2 h-3 w-3" />
        Filters
        <AnimatePresence>
          {activeCount > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground"
            >
              {activeCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="text-sm font-bold">
                Filters
                {activeCount > 0 && (
                  <span className="ml-2 text-xs font-bold text-muted-foreground">
                    ({activeCount})
                  </span>
                )}
              </h4>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearAll}
                  className="text-xs font-semibold text-red-500 hover:text-red-400 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Symbol Filter */}
              <div>
                <h4 className="mb-2 text-xs text-muted-foreground">Symbol</h4>
                <AnimatePresence>
                  {filterSymbols.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                      className="flex flex-wrap gap-1.5 mb-2 overflow-hidden"
                    >
                      <AnimatePresence>
                        {filterSymbols.map((sym) => (
                          <motion.div
                            key={sym}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                            }}
                            className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"
                          >
                            {sym}
                            <button
                              onClick={() =>
                                setFilterSymbols(
                                  filterSymbols.filter((s) => s !== sym),
                                )
                              }
                              className="ml-0.5 rounded-full hover:bg-primary-foreground/20 p-0.5"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  type="text"
                  placeholder="Type a symbol and press Enter..."
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value
                        .trim()
                        .toUpperCase()
                      if (val && !filterSymbols.includes(val)) {
                        setFilterSymbols([...filterSymbols, val])
                      }
                      ;(e.target as HTMLInputElement).value = ""
                    }
                  }}
                />

                {(() => {
                  const uniqueSymbols = [
                    ...new Set(trades.map((t) => t.symbol)),
                  ]
                    .filter((s) => !filterSymbols.includes(s))
                    .slice(0, 6)
                  return uniqueSymbols.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {uniqueSymbols.map((sym) => (
                        <motion.button
                          key={sym}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            setFilterSymbols([...filterSymbols, sym])
                          }
                          className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          {sym}
                        </motion.button>
                      ))}
                    </div>
                  ) : null
                })()}
              </div>

              {/* Date Range */}
              <div>
                <h4 className="mb-2 text-xs text-muted-foreground">Date Range</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-muted-foreground">From</label>
                    <input
                      type="date"
                      value={toInputValue(filterDateFrom)}
                      max={toInputValue(filterDateTo) || today}
                      onChange={(e) => handleDateFromChange(e.target.value)}
                      className="w-full rounded-lg border border-border bg-muted px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-muted-foreground">To</label>
                    <input
                      type="date"
                      value={toInputValue(filterDateTo)}
                      min={toInputValue(filterDateFrom)}
                      max={today}
                      onChange={(e) => handleDateToChange(e.target.value)}
                      className="w-full rounded-lg border border-border bg-muted px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                {(filterDateFrom || filterDateTo) && (
                  <button
                    onClick={() => { setFilterDateFrom(null); setFilterDateTo(null) }}
                    className="mt-1.5 text-[10px] text-red-500 hover:text-red-400 transition-colors"
                  >
                    Clear dates
                  </button>
                )}
              </div>

              {/* Trade Source */}
              <div>
                <h4 className="mb-2 text-xs text-muted-foreground">
                  Trade Source
                </h4>
                <LayoutGroup id="source">
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    {[
                      { label: "All", value: "all", icon: null },
                      {
                        label: "Agent",
                        value: "agent",
                        icon: <Bot className="h-3 w-3" />,
                      },
                      {
                        label: "Manual",
                        value: "manual",
                        icon: <User className="h-3 w-3" />,
                      },
                    ].map(({ label, value, icon }) => (
                      <button
                        key={value}
                        onClick={() =>
                          setFilterSource(value as "all" | "agent" | "manual")
                        }
                        className="relative h-8 flex-1 flex items-center justify-center gap-1 rounded text-xs z-10"
                      >
                        {filterSource === value && (
                          <motion.div
                            layoutId="source-active"
                            className="absolute inset-0 bg-primary rounded"
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}
                        <span
                          className={`relative z-10 flex items-center gap-1 font-medium transition-colors duration-150 ${filterSource === value ? "text-primary-foreground" : "text-muted-foreground"}`}
                        >
                          {icon}
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
              </div>

              {/* Trade Type */}
              <div>
                <h4 className="mb-2 text-xs text-muted-foreground">
                  Trade Type
                </h4>
                <LayoutGroup id="type">
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    {[
                      { label: "All", value: "all", icon: null },
                      {
                        label: "Buys",
                        value: "buy",
                        icon: <TrendingUp className="h-3 w-3" />,
                      },
                      {
                        label: "Sells",
                        value: "sell",
                        icon: <TrendingDown className="h-3 w-3" />,
                      },
                    ].map(({ label, value, icon }) => (
                      <button
                        key={value}
                        onClick={() =>
                          setFilterType(value as "all" | "buy" | "sell")
                        }
                        className="relative h-8 flex-1 flex items-center justify-center gap-1 rounded text-xs z-10"
                      >
                        {filterType === value && (
                          <motion.div
                            layoutId="type-active"
                            className="absolute inset-0 bg-primary rounded"
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}
                        <span
                          className={`relative z-10 flex items-center gap-1 font-medium transition-colors duration-150 ${filterType === value ? "text-primary-foreground" : "text-muted-foreground"}`}
                        >
                          {icon}
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
              </div>

              {/* TP / SL */}
              <div>
                <h4 className="mb-2 text-xs text-muted-foreground">TP / SL Hit</h4>
                <LayoutGroup id="tpsl">
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    {[
                      { label: "All", value: "all" },
                      { label: "TP Hit", value: "tp" },
                      { label: "SL Hit", value: "sl" },
                      { label: "Ongoing", value: "ongoing" },
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => setFilterTpSl(value as "all" | "tp" | "sl" | "ongoing")}
                        className="relative h-8 flex-1 flex items-center justify-center gap-1 rounded text-xs z-10"
                      >
                        {filterTpSl === value && (
                          <motion.div
                            layoutId="tpsl-active"
                            className="absolute inset-0 bg-primary rounded"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span
                          className={`relative z-10 font-medium transition-colors duration-150 ${filterTpSl === value ? "text-primary-foreground" : "text-muted-foreground"}`}
                        >
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
              </div>

              {/* Status */}
              <div>
                <h4 className="mb-2 text-xs text-muted-foreground">Status</h4>
                <LayoutGroup id="status">
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                    {[
                      { label: "All", value: "all" },
                      { label: "Filled", value: "filled" },
                      { label: "Pending", value: "pending" },
                      { label: "Cancelled", value: "cancelled" },
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() =>
                          setFilterStatus(
                            value as "all" | "filled" | "pending" | "cancelled",
                          )
                        }
                        className="relative h-8 rounded text-xs z-10 overflow-hidden"
                      >
                        {filterStatus === value && (
                          <motion.div
                            layoutId="status-active"
                            className="absolute inset-0 bg-primary rounded"
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}
                        <span
                          className={`relative z-10 font-medium transition-colors duration-150 ${filterStatus === value ? "text-primary-foreground" : "text-muted-foreground"}`}
                        >
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
