'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StockWithHistory } from '@/lib/types';

interface StockHistoryModalProps {
  stock: StockWithHistory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StockHistoryModal({
  stock,
  open,
  onOpenChange,
}: StockHistoryModalProps) {
  if (!stock) return null;

  const currentVal = stock.shares * stock.currentPrice;
  const costVal = stock.shares * stock.avgPrice;
  const gainVal = currentVal - costVal;
  const gainPct = costVal === 0 ? 0 : (gainVal / costVal) * 100;

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
        ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-3">
            <span className="text-2xl font-semibold">{stock.symbol}</span>
            <span className="text-muted-foreground font-normal text-base">
              {stock.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <h3 className="text-foreground font-medium mb-3">Purchase History</h3>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-muted-foreground text-sm font-medium px-4 py-3">
                    Date
                  </th>
                  <th className="text-right text-muted-foreground text-sm font-medium px-4 py-3">
                    Shares
                  </th>
                  <th className="text-right text-muted-foreground text-sm font-medium px-4 py-3">
                    Bought Price
                  </th>
                  <th className="text-right text-muted-foreground text-sm font-medium px-4 py-3">
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
                      {new Date(purchase.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      <p className="text-muted-foreground text-xs">
                        {new Date(purchase.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
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
                      ).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30">
                  <td className="px-4 py-3 text-foreground font-medium">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-foreground font-medium">
                    {stock.shares}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-sm">
                    Avg ${stock.avgPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground font-medium">
                    $
                    {(stock.shares * stock.avgPrice).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Value</span>
              <span className="text-foreground font-semibold">
                $
                {currentVal.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-muted-foreground">Total Gain/Loss</span>
              <span
                className={`font-semibold ${
                  gainVal >= 0 ? 'text-primary' : 'text-red-500'
                }`}
              >
                {gainVal >= 0 ? '+' : ''}$
                {gainVal.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}{' '}
                ({gainVal >= 0 ? '+' : ''}
                {gainPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
