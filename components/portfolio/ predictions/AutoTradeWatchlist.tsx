"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Trash2, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AutoTradeStock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  enabled: boolean;
}

const mockStockData: Record<string, { name: string; price: number; change: number; changePercent: number }> = {
  AMZN: {
    name: "Amazon.com Inc.",
    price: 178.25,
    change: 1.89,
    changePercent: 1.07,
  },
  MSFT: {
    name: "Microsoft Corp.",
    price: 378.91,
    change: 4.56,
    changePercent: 1.22,
  },
  META: {
    name: "Meta Platforms",
    price: 485.3,
    change: 8.25,
    changePercent: 1.73,
  },
  AMD: { name: "AMD Inc.", price: 142.5, change: -2.3, changePercent: -1.59 },
  INTC: {
    name: "Intel Corp.",
    price: 31.25,
    change: 0.45,
    changePercent: 1.46,
  },
};

export default function AutoTradeCard() {
  const [autoTradeSearch, setAutoTradeSearch] = useState("");
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  const [autoTradeStocks, setAutoTradeStocks] = useState<AutoTradeStock[]>([
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      currentPrice: 178.72,
      change: 2.34,
      changePercent: 1.32,
      enabled: true,
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corp.",
      currentPrice: 721.28,
      change: 12.45,
      changePercent: 1.76,
      enabled: true,
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc.",
      currentPrice: 248.5,
      change: -3.8,
      changePercent: -1.5,
      enabled: false,
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      currentPrice: 141.8,
      change: -1.2,
      changePercent: -0.84,
      enabled: true,
    },
  ]);

  // NEW: Debounced search function with Finnhub API
  const searchStocks = async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);

    try {
      // Search for symbols
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

      // Get quotes for top 5 results
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectStock = (stock: StockSearchResult) => {
    const upperSymbol = stock.symbol.toUpperCase().trim();

    if (autoTradeStocks.some((s) => s.symbol === upperSymbol)) {
      setAutoTradeSearch("");
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
      },
    ]);
    setAutoTradeSearch("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const addToAutoTrade = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase().trim();
    if (!upperSymbol) return;

    if (autoTradeStocks.some((s) => s.symbol === upperSymbol)) {
      setAutoTradeSearch("");
      return;
    }

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
    setAutoTradeSearch("");
  };

  const removeFromAutoTrade = (symbol: string) => {
    setAutoTradeStocks(autoTradeStocks.filter((s) => s.symbol !== symbol));
  };

  const toggleAutoTradeEnabled = (symbol: string) => {
    setAutoTradeStocks(autoTradeStocks.map((s) => (s.symbol === symbol ? { ...s, enabled: !s.enabled } : s)));
  };

  return (
    <Card className="bg-dark border-border h-full lg:row-span-2 flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Auto Trade Watchlist
          </CardTitle>
          <span className="text-muted-foreground text-sm">{autoTradeStocks.length} stocks</span>
        </div>
        <CardDescription className="text-muted-foreground">
          Stocks enabled for automatic trading based on predictions
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 overflow-hidden">
        {/* Search to add stocks - WITH AUTOCOMPLETE */}
        <div className="relative mb-4 flex-shrink-0" ref={dropdownRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <input
            type="text"
            placeholder="Search stocks (e.g., TS for Tesla)..."
            value={autoTradeSearch}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") addToAutoTrade(autoTradeSearch);
              if (e.key === "Escape") setShowDropdown(false);
            }}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            className="w-full bg-muted/30 border border-border rounded-lg py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary relative z-0"
          />

          {/* Loading spinner */}
          {isSearching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {/* Add button (only show when not searching) */}
          {autoTradeSearch && !isSearching && (
            <button
              onClick={() => addToAutoTrade(autoTradeSearch)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors z-10"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 text-black bg-black border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchResults.map((stock, index) => (
                <button
                  key={`${stock.symbol}-${index}`}
                  onClick={() => selectStock(stock)}
                  className="w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{stock.symbol}</span>
                      <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded">
                        {stock.type}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{stock.name}</div>
                  </div>

                  {stock.price !== null && stock.price > 0 && (
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="font-semibold text-foreground">${stock.price.toFixed(2)}</div>
                      {stock.changePercent !== null && (
                        <div
                          className={`text-xs flex items-center justify-end gap-0.5 ${
                            stock.changePercent >= 0 ? "text-primary" : "text-red-400"
                          }`}
                        >
                          {stock.changePercent >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {stock.changePercent >= 0 ? "+" : ""}
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
                stock.enabled ? "bg-primary/5 border-primary/30" : "bg-muted/20 border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Toggle button */}
                <button
                  onClick={() => toggleAutoTradeEnabled(stock.symbol)}
                  className={`w-10 h-6 rounded-full relative transition-colors ${
                    stock.enabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      stock.enabled ? "left-5" : "left-1"
                    }`}
                  />
                </button>
                <div>
                  <p className="text-foreground font-medium text-sm">{stock.symbol}</p>
                  <p className="text-muted-foreground text-xs">{stock.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-foreground text-sm font-medium">${stock.currentPrice.toFixed(2)}</p>
                  <p className="text-xs flex items-center justify-end gap-0.5">
                    <span className={stock.changePercent >= 0 ? "text-primary" : "text-red-400"}>
                      {stock.changePercent >= 0 ? (
                        <TrendingUp className="w-3 h-3 inline mr-0.5" />
                      ) : (
                        <TrendingDown className="w-3 h-3 inline mr-0.5" />
                      )}
                      {stock.changePercent >= 0 ? "+" : ""}
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

        {autoTradeStocks.length > 0 && (
          <div className="mt-4 pt-4 flex-shrink-0">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active trades</span>
              <span className="text-foreground font-medium ">
                {autoTradeStocks.filter((s) => s.enabled).length} of {autoTradeStocks.length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
