'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, TrendingUp, TrendingDown, History } from 'lucide-react';
import { StockWithHistory, Transaction } from '@/lib/types';
import TransactionsModal from './transactions/TransactionHistory';
import { id } from 'date-fns/locale';

interface HoldingsTableProps {
  stocks: StockWithHistory[];
  onSelectStock: (stock: StockWithHistory) => void;
}

const BASE_URL = 'http://localhost:8000/api/v1';

export default function HoldingsTable({
  stocks,
  onSelectStock,
}: HoldingsTableProps) {
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');

  // NEW: holdings from /trading/positions
  const [positions, setPositions] = useState<StockWithHistory[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [PositionsError, setPositionsError] = useState('');

  // Fetch positions (holdings) on mount
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setPositionsLoading(true);
        setPositionsError('');

        const res = await fetch(`${BASE_URL}/trading/positions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to fetch positions');
        }

        const data: any[] = await res.json();

        const mapped: StockWithHistory[] = data.map((p) => {
          const shares = Number(p.qty ?? '0');
          const currentPrice = Number(p.current_price ?? 0);
          const avgPrice = Number(p.avg_entry_price ?? 0);
          const changePercent = Number(
            p.change_today ?? p.unrealized_plpc ?? 0,
          );
          const change = Number(p.unrealized_pl ?? 0);

          return {
            symbol: p.symbol,
            name: p.symbol, // no name field, reuse symbol
            shares,
            avgPrice,
            currentPrice,
            change,
            changePercent: changePercent * 100, // API gives fraction (-0.02); your UI expects %
            purchaseHistory: [], // backend doesn’t provide; keep empty
          };
        });

        setPositions(mapped);
      } catch (err) {
        setPositionsError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setPositionsLoading(false);
      }
    };

    fetchPositions();
  }, []);

  // Fetch transactions
  useEffect(() => {
    if (!showTransactionsModal) return;

    const fetchTransactions = async () => {
      try {
        setTxLoading(true);
        setTxError('');

        const res = await fetch(`${BASE_URL}/trading/orders/all`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to fetch orders');
        }

        const data: any[] = await res.json();

        // Map backend orders into your Transaction type
        const mapped: Transaction[] = data.map((o) => {
          // pick a datetime to show
          const datetime = o.filled_at || o.submitted_at || o.created_at;

          // choose a price: filled_avg_price (if filled) else limit_price (if any) else 0
          // const rawPrice = o.filled_avg_price ?? o.limit_price ?? null;
          const rawPrice = o.filled_avg_price ?? null;

          const price = rawPrice ? Number(rawPrice) : 0;

          const qty = Number(o.qty ?? '0');
          const filledQty = Number(o.filled_qty);

          return {
            id: o.id,
            symbol: o.symbol,
            // BE does not have `name`, so just reuse symbol or plug in a lookup later
            name: o.symbol,
            // your side field is "side": "buy" | "sell"
            type: o.side as 'buy' | 'sell',
            datetime,
            price,
            shares: qty,
            filledQty: filledQty,
            totalValue: price * qty,
            // no explicit reason field in API; derive something simple
            reason: `${o.order_type} ${o.order_class} (${o.status})`,
          };
        });

        setTransactions(mapped);
      } catch (err) {
        setTxError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setTxLoading(false);
      }
    };

    fetchTransactions();
  }, [showTransactionsModal]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground text-xl font-semibold">Holdings</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setShowTransactionsModal(true)}
          >
            <History className="w-4 h-4 mr-2" />
            Transactions
          </Button>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-muted-foreground text-sm font-medium px-6 py-4">
                  Symbol
                </th>
                <th className="text-left text-muted-foreground text-sm font-medium px-6 py-4 hidden sm:table-cell">
                  Qty
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4">
                  Bought Price
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4">
                  % Change Today
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4 hidden md:table-cell">
                  Current Value
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4 hidden lg:table-cell">
                  Total Gain/Loss
                </th>
              </tr>
            </thead>
            <tbody>
              {positions.map((stock) => {
                const value = stock.shares * stock.currentPrice;
                const cost = stock.shares * stock.avgPrice;
                const gain = value - cost;
                const gainPercent = cost === 0 ? 0 : (gain / cost) * 100;

                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock)}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-foreground font-medium">
                          {stock.symbol}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {stock.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground hidden sm:table-cell">
                      {stock.shares}
                    </td>
                    <td className="px-6 py-4 text-right text-foreground">
                      $
                      {stock.currentPrice.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className={`flex items-center justify-end gap-1 ${
                          stock.changePercent >= 0
                            ? 'text-primary'
                            : 'text-red-500'
                        }`}
                      >
                        {stock.changePercent >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>
                          {stock.changePercent >= 0 ? '+' : ''}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-foreground hidden md:table-cell">
                      $
                      {value.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-right hidden lg:table-cell">
                      <div
                        className={gain >= 0 ? 'text-primary' : 'text-red-500'}
                      >
                        <p>
                          {gain >= 0 ? '+' : ''}$
                          {gain.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p
                          className={`text-sm ${
                            stock.gain >= 0 ? 'text-teal-300' : 'text-red-300'
                          }`}
                        >
                          {gain >= 0 ? '+' : ''}
                          {gainPercent.toFixed(2)}%
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transactions Modal */}
      <TransactionsModal
        open={showTransactionsModal}
        onOpenChange={setShowTransactionsModal}
        transactions={transactions}
        loading={txLoading}
        error={txError}
      />
    </>
  );
}
