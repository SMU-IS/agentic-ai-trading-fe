'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, TrendingUp, TrendingDown, History } from 'lucide-react';
import { StockWithHistory, Transaction } from '@/lib/types';
import TransactionsModal from './transactions/TransactionHistory';

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

  // positions from /trading/positions
  const [positions, setPositions] = useState<StockWithHistory[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState('');

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
          const qty = Number(p.qty ?? '0');
          const currentPrice = Number(p.current_price ?? 0);
          const avgPrice = Number(p.avg_entry_price ?? 0);
          const changePercent = Number(
            p.unrealized_intraday_plpc ??
              p.change_today ??
              p.unrealized_plpc ??
              0,
          );
          const change = Number(
            p.unrealized_intraday_pl ?? p.unrealized_pl ?? 0,
          );
          const totalPL = Number(p.unrealized_pl ?? 0);

          return {
            symbol: p.symbol,
            name: p.symbol, // no name field, reuse symbol
            shares: qty, // keep sign; we'll split longs/shorts later
            avgPrice,
            currentPrice,
            change,
            changePercent: changePercent * 100, // fraction -> %
            totalPL,
            purchaseHistory: [],
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

  // Split into long and short positions
  const longPositions = positions.filter((p) => p.shares >= 0);
  const shortPositions = positions.filter((p) => p.shares < 0);

  // Fetch transactions (unchanged)
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

        const mapped: Transaction[] = data.map((o) => {
          const datetime = o.filled_at || o.submitted_at || o.created_at;
          const rawPrice = o.filled_avg_price ?? null;
          const price = rawPrice ? Number(rawPrice) : 0;
          const qty = Number(o.qty ?? '0');
          const filledQty = Number(o.filled_qty);

          return {
            id: o.id,
            symbol: o.symbol,
            name: o.symbol,
            type: o.side as 'buy' | 'sell',
            datetime,
            price,
            shares: qty,
            filledQty,
            totalValue: price * qty,
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

  const renderTableBody = (rows: StockWithHistory[], isShort: boolean) => (
    <tbody>
      {rows.map((stock) => {
        const signedShares = stock.shares;
        const sharesAbs = Math.abs(signedShares);

        // For both longs and shorts, treat "value" as absolute notional
        const value = sharesAbs * stock.currentPrice;
        const cost = sharesAbs * stock.avgPrice;

        // For shorts, P&L is still value - cost if cost carries sign via qty.
        // Since we use absolute for value/cost, compute P&L directly from API-like logic:
        const gain =
          (stock.currentPrice - stock.avgPrice) *
          (isShort ? -sharesAbs : sharesAbs);

        const gainPercent = cost === 0 ? 0 : (gain / cost) * 100;

        return (
          <tr
            key={stock.symbol}
            onClick={() => onSelectStock(stock)}
            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <td className="px-6 py-4">
              <div>
                <p className="text-foreground font-medium">{stock.symbol}</p>
                <p className="text-muted-foreground text-sm">{stock.name}</p>
              </div>
            </td>
            <td className="px-6 py-4 text-foreground hidden sm:table-cell">
              {sharesAbs}
            </td>
            <td className="px-6 py-4 text-right text-foreground">
              $
              {stock.avgPrice.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
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
                  stock.totalPL >= 0 ? 'text-primary' : 'text-red-500'
                }`}
              >
                {stock.totalPL >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {stock.totalPL >= 0 ? '+' : ''}${stock.totalPL.toFixed(2)}
                  {/* {stock.changePercent.toFixed(2)}% */}
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
              <div className={gain >= 0 ? 'text-primary' : 'text-red-500'}>
                <p>
                  {gain >= 0 ? '+' : ''}$
                  {gain.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p
                  className={`text-sm ${
                    gain >= 0 ? 'text-teal-300' : 'text-red-300'
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
  );

  return (
    <>
      {/* Long holdings header */}
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

      {/* Long positions table */}
      <Card className="bg-card border-border overflow-hidden mb-8">
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
                  Current Price
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4">
                  Total P/L
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4 hidden md:table-cell">
                  Current Value
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4 hidden lg:table-cell">
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
          <h2 className="text-foreground text-xl font-semibold mb-4">
            Short Positions
          </h2>
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
                      Sold Price
                    </th>
                    <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4">
                      Current Price
                    </th>
                    <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4">
                      Total P/L
                    </th>
                    <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4 hidden md:table-cell">
                      Current Value
                    </th>
                    <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4 hidden lg:table-cell">
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
