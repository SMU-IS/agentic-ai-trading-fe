'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, TrendingUp, TrendingDown, History } from 'lucide-react';
import { StockWithHistory, Transaction } from '@/lib/types';
import TransactionsModal from './transactions/TransactionHistory';
import AskAI from './chat/AskAI';
import { Sparkles } from 'lucide-react';

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}`;

interface HoldingsTableProps {
  onSelectStock: (stock: StockWithHistory | null) => void;
}

export default function HoldingsTable({ onSelectStock }: HoldingsTableProps) {
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');
  const [showAskAI, setShowAskAI] = useState(false);

  const [positions, setPositions] = useState<StockWithHistory[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState('');

  // Fetch positions for holdings
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setPositionsLoading(true);
        setPositionsError('');

        const res = await fetch(`${BASE_URL}/trading/positions`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
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
            name: p.symbol,
            shares: qty,
            avgPrice,
            currentPrice,
            change,
            changePercent: changePercent * 100,
            totalPL,
            purchaseHistory: [], // will be filled on click from orders API
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

  const longPositions = positions.filter((p) => p.shares >= 0);
  const shortPositions = positions.filter((p) => p.shares < 0);
  useEffect(() => {
    if (!showTransactionsModal) return;

    const fetchTransactions = async () => {
      try {
        setTxLoading(true);
        setTxError('');

        const res = await fetch(`${BASE_URL}/trading/orders/all`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to fetch orders');
        }

        const orders: any[] = await res.json();

        type TxRow = {
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
        };

        const allTx: TxRow[] = [];

        for (const o of orders) {
          const baseDatetime = o.filled_at || o.submitted_at || o.created_at;

          // parent filled execution (if any)
          if (o.status === 'filled' && Number(o.filled_qty) !== 0) {
            const price = Number(o.filled_avg_price ?? 0);
            const qty = Number(o.qty ?? 0);
            const filledQty = Number(o.filled_qty ?? 0);
            const side = o.side as 'buy' | 'sell';

            allTx.push({
              id: o.id,
              symbol: o.symbol,
              name: o.symbol,
              type: side,
              datetime: baseDatetime,
              price,
              shares: qty,
              filledQty,
              totalValue: price * filledQty,
              reason: `${o.order_type} ${o.order_class} (${o.status})`,
            });
          }

          // filled legs (for bracket orders)
          if (Array.isArray(o.legs)) {
            for (const leg of o.legs) {
              if (
                leg &&
                leg.status === 'filled' &&
                Number(leg.filled_qty) !== 0
              ) {
                const legDatetime =
                  leg.filled_at || leg.submitted_at || leg.created_at;
                const price = Number(leg.filled_avg_price ?? 0);
                const qty = Number(leg.qty ?? 0);
                const filledQty = Number(leg.filled_qty ?? 0);
                const side = leg.side as 'buy' | 'sell';

                allTx.push({
                  id: leg.id,
                  symbol: leg.symbol,
                  name: leg.symbol,
                  type: side,
                  datetime: legDatetime,
                  price,
                  shares: qty,
                  filledQty,
                  totalValue: price * filledQty,
                  reason: `${leg.order_type} ${leg.order_class} (${leg.status})`,
                });
              }
            }
          }
        }

        setTransactions(allTx);
      } catch (err) {
        setTxError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setTxLoading(false);
      }
    };

    fetchTransactions();
  }, [showTransactionsModal]);

  const handleRowClick = async (position: StockWithHistory) => {
    try {
      const res = await fetch(`${BASE_URL}/trading/orders/all`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch orders');
      }

      const orders: any[] = await res.json();

      // Helper: normalize symbol like "BTC/USD" -> "BTCUSD"
      const normalizeSymbol = (s: string) => s.replace(/[^a-zA-Z]/g, '');

      // Only orders for this symbol
      const symbolOrders = orders.filter(
        (o) => normalizeSymbol(o.symbol) === position.symbol,
      );

      // Collect all filled executions: parent + any legs
      type FillRow = {
        date: string;
        datetime?: string;
        shares: number;
        pricePerShare: number;
        side: 'buy' | 'sell';
        sourceOrderId: string;
      };

      const fills: FillRow[] = [];

      for (const o of symbolOrders) {
        // parent fill
        if (o.status === 'filled' && Number(o.filled_qty) !== 0) {
          fills.push({
            date: o.filled_at || o.submitted_at || o.created_at,
            datetime: o.filled_at || o.submitted_at || o.created_at,
            shares: Number(o.filled_qty),
            pricePerShare: Number(o.filled_avg_price ?? 0),
            side: o.side as 'buy' | 'sell',
            sourceOrderId: o.id,
          });
        }

        // leg fills (for bracket orders)
        if (Array.isArray(o.legs)) {
          for (const leg of o.legs) {
            if (
              leg &&
              leg.status === 'filled' &&
              Number(leg.filled_qty) !== 0 &&
              normalizeSymbol(leg.symbol) === position.symbol
            ) {
              fills.push({
                date: leg.filled_at || leg.submitted_at || leg.created_at,
                datetime: leg.filled_at || leg.submitted_at || leg.created_at,
                shares: Number(leg.filled_qty),
                pricePerShare: Number(leg.filled_avg_price ?? 0),
                side: leg.side as 'buy' | 'sell',
                sourceOrderId: leg.id,
              });
            }
          }
        }
      }

      // Map fills into purchaseHistory, converting sell to negative shares
      const purchaseHistory =
        fills.map((f) => ({
          date: f.date,
          datetime: f.datetime,
          shares: f.side === 'sell' ? -f.shares : f.shares,
          pricePerShare: f.pricePerShare,
        })) ?? [];

      const totalShares = purchaseHistory.reduce((sum, p) => sum + p.shares, 0);
      const totalCost = purchaseHistory.reduce(
        (sum, p) => sum + p.shares * p.pricePerShare,
        0,
      );
      const avgPrice =
        totalShares !== 0 ? totalCost / totalShares : position.avgPrice;

      const stockWithHistory: StockWithHistory = {
        ...position,
        shares: totalShares || position.shares,
        avgPrice,
        purchaseHistory,
      };

      onSelectStock(stockWithHistory);
    } catch (err) {
      console.error('Failed to load stock history', err);
      onSelectStock(position);
    }
  };

  const renderTableBody = (rows: StockWithHistory[], isShort: boolean) => (
    <tbody>
      {rows.map((stock) => {
        const signedShares = stock.shares;
        const sharesAbs = Math.abs(signedShares);
        const value = sharesAbs * stock.currentPrice;
        const cost = sharesAbs * stock.avgPrice;
        const gain =
          (stock.currentPrice - stock.avgPrice) *
          (isShort ? -sharesAbs : sharesAbs);
        const gainPercent = cost === 0 ? 0 : (gain / cost) * 100;

        return (
          <tr
            key={stock.symbol}
            onClick={() => handleRowClick(stock)}
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
                  className={`text-sm ${gain >= 0 ? 'text-teal-300' : 'text-red-300'}`}
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
          <Button
            className="bg-teal-600 text-white hover:bg-teal-600 rounded-full shadow-lg hover:shadow-teal-500/30 transition-all"
            onClick={() => setShowAskAI(true)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Ask AI
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

      {/* Ask AI bottom sheet */}
      <AskAI open={showAskAI} onOpenChange={setShowAskAI} />
    </>
  );
}
