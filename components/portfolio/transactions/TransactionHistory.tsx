'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';

interface Transaction {
  id: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  datetime: string;
  price: number;
  shares: number;
  filledQty: number;
  totalValue: number;
  reason: string;
}

interface TransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  loading?: boolean;
  error?: string;
}

export default function TransactionsModal({
  open,
  onOpenChange,
  error,
  loading,
  transactions,
}: TransactionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-border max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Transaction History
          </DialogTitle>
        </DialogHeader>
        {error && <div className="px-4 pb-2 text-sm text-red-500">{error}</div>}
        {loading && (
          <div className="px-4 pb-2 text-sm text-muted-foreground">
            Loading transactions...
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="text-left text-muted-foreground text-sm font-medium px-4 py-3">
                  Stock
                </th>
                <th className="text-left text-muted-foreground text-sm font-medium px-4 py-3">
                  Type
                </th>
                <th className="text-left text-muted-foreground text-sm font-medium px-4 py-3">
                  Date & Time
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-4 py-3">
                  Price
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-4 py-3">
                  Qty
                </th>{' '}
                <th className="text-right text-muted-foreground text-sm font-medium px-4 py-3">
                  Filled Qty
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-4 py-3">
                  Total Value
                </th>
                <th className="text-left text-muted-foreground text-sm font-medium px-4 py-3 min-w-[250px]">
                  Order Type (Status)
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-foreground font-medium">
                        {transaction.symbol}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {transaction.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'buy'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-red-500/20 text-red-500'
                      }`}
                    >
                      {transaction.type === 'buy' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {transaction.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-foreground text-sm">
                        {new Date(transaction.datetime).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          },
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
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
                  </td>{' '}
                  <td className="px-4 py-3 text-right text-foreground">
                    {transaction.filledQty}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        transaction.price != 0
                          ? 'text-teal-300'
                          : transaction.type === 'buy' && transaction.price != 0
                            ? 'text-red-600'
                            : 'text-gray-400'
                      }
                    >
                      {transaction.type === 'buy' ? '-' : '+'}$
                      {transaction.totalValue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-muted-foreground text-sm leading-snug">
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

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <p className="text-muted-foreground">No transactions yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Summary footer */}
        <div className="border-t border-border pt-4 mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-muted-foreground">Total Bought:</span>
              <span className="text-primary ml-2 font-medium">
                $
                {transactions
                  .filter((t) => t.type === 'buy')
                  .reduce((sum, t) => sum + t.totalValue, 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Sold:</span>
              <span className="text-red-500 ml-2 font-medium">
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
      </DialogContent>
    </Dialog>
  );
}
