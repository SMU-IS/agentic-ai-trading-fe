'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowUpDown, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Sparkles } from 'lucide-react'
import LiquidateModal from '../chat/menuChatModal'

interface Transaction {
  id: string
  symbol: string
  name: string
  type: 'buy' | 'sell'
  datetime: string
  price: number
  shares: number
  filledQty: number
  totalValue: number
  reason: string
}

interface TransactionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactions: Transaction[]
  loading?: boolean
  error?: string
  onRefresh?: () => void
  onAskAI?: (transactionData: any) => void
}

interface ContextMenuPosition {
  x: number
  y: number
  transaction: Transaction
}

interface LiquidateData {
  symbol: string
  currentPrice: number
  currentShares: number
}

export default function TransactionsModal({
  open,
  onOpenChange,
  error,
  loading,
  transactions,
  onRefresh,
  onAskAI,
}: TransactionsModalProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null,
  )
  const [liquidateData, setLiquidateData] = useState<LiquidateData | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!contextMenu) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [contextMenu])

  const handleContextMenu = (e: React.MouseEvent, transaction: Transaction) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      transaction,
    })
  }

  const handleLiquidateClick = (
    e: React.MouseEvent,
    transaction: Transaction,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu(null)

    setLiquidateData({
      symbol: transaction.symbol,
      currentPrice: transaction.price,
      currentShares:
        transaction.type === 'buy'
          ? transaction.filledQty
          : -transaction.filledQty,
    })
  }

  const handleAskAI = (e: React.MouseEvent, transaction: Transaction) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu(null)

    if (onAskAI) {
      const transactionData = {
        symbol: transaction.symbol,
        name: transaction.name,
        type: transaction.type,
        datetime: transaction.datetime,
        price: transaction.price,
        shares: transaction.shares,
        filledQty: transaction.filledQty,
        totalValue: transaction.totalValue,
        reason: transaction.reason,
      }

      onAskAI(transactionData)
    }
  }

  const handleLiquidateSuccess = () => {
    setLiquidateData(null)
    if (onRefresh) {
      onRefresh()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] max-w-5xl flex-col overflow-hidden border-border bg-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
              <ArrowUpDown className="h-5 w-5" />
              Transaction History
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="px-4 pb-2 text-sm text-red-500">{error}</div>
          )}

          <div className="flex-1 overflow-auto">
            {loading ? (
              <TransactionsSkeleton />
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Filled Qty
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Total Value
                    </th>
                    <th className="min-w-[250px] px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Order Type (Status)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      onContextMenu={(e) => handleContextMenu(e, transaction)}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {transaction.symbol}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            transaction.type === 'buy'
                              ? 'bg-primary/20 text-primary'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {transaction.type === 'buy' ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {transaction.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-foreground">
                            {new Date(transaction.datetime).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              },
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.datetime).toLocaleTimeString(
                              'en-US',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        $
                        {transaction.price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {transaction.shares}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {transaction.filledQty}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            transaction.filledQty != 0
                              ? transaction.type === 'buy' &&
                                transaction.price >= 0
                                ? 'text-teal-400'
                                : 'text-red-400'
                              : 'text-gray-300'
                          }
                        >
                          {transaction.type === 'buy' ? '-' : '+'}$
                          {transaction.totalValue.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm leading-snug text-muted-foreground">
                          <span
                            className={
                              transaction.price != 0
                                ? 'text-white'
                                : transaction.type === 'buy' &&
                                    transaction.price != 0
                                  ? 'text-white'
                                  : 'text-gray-400'
                            }
                          >
                            {transaction.reason}
                          </span>
                        </p>
                      </td>
                    </tr>
                  ))}

                  {transactions.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <p className="text-muted-foreground">
                          No transactions yet
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Summary footer */}
          {!loading && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-muted-foreground">Total Bought:</span>
                  <span className="ml-2 font-medium text-primary">
                    $
                    {transactions
                      .filter((t) => t.type === 'buy')
                      .reduce((sum, t) => sum + t.totalValue, 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Sold:</span>
                  <span className="ml-2 font-medium text-red-500">
                    $
                    {transactions
                      .filter((t) => t.type === 'sell')
                      .reduce((sum, t) => sum + t.totalValue, 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="text-muted-foreground">
                {transactions.length} transactions
              </div>
            </div>
          )}

          {/* Summary footer skeleton */}
          {loading && (
            <div className="mt-4 flex animate-pulse items-center justify-between border-t border-border pt-4 text-sm">
              <div className="flex items-center gap-6">
                <div className="h-5 w-40 rounded bg-gray-700" />
                <div className="h-5 w-40 rounded bg-gray-700" />
              </div>
              <div className="h-5 w-32 rounded bg-gray-700" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Context Menu - Rendered via Portal */}
      {mounted &&
        contextMenu &&
        createPortal(
          <>
            <div
              className="fixed inset-0"
              style={{ zIndex: 99998 }}
              onClick={() => setContextMenu(null)}
            />
            <div
              className="context-menu-container fixed min-w-[200px] rounded-lg border border-border bg-card py-1 shadow-xl"
              style={{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y - 100}px`,
                zIndex: 99999,
                pointerEvents: 'auto',
              }}
            >
              <button
                onClick={(e) =>
                  handleLiquidateClick(e, contextMenu.transaction)
                }
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                style={{ pointerEvents: 'auto' }}
              >
                <DollarSign className="h-4 w-4" />
                Place Order for {contextMenu.transaction.symbol}
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={(e) => handleAskAI(e, contextMenu.transaction)}
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-teal-500/10 hover:text-teal-400"
                style={{ pointerEvents: 'auto' }}
              >
                <Sparkles className="h-4 w-4" />
                Ask AI about {contextMenu.transaction.symbol}
              </button>
            </div>
          </>,
          document.body,
        )}

      {/* Liquidate Modal */}
      {mounted &&
        liquidateData &&
        createPortal(
          <LiquidateModal
            open={!!liquidateData}
            onOpenChange={(open) => !open && setLiquidateData(null)}
            symbol={liquidateData.symbol}
            currentPrice={liquidateData.currentPrice}
            currentShares={liquidateData.currentShares}
            onSuccess={handleLiquidateSuccess}
          />,
          document.body,
        )}
    </>
  )
}

// Transactions Table Skeleton Component
function TransactionsSkeleton() {
  return (
    <table className="w-full">
      <thead className="sticky top-0 bg-card">
        <tr className="border-b border-border">
          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
            Stock
          </th>
          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
            Type
          </th>
          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
            Date & Time
          </th>
          <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
            Price
          </th>
          <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
            Qty
          </th>
          <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
            Filled Qty
          </th>
          <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
            Total Value
          </th>
          <th className="min-w-[250px] px-4 py-3 text-left text-sm font-medium text-muted-foreground">
            Order Type (Status)
          </th>
        </tr>
      </thead>
      <tbody>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <tr
            key={i}
            className="animate-pulse border-b border-border last:border-0"
          >
            {/* Stock */}
            <td className="px-4 py-3">
              <div className="space-y-2">
                <div className="h-4 w-16 rounded bg-gray-700" />
                <div className="h-3 w-24 rounded bg-gray-700" />
              </div>
            </td>

            {/* Type */}
            <td className="px-4 py-3">
              <div className="h-6 w-16 rounded-full bg-gray-700" />
            </td>

            {/* Date & Time */}
            <td className="px-4 py-3">
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-gray-700" />
                <div className="h-3 w-16 rounded bg-gray-700" />
              </div>
            </td>

            {/* Price */}
            <td className="px-4 py-3">
              <div className="ml-auto h-4 w-20 rounded bg-gray-700" />
            </td>

            {/* Qty */}
            <td className="px-4 py-3">
              <div className="ml-auto h-4 w-12 rounded bg-gray-700" />
            </td>

            {/* Filled Qty */}
            <td className="px-4 py-3">
              <div className="ml-auto h-4 w-12 rounded bg-gray-700" />
            </td>

            {/* Total Value */}
            <td className="px-4 py-3">
              <div className="ml-auto h-4 w-24 rounded bg-gray-700" />
            </td>

            {/* Reason */}
            <td className="px-4 py-3">
              <div className="space-y-2">
                <div className="h-3 w-48 rounded bg-gray-700" />
                <div className="h-3 w-40 rounded bg-gray-700" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
