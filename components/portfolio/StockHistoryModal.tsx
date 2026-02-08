"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StockWithHistory } from "@/lib/types"

interface StockHistoryModalProps {
  stock: StockWithHistory | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function StockHistoryModal({
  stock,
  open,
  onOpenChange,
}: StockHistoryModalProps) {
  if (!stock) return null

  const currentVal = stock.shares * stock.currentPrice
  const costVal = stock.shares * stock.avgPrice
  const gainVal = currentVal - costVal
  const gainPct = costVal === 0 ? 0 : (gainVal / costVal) * 100

  // rows always come from parent purchaseHistory; if empty, synthesize one from the position
  const rows =
    stock.purchaseHistory && stock.purchaseHistory.length > 0
      ? stock.purchaseHistory
      : [
          {
            date: new Date().toISOString(),
            datetime: new Date().toISOString(),
            shares: stock.shares,
            pricePerShare: stock.avgPrice,
          },
        ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <span className="text-2xl font-semibold">{stock.symbol}</span>
            <span className="text-base font-normal text-muted-foreground">
              {stock.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <h3 className="mb-3 font-medium text-foreground">Purchase History</h3>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Shares
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Bought Price
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((purchase, index) => (
                  <tr
                    key={index}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 text-foreground">
                      {new Date(purchase.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      <p className="text-xs text-muted-foreground">
                        {new Date(purchase.date).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {purchase.shares}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      ${purchase.pricePerShare.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      $
                      {(
                        purchase.shares * purchase.pricePerShare
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {/* {stock.shares} */}
                    {stock.shares.toLocaleString("en-US", {
                      minimumFractionDigits: 4,
                    })}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                    Avg ${stock.avgPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    $
                    {(stock.shares * stock.avgPrice).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Value</span>
              <span className="font-semibold text-foreground">
                $
                {currentVal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Total Gain/Loss</span>
              <span
                className={`font-semibold ${
                  gainVal >= 0 ? "text-primary" : "text-red-500"
                }`}
              >
                {gainVal >= 0 ? "+" : ""}$
                {gainVal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}{" "}
                ({gainVal >= 0 ? "+" : ""}
                {gainPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
