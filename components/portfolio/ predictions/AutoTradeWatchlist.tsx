'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AutoTradeStock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  enabled: boolean;
  qty: number;
  side: 'long' | 'short';
  unrealizedPL: number;
}

interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

interface FinnhubSearchResult {
  symbol: string;
  description: string;
  type: string;
}

interface FinnhubQuote {
  c: number; // current
  d: number; // change
  dp: number; // change %
}

interface PositionResponse {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  asset_marginable: boolean;
  avg_entry_price: string;
  qty: string;
  side: 'long' | 'short';
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
  qty_available: string;
}

export default function AutoTradeCard() {
  const [autoTradeSearch, setAutoTradeSearch] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

  const [autoTradeStocks, setAutoTradeStocks] = useState<AutoTradeStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load positions from your API
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setIsLoading(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/positions`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to fetch positions');
        }

        const data: PositionResponse[] = await res.json();

        // Map API response to AutoTradeStock format
        const mapped: AutoTradeStock[] = data.map((position) => {
          const qty = parseFloat(position.qty);
          const currentPrice = parseFloat(position.current_price);
          const lastDayPrice = parseFloat(position.lastday_price);
          const changeToday = parseFloat(position.change_today);
          const unrealizedPL = parseFloat(position.unrealized_pl);

          return {
            symbol: position.symbol,
            name: `${position.symbol} ${position.asset_class === 'crypto' ? 'Crypto' : 'Equity'}`,
            currentPrice: currentPrice,
            change: currentPrice - lastDayPrice,
            changePercent: changeToday * 100, // Convert to percentage
            enabled: true, // Default to enabled, you can persist this separately
            qty: Math.abs(qty), // Show absolute quantity
            side: position.side,
            unrealizedPL: unrealizedPL,
          };
        });

        setAutoTradeStocks(mapped);
      } catch (error) {
        console.error('Error loading positions:', error);
        // Fallback to empty array on error
        setAutoTradeStocks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();
  }, []);

  // Debounced search function with Finnhub API
  const searchStocks = async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);

    try {
      const searchResponse = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`,
      );
      const searchData = await searchResponse.json();

      if (!searchData.result || searchData.result.length === 0) {
        setSearchResults([]);
        setShowDropdown(false);
        setIsSearching(false);
        return;
      }

      const topResults = searchData.result.slice(0, 5);
      const resultsWithPrices = await Promise.all(
        topResults.map(async (stock: FinnhubSearchResult) => {
          try {
            const quoteResponse = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`,
            );
            const quoteData: FinnhubQuote = await quoteResponse.json();

            return {
              symbol: stock.symbol,
              name: stock.description,
              type: stock.type,
              price: quoteData.c || null,
              change: quoteData.d || null,
              changePercent: quoteData.dp || null,
            };
          } catch (error) {
            return {
              symbol: stock.symbol,
              name: stock.description,
              type: stock.type,
              price: null,
              change: null,
              changePercent: null,
            };
          }
        }),
      );

      setSearchResults(resultsWithPrices);
      setShowDropdown(true);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAutoTradeSearch(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchStocks(value);
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectStock = (stock: StockSearchResult) => {
    const upperSymbol = stock.symbol.toUpperCase().trim();

    if (autoTradeStocks.some((s) => s.symbol === upperSymbol)) {
      setAutoTradeSearch('');
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setAutoTradeStocks([
      ...autoTradeStocks,
      {
        symbol: upperSymbol,
        name: stock.name,
        currentPrice: stock.price || 0,
        change: stock.change || 0,
        changePercent: stock.changePercent || 0,
        enabled: true,
        qty: 0,
        side: 'long',
        unrealizedPL: 0,
      },
    ]);
    setAutoTradeSearch('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const addToAutoTrade = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase().trim();
    if (!upperSymbol) return;

    if (autoTradeStocks.some((s) => s.symbol === upperSymbol)) {
      setAutoTradeSearch('');
      return;
    }

    // Add new stock with placeholder data
    setAutoTradeStocks([
      ...autoTradeStocks,
      {
        symbol: upperSymbol,
        name: `${upperSymbol} Corp.`,
        currentPrice: 0,
        change: 0,
        changePercent: 0,
        enabled: true,
        qty: 0,
        side: 'long',
        unrealizedPL: 0,
      },
    ]);
    setAutoTradeSearch('');
  };

  const removeFromAutoTrade = (symbol: string) => {
    setAutoTradeStocks(autoTradeStocks.filter((s) => s.symbol !== symbol));
  };

  const toggleAutoTradeEnabled = async (symbol: string) => {
    setAutoTradeStocks((prev) =>
      prev.map((s) =>
        s.symbol === symbol ? { ...s, enabled: !s.enabled } : s,
      ),
    );

    const toggled = autoTradeStocks.find((s) => s.symbol === symbol);
    const willBeEnabled = toggled ? !toggled.enabled : false;

    if (!willBeEnabled) return;

    try {
      await fetch('/api/auto-trade/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
    } catch (e) {
      console.error('Failed to notify auto-trade enable', e);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-dark border-border h-full lg:row-span-2 flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-foreground text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Auto Trade Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark border-border h-full lg:row-span-2 flex flex-col">
      <CardHeader className="flex-shrink-0 p-3">
        <div className="flex items-center justify-between pb-2">
          <CardTitle className="text-foreground text-lg font-semibold flex items-center gap-2 p-3 ">
            <Zap className="w-5 h-5 text-yellow-500" />
            Agentic Watchlist
          </CardTitle>
          <span className="text-muted-foreground text-sm">
            {autoTradeStocks.length} stocks
          </span>
        </div>

        {/* Deep research prompt */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
          <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-medium">
              Add a stock into your watchlist
            </span>{' '}
            for automatic trading based on predictions
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 overflow-hidden p-3 pt-0">
        {/* Search to add stocks */}
        <div className="relative mb-3 flex-shrink-0" ref={dropdownRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <input
            type="text"
            placeholder="Search stocks...(e.g. TSLA)"
            value={autoTradeSearch}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addToAutoTrade(autoTradeSearch);
              if (e.key === 'Escape') setShowDropdown(false);
            }}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            className="w-full bg-muted/30 border border-border rounded-lg py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary relative z-0"
          />

          {isSearching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {autoTradeSearch && !isSearching && (
            <button
              onClick={() => addToAutoTrade(autoTradeSearch)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors z-10"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 text-black bg-black border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchResults.map((stock, index) => (
                <button
                  key={`${stock.symbol}-${index}`}
                  onClick={() => selectStock(stock)}
                  className="w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {stock.symbol}
                      </span>
                      <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded">
                        {stock.type}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {stock.name}
                    </div>
                  </div>

                  {stock.price !== null && stock.price > 0 && (
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="font-semibold text-foreground">
                        ${stock.price.toFixed(2)}
                      </div>
                      {stock.changePercent !== null && (
                        <div
                          className={`text-xs flex items-center justify-end gap-0.5 ${
                            stock.changePercent >= 0
                              ? 'text-primary'
                              : 'text-red-400'
                          }`}
                        >
                          {stock.changePercent >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {stock.changePercent >= 0 ? '+' : ''}
                          {stock.changePercent.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto min-h-0">
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
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-medium text-xs">
                      {stock.symbol}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-foreground text-xs font-medium">
                    $
                    {stock.currentPrice.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
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
              <p className="text-sm">No positions found</p>
              <p className="text-xs mt-1">
                Add stocks using the search above or create positions
              </p>
            </div>
          )}
        </div>

        {autoTradeStocks.length > 0 && (
          <div className="mt-4 pt-4 flex-shrink-0">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active trades</span>
              <span className="text-foreground font-medium ">
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
