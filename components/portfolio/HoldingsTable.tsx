"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, History, DollarSign } from "lucide-react"
import { StockWithHistory, Transaction } from "@/lib/types"
import TransactionsModal from "./transactions/TransactionHistory"
import AskAI from "./chat/AskAI"
import LiquidateModal from "./chat/menuChatModal"
import { Sparkles } from "lucide-react"
import { getCompanyName } from "@/lib/tickerMap" // Import the utility
import StockLogo from "@/components/StockLogo" // Add this import at top

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}`

interface HoldingsTableProps {
  onSelectStock: (stock: StockWithHistory | null) => void
}

interface ContextMenuPosition {
  x: number
  y: number
  stock: StockWithHistory
}

type SearchSourceType = "portfolio" | "news" | "internet"

export default function HoldingsTable({ onSelectStock }: HoldingsTableProps) {
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState("")
  const [showAskAI, setShowAskAI] = useState(false)
  const [askAISymbol, setAskAISymbol] = useState<string | null>(null)
  const [askAIData, setAskAIData] = useState<any>(null)
  const [searchSource, setSearchSource] = useState<SearchSourceType>("news")


  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null,
  )
  const [liquidateStock, setLiquidateStock] = useState<StockWithHistory | null>(
    null,
  )

  const [positions, setPositions] = useState<StockWithHistory[]>([])
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [positionsError, setPositionsError] = useState("")

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    const handleScroll = () => setContextMenu(null)

    if (contextMenu) {
      document.addEventListener("click", handleClick)
      document.addEventListener("scroll", handleScroll, true)
      return () => {
        document.removeEventListener("click", handleClick)
        document.removeEventListener("scroll", handleScroll, true)
      }
    }
  }, [contextMenu])

  // Fetch positions for holdings
  const fetchPositions = async () => {
    try {
      setPositionsLoading(true)
      setPositionsError("")

      const res = await fetch(`${BASE_URL}/trading/positions`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Failed to fetch positions")
      }

      const data: any[] = await res.json()

      const mapped: StockWithHistory[] = data.map((p) => {
        const qty = Number(p.qty ?? "0")
        const currentPrice = Number(p.current_price ?? 0)
        const avgPrice = Number(p.avg_entry_price ?? 0)
        const changePercent = Number(
          p.unrealized_intraday_plpc ??
            p.change_today ??
            p.unrealized_plpc ??
            0,
        )
        const change = Number(p.unrealized_intraday_pl ?? p.unrealized_pl ?? 0)
        const totalPL = Number(p.unrealized_pl ?? 0)

        return {
          symbol: p.symbol,
          name: getCompanyName(p.symbol),
          shares: qty,
          avgPrice,
          currentPrice,
          change,
          changePercent: changePercent * 100,
          totalPL,
          purchaseHistory: [],
        }
      })

      setPositions(mapped)
    } catch (err) {
      setPositionsError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setPositionsLoading(false)
    }
  }

  useEffect(() => {
    fetchPositions()
  }, [])

  const longPositions = positions.filter((p) => p.shares >= 0)
  const shortPositions = positions.filter((p) => p.shares < 0)

  useEffect(() => {
    if (!showTransactionsModal) return

    const fetchTransactions = async () => {
      try {
        setTxLoading(true)
        setTxError("")

        const res = await fetch(`${BASE_URL}/trading/orders/all`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || "Failed to fetch orders")
        }

        const orders: any[] = await res.json()

        type TxRow = {
          id: string
          symbol: string
          name: string
          type: "buy" | "sell"
          datetime: string
          price: number
          shares: number
          filledQty: number
          totalValue: number
          reason: string
        }

        const allTx: TxRow[] = []

        for (const o of orders) {
          const baseDatetime = o.filled_at || o.submitted_at || o.created_at

          if (o.status === "filled" && Number(o.filled_qty) !== 0) {
            const price = Number(o.filled_avg_price ?? 0)
            const qty = Number(o.qty ?? 0)
            const filledQty = Number(o.filled_qty ?? 0)
            const side = o.side as "buy" | "sell"

            allTx.push({
              id: o.id,
              symbol: o.symbol,
              name: getCompanyName(o.symbol),
              type: side,
              datetime: baseDatetime,
              price,
              shares: qty,
              filledQty,
              totalValue: price * filledQty,
              reason: `${o.order_type} ${o.order_class} (${o.status})`,
            })
          }

          if (Array.isArray(o.legs)) {
            for (const leg of o.legs) {
              if (
                leg &&
                leg.status === "filled" &&
                Number(leg.filled_qty) !== 0
              ) {
                const legDatetime =
                  leg.filled_at || leg.submitted_at || leg.created_at
                const price = Number(leg.filled_avg_price ?? 0)
                const qty = Number(leg.qty ?? 0)
                const filledQty = Number(leg.filled_qty ?? 0)
                const side = leg.side as "buy" | "sell"

                allTx.push({
                  id: leg.id,
                  symbol: leg.symbol,
                  name: getCompanyName(leg.symbol),
                  type: side,
                  datetime: legDatetime,
                  price,
                  shares: qty,
                  filledQty,
                  totalValue: price * filledQty,
                  reason: `${leg.order_type} ${leg.order_class} (${leg.status})`,
                })
              }
            }
          }
        }

        setTransactions(allTx)
      } catch (err) {
        setTxError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setTxLoading(false)
      }
    }

    fetchTransactions()
  }, [showTransactionsModal])

  const handleRowClick = async (position: StockWithHistory) => {
    try {
      const res = await fetch(`${BASE_URL}/trading/orders/all`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Failed to fetch orders")
      }

      const orders: any[] = await res.json()

      const normalizeSymbol = (s: string) => s.replace(/[^a-zA-Z]/g, "")

      const symbolOrders = orders.filter(
        (o) => normalizeSymbol(o.symbol) === position.symbol,
      )

      type FillRow = {
        date: string
        datetime?: string
        shares: number
        pricePerShare: number
        side: "buy" | "sell"
        sourceOrderId: string
      }

      const fills: FillRow[] = []

      for (const o of symbolOrders) {
        if (o.status === "filled" && Number(o.filled_qty) !== 0) {
          fills.push({
            date: o.filled_at || o.submitted_at || o.created_at,
            datetime: o.filled_at || o.submitted_at || o.created_at,
            shares: Number(o.filled_qty),
            pricePerShare: Number(o.filled_avg_price ?? 0),
            side: o.side as "buy" | "sell",
            sourceOrderId: o.id,
          })
        }

        if (Array.isArray(o.legs)) {
          for (const leg of o.legs) {
            if (
              leg &&
              leg.status === "filled" &&
              Number(leg.filled_qty) !== 0 &&
              normalizeSymbol(leg.symbol) === position.symbol
            ) {
              fills.push({
                date: leg.filled_at || leg.submitted_at || leg.created_at,
                datetime: leg.filled_at || leg.submitted_at || leg.created_at,
                shares: Number(leg.filled_qty),
                pricePerShare: Number(leg.filled_avg_price ?? 0),
                side: leg.side as "buy" | "sell",
                sourceOrderId: leg.id,
              })
            }
          }
        }
      }

      const purchaseHistory =
        fills.map((f) => ({
          date: f.date,
          datetime: f.datetime,
          shares: f.side === "sell" ? -f.shares : f.shares,
          pricePerShare: f.pricePerShare,
        })) ?? []

      const totalShares = purchaseHistory.reduce((sum, p) => sum + p.shares, 0)
      const totalCost = purchaseHistory.reduce(
        (sum, p) => sum + p.shares * p.pricePerShare,
        0,
      )
      const avgPrice =
        totalShares !== 0 ? totalCost / totalShares : position.avgPrice

      const stockWithHistory: StockWithHistory = {
        ...position,
        shares: totalShares || position.shares,
        avgPrice,
        purchaseHistory,
      }

      onSelectStock(stockWithHistory)
    } catch (err) {
      console.error("Failed to load stock history", err)
      onSelectStock(position)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, stock: StockWithHistory) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      stock,
    })
  }

  const handleLiquidateClick = (stock: StockWithHistory) => {
    setContextMenu(null)
    setLiquidateStock(stock)
  }

  const handleLiquidateSuccess = () => {
    // Refresh positions after successful order
    fetchPositions()
  }

  const handleAskAIAboutStock = (stock: StockWithHistory) => {
    setContextMenu(null)

    // Prepare stock data to pass to AskAI
    const stockData = {
      symbol: stock.symbol,
      name: getCompanyName(stock.symbol),
      shares: stock.shares,
      avgPrice: stock.avgPrice,
      currentPrice: stock.currentPrice,
      totalPL: stock.totalPL,
      changePercent: stock.changePercent,
      purchaseHistory: stock.purchaseHistory,
    }

    setAskAIData(stockData)
    setShowAskAI(true)
  }

  const handleAskAIFromTransactions = (transactionData: any) => {
    setAskAIData(transactionData)
    setShowAskAI(true)
    // Don't close the transaction modal
  }

  const renderTableBody = (rows: StockWithHistory[], isShort: boolean) => (
    <tbody>
      {rows.map((stock) => {
        const signedShares = stock.shares
        const sharesAbs = Math.abs(signedShares)
        const value = sharesAbs * stock.currentPrice
        const cost = sharesAbs * stock.avgPrice
        const gain =
          (stock.currentPrice - stock.avgPrice) *
          (isShort ? -sharesAbs : sharesAbs)
        const gainPercent = cost === 0 ? 0 : (gain / cost) * 100

        return (
          <tr
            key={stock.symbol}
            onClick={() => handleRowClick(stock)}
            onContextMenu={(e) => handleContextMenu(e, stock)}
            className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/30"
          >
            <td className="px-6 py-4">
              <StockLogo symbol={stock.symbol} name={stock.name} size="md" />
            </td>{" "}
            <td className="px-6 py-4">
              <div>
                <p className="font-medium text-foreground">{stock.symbol}</p>
                <p className="text-sm text-muted-foreground">{stock.name}</p>
              </div>
            </td>
            <td className="hidden px-6 py-4 text-foreground sm:table-cell">
              {sharesAbs}
            </td>
            <td className="px-6 py-4 text-right text-foreground">
              $
              {stock.avgPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </td>
            <td className="px-6 py-4 text-right text-foreground">
              $
              {stock.currentPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </td>
            <td className="px-6 py-4 text-right">
              <div
                className={`flex items-center justify-end gap-1 ${
                  stock.totalPL >= 0 ? "text-primary" : "text-red-500"
                }`}
              >
                {stock.totalPL >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {stock.totalPL >= 0 ? "+" : ""}${stock.totalPL.toFixed(2)}
                </span>
              </div>
            </td>
            <td className="hidden px-6 py-4 text-right text-foreground md:table-cell">
              $
              {value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </td>
            <td className="hidden px-6 py-4 text-right lg:table-cell">
              <div className={gain >= 0 ? "text-primary" : "text-red-500"}>
                <p>
                  {gain >= 0 ? "+" : ""}$
                  {gain.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p
                  className={`text-sm ${gain >= 0 ? "text-teal-300" : "text-red-300"}`}
                >
                  {gain >= 0 ? "+" : ""}
                  {gainPercent.toFixed(2)}%
                </p>
              </div>
            </td>
          </tr>
        )
      })}
    </tbody>
  )

  return (
    <>
      {/* Long holdings header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Holdings</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setShowTransactionsModal(true)}
          >
            <History className="mr-2 h-4 w-4" />
            Transactions
          </Button>
          <Button
            className="relative rounded-full border border-white/30 bg-gradient-to-r from-teal-900/20 to-cyan-200/20 px-5 py-3 font-semibold text-white shadow-[0_8px_32px_0_rgba(20,184,166,0.4)] backdrop-blur-lg transition-all duration-300 before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-teal-500/0 before:via-white/20 before:to-teal-500/0 before:opacity-0 before:transition-opacity before:duration-500 hover:from-teal-500/30 hover:to-cyan-900/10 hover:shadow-[0_8px_32px_0_rgba(20,184,166,0.6)] hover:before:opacity-100"
            // className="bg-teal-600 text-white hover:bg-teal-600 rounded-full shadow-lg hover:shadow-teal-500/30 transition-all"
            onClick={() => {
              setAskAISymbol(null)
              setShowAskAI(true)
            }}
          >
            <Sparkles className="h-4 w-4" />
            Ask AI
          </Button>
        </div>
      </div>
      {/* Long positions table */}
      <Card className="mb-8 overflow-hidden border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Symbol
                </th>{" "}
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Stock
                </th>
                <th className="hidden px-6 py-4 text-left text-sm font-medium text-muted-foreground sm:table-cell">
                  Qty
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  Avg. Bought Price
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  Current Price
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  Total P/L
                </th>
                <th className="hidden px-6 py-4 text-right text-sm font-medium text-muted-foreground md:table-cell">
                  Current Value
                </th>
                <th className="hidden px-6 py-4 text-right text-sm font-medium text-muted-foreground lg:table-cell">
                  Total Gain/Loss
                </th>
              </tr>
            </thead>
            {renderTableBody(longPositions, false)}
          </table>
        </div>
      </Card>
      {/* Short positions table */}
      {shortPositions.length > 0 && (
        <>
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Short Positions
          </h2>
          <Card className="overflow-hidden border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Symbol
                    </th>
                    <th className="hidden px-6 py-4 text-left text-sm font-medium text-muted-foreground sm:table-cell">
                      Stock
                    </th>
                    <th className="hidden px-6 py-4 text-left text-sm font-medium text-muted-foreground sm:table-cell">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                      Avg. Sold Price
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                      Current Price
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                      Total P/L
                    </th>
                    <th className="hidden px-6 py-4 text-right text-sm font-medium text-muted-foreground md:table-cell">
                      Current Value
                    </th>
                    <th className="hidden px-6 py-4 text-right text-sm font-medium text-muted-foreground lg:table-cell">
                      Total Gain/Loss
                    </th>
                  </tr>
                </thead>
                {renderTableBody(shortPositions, true)}
              </table>
            </div>
          </Card>
        </>
      )}
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[200px] rounded-lg border border-border bg-black/85 py-1 shadow-xl"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y - 100}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleLiquidateClick(contextMenu.stock)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-400"
          >
            <DollarSign className="h-4 w-4" />
            Manage Position
          </button>
          <div className="my-1 border-t border-border" />
          <button
            onClick={() => handleAskAIAboutStock(contextMenu.stock)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-teal-500/10 hover:text-teal-400"
          >
            <Sparkles className="h-4 w-4" />
            Ask AI about {contextMenu.stock.symbol}
          </button>
        </div>
      )}
      {/* Liquidate Modal */}
      {liquidateStock && (
        <LiquidateModal
          open={!!liquidateStock}
          onOpenChange={(open) => !open && setLiquidateStock(null)}
          symbol={liquidateStock.symbol}
          currentPrice={liquidateStock.currentPrice}
          currentShares={liquidateStock.shares}
          onSuccess={handleLiquidateSuccess}
        />
      )}
      {/* Transactions Modal */}
      <TransactionsModal
        open={showTransactionsModal}
        onOpenChange={setShowTransactionsModal}
        transactions={transactions}
        loading={txLoading}
        error={txError}
        onRefresh={fetchPositions}
        onAskAI={handleAskAIFromTransactions}
      />
      {/* Ask AI bottom sheet */}
      <AskAI
        open={showAskAI}
        onOpenChange={(open) => {
          setShowAskAI(open)
          if (!open) setAskAIData(null) // Clear data when closing
        }}
        contextData={askAIData}
        searchSourceType={searchSource} 
        onSearchSourceTypeChange={setSearchSource} 
      />{" "}
    </>
  )
}
