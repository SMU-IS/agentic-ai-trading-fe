"use client"

import Cookies from "js-cookie"
import StockLogo from "@/components/StockLogo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getCompanyName } from "@/lib/tickerMap"
import { StockWithHistory, Transaction } from "@/lib/types"
import {
  DollarSign,
  History,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { useEffect, useState } from "react"
import AskAI from "./chat/AskAI"
import LiquidateModal from "./chat/menuChatModal"
import TransactionsModal from "./transactions/TransactionHistory"

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}`

const getToken = () => Cookies.get("jwt") ?? ""

interface HoldingsTableProps {
  onSelectStock: (stock: StockWithHistory | null) => void
}

interface ContextMenuPosition {
  x: number
  y: number
  stock: StockWithHistory
}

export default function HoldingsTable({ onSelectStock }: HoldingsTableProps) {
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState("")
  const [showAskAI, setShowAskAI] = useState(false)
  const [askAISymbol, setAskAISymbol] = useState<string | null>(null)
  const [askAIData, setAskAIData] = useState<any>(null)

  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null,
  )
  const [liquidateStock, setLiquidateStock] = useState<StockWithHistory | null>(
    null,
  )

  const [positions, setPositions] = useState<StockWithHistory[]>([])
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [positionsError, setPositionsError] = useState("")

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

  const fetchPositions = async () => {
    const token = getToken()
    try {
      setPositionsLoading(true)
      setPositionsError("")

      const res = await fetch(`${BASE_URL}/trading/positions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
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
      const token = getToken()
      try {
        setTxLoading(true)
        setTxError("")

        const res = await fetch(`${BASE_URL}/trading/orders/all`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
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
    const token = getToken()
    try {
      const res = await fetch(`${BASE_URL}/trading/orders/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
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
    setContextMenu({ x: e.clientX, y: e.clientY, stock })
  }

  const handleLiquidateClick = (stock: StockWithHistory) => {
    setContextMenu(null)
    setLiquidateStock(stock)
  }

  const handleLiquidateSuccess = () => {
    fetchPositions()
  }

  const handleAskAIAboutStock = (stock: StockWithHistory) => {
    setContextMenu(null)

    const stockData = {
      dataType: "holding",
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
            <td className="w-1/12 px-6 py-4">
              <StockLogo symbol={stock.symbol} name={stock.name} size="md" />
            </td>
            <td className="w-1/6 px-6 py-4">
              <div>
                <p className="font-medium text-foreground">{stock.symbol}</p>
                <p className="text-sm text-muted-foreground">{stock.name}</p>
              </div>
            </td>
            <td className=" w-1/8 px-6 py-4 text-foreground sm:table-cell">
              {sharesAbs}
            </td>
            <td className="w-1/8 px-6 py-4 text-right text-foreground">
              $
              {stock.avgPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </td>
            <td className="w-1/8 px-6 py-4 text-right text-foreground">
              $
              {stock.currentPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </td>
            <td className=" w-1/8 px-6 py-4 text-right text-foreground md:table-cell">
              ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </td>
            <td className=" w-1/8 px-6 py-4 text-right lg:table-cell">
              <div className={gain >= 0 ? "text-primary" : "text-red-500"}>
                <p>
                  {gain >= 0 ? "+" : ""}$
                  {gain.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p
                  className={`text-sm ${gain >= 0 ? "text-teal-500" : "text-red-300"}`}
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
      <div className="mb-2 flex items-end justify-between">
        <h2 className="mb-0 text-lg font-semibold text-foreground">Holdings</h2>
        <div className="flex items-center gap-2 pb-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setShowTransactionsModal(true)}
          >
            <History className="mr-2 h-4 w-4" />
            Transactions
          </Button>
        </div>
      </div>
      <Card className="mb-8 overflow- border-border bg-card overflow-auto">
        <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
          <table className="w-full">
            <thead className="sticky bg-card top-0 border-border shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr className="border-b border-border">
                <th className="w-1/8 px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Symbol
                </th>
                <th className="w-1/8 px-6 py-4 text-left text-sm font-medium text-muted-foreground sm:table-cell">
                  Stock
                </th>
                <th className="w-1/8 px-6 py-4 text-left text-sm font-medium text-muted-foreground sm:table-cell">
                  Qty
                </th>
                <th className="w-1/8 px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  Avg. Price
                </th>
                <th className="w-1/8 px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  Current Price
                </th>
                <th className="w-1/8 px-6 py-4 text-right text-sm font-medium text-muted-foreground md:table-cell">
                  Current Value
                </th>
                <th className="w-1/8 px-6 py-4 text-right text-sm font-medium text-muted-foreground lg:table-cell">
                  Total Gain/Loss
                </th>
              </tr>
            </thead>
            {renderTableBody(longPositions, false)}
          </table>
        </div>
      </Card>
      {shortPositions.length > 0 && (
        <>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Short Positions
          </h2>
          <Card className="overflow-auto border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky bg-card top-0 border-border shadow-[0_1px_0_0_hsl(var(--border))]">
                  <tr className="border-b border-border">
                    <th className="w-1/8 px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Symbol
                    </th>
                    <th className="w-1/8 px-6 py-4 text-left text-sm font-medium text-muted-foreground sm:table-cell">
                      Stock
                    </th>
                    <th className="w-1/8 px-6 py-4 text-left text-sm font-medium text-muted-foreground sm:table-cell">
                      Qty
                    </th>
                    <th className="w-1/8 px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                      Avg. Sold Price
                    </th>
                    <th className="w-1/8 px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                      Current Price
                    </th>
                    <th className="w-1/8 px-6 py-4 text-right text-sm font-medium text-muted-foreground md:table-cell">
                      Current Value
                    </th>
                    <th className="w-1/8 px-6 py-4 text-right text-sm font-medium text-muted-foreground lg:table-cell">
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
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[200px] rounded-lg border border-border bg-background/85 py-1 shadow-xl"
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
      <TransactionsModal
        open={showTransactionsModal}
        onOpenChange={setShowTransactionsModal}
        transactions={transactions}
        loading={txLoading}
        error={txError}
        onRefresh={fetchPositions}
        onAskAI={handleAskAIFromTransactions}
      />
      <AskAI
        open={showAskAI}
        onOpenChange={(open) => {
          setShowAskAI(open)
          if (!open) setAskAIData(null)
        }}
        contextData={askAIData}
      />
    </>
  )
}
