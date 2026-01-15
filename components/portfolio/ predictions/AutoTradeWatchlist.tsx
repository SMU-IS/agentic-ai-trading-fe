'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Zap,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
} from 'lucide-react';

interface AutoTradeStock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  enabled: boolean;
}

// Mock data for adding new stocks
const mockStockData: Record<
  string,
  { name: string; price: number; change: number; changePercent: number }
> = {
  AMZN: {
    name: 'Amazon.com Inc.',
    price: 178.25,
    change: 1.89,
    changePercent: 1.07,
  },
  MSFT: {
    name: 'Microsoft Corp.',
    price: 378.91,
    change: 4.56,
    changePercent: 1.22,
  },
  META: {
    name: 'Meta Platforms',
    price: 485.3,
    change: 8.25,
    changePercent: 1.73,
  },
  AMD: { name: 'AMD Inc.', price: 142.5, change: -2.3, changePercent: -1.59 },
  INTC: {
    name: 'Intel Corp.',
    price: 31.25,
    change: 0.45,
    changePercent: 1.46,
  },
};

export default function AutoTradeCard() {
  const [autoTradeSearch, setAutoTradeSearch] = useState('');
  const [autoTradeStocks, setAutoTradeStocks] = useState<AutoTradeStock[]>([
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      currentPrice: 178.72,
      change: 2.34,
      changePercent: 1.32,
      enabled: true,
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      currentPrice: 721.28,
      change: 12.45,
      changePercent: 1.76,
      enabled: true,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      currentPrice: 248.5,
      change: -3.8,
      changePercent: -1.5,
      enabled: false,
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      currentPrice: 141.8,
      change: -1.2,
      changePercent: -0.84,
      enabled: true,
    },
  ]);

  const addToAutoTrade = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase().trim();
    if (!upperSymbol) return;

    // Prevent duplicates
    if (autoTradeStocks.some((s) => s.symbol === upperSymbol)) {
      setAutoTradeSearch('');
      return;
    }

    // Get data or generate random fallback
    const stockData = mockStockData[upperSymbol] || {
      name: `${upperSymbol} Corp.`,
      price: Math.random() * 500 + 50,
      change: Math.random() * 20 - 10,
      changePercent: Math.random() * 10 - 5,
    };

    setAutoTradeStocks([
      ...autoTradeStocks,
      {
        symbol: upperSymbol,
        name: stockData.name,
        currentPrice: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent,
        enabled: true,
      },
    ]);
    setAutoTradeSearch('');
  };

  const removeFromAutoTrade = (symbol: string) => {
    setAutoTradeStocks(autoTradeStocks.filter((s) => s.symbol !== symbol));
  };

  const toggleAutoTradeEnabled = (symbol: string) => {
    setAutoTradeStocks(
      autoTradeStocks.map((s) =>
        s.symbol === symbol ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  return (
    <Card className="bg-card border-border h-fit lg:row-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Auto Trade Watchlist
          </CardTitle>
          <span className="text-muted-foreground text-sm">
            {autoTradeStocks.length} stocks
          </span>
        </div>
        <CardDescription className="text-muted-foreground">
          Stocks enabled for automatic trading based on predictions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search to add stocks */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Add stock symbol..."
            value={autoTradeSearch}
            onChange={(e) => setAutoTradeSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addToAutoTrade(autoTradeSearch);
            }}
            className="w-full bg-muted/30 border border-border rounded-lg py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          <button
            onClick={() => addToAutoTrade(autoTradeSearch)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Stock list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {autoTradeStocks.map((stock) => (
            <div
              key={stock.symbol}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                stock.enabled
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-muted/20 border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Toggle button */}
                <button
                  onClick={() => toggleAutoTradeEnabled(stock.symbol)}
                  className={`w-10 h-6 rounded-full relative transition-colors ${
                    stock.enabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      stock.enabled ? 'left-5' : 'left-1'
                    }`}
                  />
                </button>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    {stock.symbol}
                  </p>
                  <p className="text-muted-foreground text-xs">{stock.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-foreground text-sm font-medium">
                    ${stock.currentPrice.toFixed(2)}
                  </p>
                  <p className="text-xs flex items-center justify-end gap-0.5">
                    <span
                      className={
                        stock.changePercent >= 0
                          ? 'text-primary'
                          : 'text-red-400'
                      }
                    >
                      {stock.changePercent >= 0 ? (
                        <TrendingUp className="w-3 h-3 inline mr-0.5" />
                      ) : (
                        <TrendingDown className="w-3 h-3 inline mr-0.5" />
                      )}
                      {stock.changePercent >= 0 ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => removeFromAutoTrade(stock.symbol)}
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {autoTradeStocks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No stocks in Auto Trade watchlist</p>
              <p className="text-xs mt-1">Add stocks using the search above</p>
            </div>
          )}
        </div>

        {/* Summary footer */}
        {autoTradeStocks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active trades</span>
              <span className="text-foreground font-medium">
                {autoTradeStocks.filter((s) => s.enabled).length} of{' '}
                {autoTradeStocks.length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
