"use client"

import { TradeEvent } from "@/lib/types"
import { motion } from "framer-motion"
import Cookies from "js-cookie"
import { Activity, Target, TrendingDown, TrendingUp } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const getToken = () => Cookies.get("jwt") ?? ""

interface TpSlSectionProps {
  selectedTrade: TradeEvent
}

export default function TpSlSection({ selectedTrade }: TpSlSectionProps) {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [loadingPrice, setLoadingPrice] = useState(false)

  const [isMobile, setIsMobile] = useState(false)
  const [mobileFlipped, setMobileFlipped] = useState(false)

  const isMounted = useRef(true)
  const lastFetchedSymbol = useRef<string | null>(null)

  const tpLeg = selectedTrade.legs?.find(
    (leg: any) => leg.order_type === "limit" || leg.type === "limit",
  )
  const slLeg = selectedTrade.legs?.find(
    (leg: any) => leg.order_type === "stop" || leg.type === "stop",
  )
  const tpIsFilled = tpLeg?.status === "filled"
  const slIsFilled = slLeg?.status === "filled"
  const anyLegFilled = tpIsFilled || slIsFilled

  useEffect(() => {
    isMounted.current = true
    const mq = window.matchMedia("(max-width: 767px)")
    setIsMobile(mq.matches)

    const handler = (e: MediaQueryListEvent) => {
      if (isMounted.current) setIsMobile(e.matches)
    }

    if (mq.addEventListener) {
      mq.addEventListener("change", handler)
      return () => {
        isMounted.current = false
        mq.removeEventListener("change", handler)
      }
    } else {
      mq.addListener(handler)
      return () => {
        isMounted.current = false
        mq.removeListener(handler)
      }
    }
  }, [])

  useEffect(() => {
    if (!isMobile) return
    const id = setInterval(() => {
      if (isMounted.current) setMobileFlipped((prev) => !prev)
    }, 3000)
    return () => clearInterval(id)
  }, [isMobile])

  useEffect(() => {
    if (anyLegFilled || !selectedTrade.symbol) {
      setCurrentPrice(null)
      return
    }

    // Prevent redundant fetches if we already have the price for this symbol
    if (
      lastFetchedSymbol.current === selectedTrade.symbol &&
      currentPrice !== null
    ) {
      return
    }

    const controller = new AbortController()

    const fetchPrice = async () => {
      if (!isMounted.current) return

      setLoadingPrice(true)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL

      try {
        const res = await fetch(
          `${baseUrl}/trading/yahoo/latest/${selectedTrade.symbol}`,
          {
            signal: controller.signal,
            credentials: "include",
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          },
        )

        if (!res.ok) throw new Error("Fetch failed")

        const data = await res.json()
        if (isMounted.current) {
          setCurrentPrice(data.price?.current_price ?? null)
          lastFetchedSymbol.current = selectedTrade.symbol
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Aborted fetch is expected on unmount/symbol change
        } else {
          console.error("Price fetch error:", err)
        }
      } finally {
        if (isMounted.current) {
          setLoadingPrice(false)
        }
      }
    }

    const timer = setTimeout(() => fetchPrice(), 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [selectedTrade.symbol, anyLegFilled])

  const getLegPL = (leg: any) => {
    const legQty = parseFloat(leg.filled_qty || leg.quantity || "0")
    const legPrice = parseFloat(
      leg.filled_avg_price || leg.limit_price || leg.stop_price || "0",
    )
    return selectedTrade.trade_type === "sell"
      ? (selectedTrade.price - legPrice) * legQty
      : (legPrice - selectedTrade.price) * legQty
  }

  const filledLegs = selectedTrade.legs.filter(
    (leg: any) => leg.status === "filled",
  )
  const totalLegPL = filledLegs.reduce(
    (sum: number, leg: any) => sum + getLegPL(leg),
    0,
  )

  const renderLeg = (leg: any, isTakeProfit: boolean) => {
    if (!leg) return null

    const legQty = parseFloat(leg.filled_qty || leg.quantity || "0")
    const legPrice = parseFloat(
      leg.filled_avg_price || leg.limit_price || leg.stop_price || "0",
    )
    const isFilled = leg.status === "filled"
    const legPL = isFilled
      ? selectedTrade.trade_type === "sell"
        ? (selectedTrade.price - legPrice) * legQty
        : (legPrice - selectedTrade.price) * legQty
      : 0
    const shares = selectedTrade.quantity
    const perShare = isTakeProfit
      ? parseFloat(selectedTrade.risk_evaluation?.reward_per_share || "0")
      : parseFloat(selectedTrade.risk_evaluation?.risk_per_share || "0")
    const potentialAmount = perShare * shares

    const statusColor = isFilled
      ? "bg-green-500/10 text-green-500"
      : leg.status === "cancelled"
        ? "bg-red-500/10 text-red-500"
        : leg.status === "expired"
          ? "bg-orange-500/10 text-orange-500"
          : "bg-blue-500/10 text-blue-500"

    return (
      <div className="flex flex-col gap-1 rounded-lg p-3 border bg-background border-border h-full">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground font-medium">
            {isTakeProfit ? "Take Profit" : "Stop Loss"}
          </div>
          <div
            className={`rounded px-2 py-0.5 text-xs font-medium ${statusColor}`}
          >
            {leg.status}
          </div>
        </div>

        <div className="text-sm font-bold">
          {isTakeProfit
            ? `Limit: $${legPrice.toFixed(2)}`
            : `Stop: $${legPrice.toFixed(2)}`}
        </div>

        {!anyLegFilled &&
          selectedTrade.risk_evaluation &&
          potentialAmount > 0 && (
            <div
              className={`mt-1 flex items-center gap-1 rounded-md px-2 py-1 w-fit text-xs font-semibold border ${
                isTakeProfit
                  ? "bg-green-500/5 border-green-500/20 text-green-500"
                  : "bg-red-500/5 border-red-500/20 text-red-500"
              }`}
            >
              {isTakeProfit ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{isTakeProfit ? "Max Profit" : "Max Loss"}</span>
              <span className="font-bold">
                {isTakeProfit ? "+" : "-"}${potentialAmount.toFixed(2)}
              </span>
            </div>
          )}

        {isFilled && (
          <div className="flex items-center justify-between mt-1">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isTakeProfit
                  ? "bg-green-500/20 text-green-500"
                  : "bg-red-500/20 text-red-500"
              }`}
            >
              {isTakeProfit ? "+" : ""}${legPL.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              {legQty} shares
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-muted p-4">
      <div className="mb-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-bold">Take Profit / Stop Loss</span>
        </div>

        {!anyLegFilled && selectedTrade.status === "filled" && (
          <>
            {loadingPrice ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1">
                <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-3.5 rounded bg-muted animate-pulse" />
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                <div className="h-3 w-12 rounded bg-muted animate-pulse" />
              </div>
            ) : currentPrice !== null ? (
              (() => {
                const side = selectedTrade.trade_type
                const unrealizedPnl =
                  side === "sell"
                    ? (selectedTrade.price - currentPrice) *
                      selectedTrade.quantity
                    : (currentPrice - selectedTrade.price) *
                      selectedTrade.quantity
                const isPositive = unrealizedPnl >= 0
                const isWinning =
                  side === "sell"
                    ? currentPrice < selectedTrade.price
                    : currentPrice > selectedTrade.price

                const animateState = isMobile
                  ? mobileFlipped
                    ? "hovered"
                    : "rest"
                  : undefined

                return (
                  <motion.div
                    initial="rest"
                    animate={isMobile ? animateState : "rest"}
                    whileHover={isMobile ? undefined : "hovered"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 cursor-default"
                  >
                    <span className="relative flex h-2 w-2 flex-shrink-0">
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full ${isWinning ? "bg-green-400" : "bg-red-400"} opacity-75`}
                      />
                      <span
                        className={`relative inline-flex h-2 w-2 rounded-full ${isWinning ? "bg-green-500" : "bg-red-500"}`}
                      />
                    </span>

                    <Activity className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />

                    <div className="relative h-4 overflow-hidden flex items-center">
                      <motion.span
                        className="text-xs text-muted-foreground absolute whitespace-nowrap"
                        variants={{
                          hovered: { opacity: 0, y: -8 },
                          rest: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        Unrealized P&L:
                      </motion.span>
                      <motion.span
                        className="text-xs text-muted-foreground absolute whitespace-nowrap"
                        variants={{
                          hovered: { opacity: 1, y: 0 },
                          rest: { opacity: 0, y: 8 },
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        Current Price:
                      </motion.span>
                      <span className="text-xs opacity-0 pointer-events-none whitespace-nowrap">
                        Unrealized P&L:
                      </span>
                    </div>

                    <div className="relative h-4 overflow-hidden flex items-center">
                      <div
                        className="relative grid items-center"
                        style={{ gridTemplateAreas: '"stack"' }}
                      >
                        <motion.span
                          className={`text-xs font-bold whitespace-nowrap ${isPositive ? "text-green-500" : "text-red-500"}`}
                          style={{ gridArea: "stack" }}
                          variants={{
                            hovered: { opacity: 0, y: -8 },
                            rest: { opacity: 1, y: 0 },
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          {isPositive ? "+" : ""}${unrealizedPnl.toFixed(2)}
                        </motion.span>
                        <motion.span
                          className="text-xs font-bold whitespace-nowrap text-foreground"
                          style={{ gridArea: "stack" }}
                          variants={{
                            hovered: { opacity: 1, y: 0 },
                            rest: { opacity: 0, y: 8 },
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          ${currentPrice.toFixed(2)}
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                )
              })()
            ) : null}
          </>
        )}
      </div>

      {filledLegs.length > 0 &&
        (() => {
          const tpFilled = filledLegs.some(
            (leg: any) => leg.order_type === "limit" || leg.type === "limit",
          )
          const slFilled = filledLegs.some(
            (leg: any) => leg.order_type === "stop" || leg.type === "stop",
          )
          const isProfit = tpFilled && !slFilled

          return (
            <div className="mb-2 p-3 rounded-lg bg-muted/40 border flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Realized P/L (order leg filled)
                </div>
                <div className="text-xl font-bold">
                  <span
                    className={isProfit ? "text-green-500" : "text-red-500"}
                  >
                    {isProfit ? "+" : ""}${totalLegPL.toFixed(2)}
                  </span>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isProfit
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                }`}
              >
                {isProfit ? "PROFIT" : "LOSS"}
              </div>
            </div>
          )
        })()}

      <div className="grid grid-cols-2 gap-2 items-stretch">
        <div>{renderLeg(slLeg, false)}</div>
        <div>{renderLeg(tpLeg, true)}</div>
      </div>
    </div>
  )
}
