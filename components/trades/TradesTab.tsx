"use client"

import { useState, useEffect, useRef } from "react"
import TradingTimeline from "./trading-timeline/TradingTimeline"
import SpeculationAgent from "./speculation-agent/SpeculationAgent"
import AgentSummary from "./AgentSummary"
import { TradeEvent } from "@/lib/types"
import Cookies from "js-cookie"
import { X } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

const getToken = () => Cookies.get("jwt") ?? ""

interface HoldingInfo {
  avg_entry_price: number
  quantity: number
}

export default function TradesTab() {
  // selectedTrade drives the timeline highlight only
  const [selectedTrade, setSelectedTrade] = useState<TradeEvent | null>(null)
  // sheetTrade is what the mobile sheet renders — intentionally lags by one
  // animation frame on open, and clears only after the close animation ends,
  // so EmptyState (196 animated dots) is never mounted inside the sheet
  const [sheetTrade, setSheetTrade] = useState<TradeEvent | null>(null)
  const [holdings, setHoldings] = useState<Record<string, HoldingInfo>>({})
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)
  const isMobile = useIsMobile()
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/positions`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          },
        )
        const data = await response.json()
        const holdingsMap: Record<string, HoldingInfo> = {}
        data.forEach((holding: any) => {
          holdingsMap[holding.symbol] = {
            avg_entry_price: parseFloat(holding.avg_entry_price),
            quantity: parseFloat(holding.qty),
          }
        })
        setHoldings(holdingsMap)
      } catch (err) {
        console.error("Failed to fetch holdings:", err)
      }
    }

    fetchHoldings()
    return () => {
      document.body.style.overflow = ""
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const handleSelectTrade = (trade: TradeEvent) => {
    // Cancel any in-flight close timer so a rapid re-open doesn't conflict
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    setSelectedTrade(trade)
    if (isMobile) document.body.style.overflow = "hidden"

    // Frame 1: start the slide-up animation (lightweight state change)
    // Frame 2: mount the heavy SpeculationAgent content — by this point the
    //          CSS transition has already started, so it doesn't compete with
    //          the initial heavy render on the same frame
    requestAnimationFrame(() => {
      setIsOverlayVisible(true)
      requestAnimationFrame(() => setSheetTrade(trade))
    })
  }

  const handleCloseOverlay = () => {
    setIsOverlayVisible(false)
    document.body.style.overflow = ""

    // Clear both trade states only after the animation finishes — keeping
    // sheetTrade non-null means we never transition to EmptyState while visible
    closeTimerRef.current = setTimeout(() => {
      setSelectedTrade(null)
      setSheetTrade(null)
      closeTimerRef.current = null
    }, 300)
  }

  return (
    <div>
      <div className="my-8 flex flex-col gap-6 lg:flex-row">
        {/* Trading Timeline — full width on mobile, 55% on desktop */}
        <div className="w-full lg:w-[55%]">
          <TradingTimeline
            selectedTrade={selectedTrade}
            onSelectTrade={handleSelectTrade}
          />
        </div>

        {/* ── Desktop: side-by-side panel (unchanged) ── */}
        <div className="hidden w-full lg:block lg:flex-1">
          <SpeculationAgent selectedTrade={selectedTrade} holdings={holdings} />
        </div>
      </div>

      {/* ── Mobile: slide-up overlay ── */}
      {/* Scrim / backdrop — always mounted, visibility driven by pointer-events */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
        style={{
          opacity: isOverlayVisible ? 1 : 0,
          pointerEvents: isOverlayVisible ? "auto" : "none",
        }}
        onClick={handleCloseOverlay}
        aria-hidden="true"
      />

      {/* Slide-up sheet — always mounted, slides in/out via transform */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl border border-border bg-background/50 backdrop-blur-sm shadow-2xl transition-transform duration-300 ease-out lg:hidden"
        style={{
          transform: isOverlayVisible ? "translateY(0)" : "translateY(100%)",
          pointerEvents: isOverlayVisible ? "auto" : "none",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleCloseOverlay}
            className="absolute right-3 top-3 p-1 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            aria-label="Close analysis panel"
          >
            <X />
          </button>
        </div>

        {/* Scrollable content — only mounted when there is a trade to show,
            so EmptyState's 196 animated dots never run inside the sheet */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {sheetTrade && (
            <SpeculationAgent
              selectedTrade={sheetTrade}
              holdings={holdings}
            />
          )}
        </div>
      </div>

      <AgentSummary />
    </div>
  )
}
