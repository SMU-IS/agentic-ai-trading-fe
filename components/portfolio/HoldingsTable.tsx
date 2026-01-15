'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { StockWithHistory } from '@/lib/types';

interface HoldingsTableProps {
  stocks: StockWithHistory[];
  onSelectStock: (stock: StockWithHistory) => void;
}

export default function HoldingsTable({
  stocks,
  onSelectStock,
}: HoldingsTableProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground text-xl font-semibold">Holdings</h2>
        <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Stock
        </Button>
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
                  Shares
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4">
                  Price
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4">
                  Change
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4 hidden md:table-cell">
                  Value
                </th>
                <th className="text-right text-muted-foreground text-sm font-medium px-6 py-4 hidden lg:table-cell">
                  Gain/Loss
                </th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => {
                const value = stock.shares * stock.currentPrice;
                const cost = stock.shares * stock.avgPrice;
                const gain = value - cost;
                const gainPercent = (gain / cost) * 100;

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
                      ${stock.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className={`flex items-center justify-end gap-1 ${
                          stock.change >= 0 ? 'text-primary' : 'text-red-500'
                        }`}
                      >
                        {stock.change >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>
                          {stock.change >= 0 ? '+' : ''}
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
                        <p className="text-sm">
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
    </>
  );
}
