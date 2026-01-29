'use client'

import StockLogo from '@/components/StockLogo'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getCompanyName } from '@/lib/tickerMap'

interface AutoTradeStock {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  enabled: boolean
  qty: number
  side: 'long' | 'short'
  unrealizedPL: number
}

interface StockSearchResult {
  symbol: string
  name: string
  type: string
  price: number | null
  change: number | null
  changePercent: number | null
}

interface FinnhubSearchResult {
  symbol: string
  description: string
  type: string
}

interface FinnhubQuote {
  c: number // current
  d: number // change
  dp: number // change %
}

interface PositionResponse {
  asset_id: string
  symbol: string
  exchange: string
  asset_class: string
  asset_marginable: boolean
  avg_entry_price: string
  qty: string
  side: 'long' | 'short'
  market_value: string
  cost_basis: string
  unrealized_pl: string
  unrealized_plpc: string
  unrealized_intraday_pl: string
  unrealized_intraday_plpc: string
  current_price: string
  lastday_price: string
  change_today: string
  qty_available: string
}

export default function AutoTradeCard() {
  const [autoTradeSearch, setAutoTradeSearch] = useState('')
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY

  const [autoTradeStocks, setAutoTradeStocks] = useState<AutoTradeStock[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load positions from your API
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setIsLoading(true)

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/positions`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || 'Failed to fetch positions')
        }

        const data: PositionResponse[] = await res.json()

        // Map API response to AutoTradeStock format
        const mapped: AutoTradeStock[] = data.map((position) => {
          const qty = parseFloat(position.qty)
          const currentPrice = parseFloat(position.current_price)
          const lastDayPrice = parseFloat(position.lastday_price)
          const changeToday = parseFloat(position.change_today)
          const unrealizedPL = parseFloat(position.unrealized_pl)

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
          }
        })

        setAutoTradeStocks(mapped)
      } catch (error) {
        console.error('Error loading positions:', error)
        // Fallback to empty array on error
        setAutoTradeStocks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPositions()
  }, [])

  // Debounced search function with Finnhub API
  const searchStocks = async (query: string) => {
    if (query.length < 1) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setIsSearching(true)

    try {
      const searchResponse = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`,
      )
      const searchData = await searchResponse.json()

      if (!searchData.result || searchData.result.length === 0) {
        setSearchResults([])
        setShowDropdown(false)
        setIsSearching(false)
        return
      }

      const topResults = searchData.result.slice(0, 5)
      const resultsWithPrices = await Promise.all(
        topResults.map(async (stock: FinnhubSearchResult) => {
          try {
            const quoteResponse = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`,
            )
            const quoteData: FinnhubQuote = await quoteResponse.json()

            return {
              symbol: stock.symbol,
              name: stock.description,
              type: stock.type,
              price: quoteData.c || null,
              change: quoteData.d || null,
              changePercent: quoteData.dp || null,
            }
          } catch (error) {
            return {
              symbol: stock.symbol,
              name: stock.description,
              type: stock.type,
              price: null,
              change: null,
              changePercent: null,
            }
          }
        }),
      )

      setSearchResults(resultsWithPrices)
      setShowDropdown(true)
    } catch (error) {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAutoTradeSearch(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchStocks(value)
    }, 300)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectStock = (stock: StockSearchResult) => {
    const upperSymbol = stock.symbol.toUpperCase().trim()

    if (autoTradeStocks.some((s) => s.symbol === upperSymbol)) {
      setAutoTradeSearch('')
      setSearchResults([])
      setShowDropdown(false)
      return
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
    ])
    setAutoTradeSearch('')
    setSearchResults([])
    setShowDropdown(false)
  }

  const addToAutoTrade = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase().trim()
    if (!upperSymbol) return

    if (autoTradeStocks.some((s) => s.symbol === upperSymbol)) {
      setAutoTradeSearch('')
      return
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
    ])
    setAutoTradeSearch('')
  }

  const removeFromAutoTrade = (symbol: string) => {
    setAutoTradeStocks(autoTradeStocks.filter((s) => s.symbol !== symbol))
  }

  const toggleAutoTradeEnabled = async (symbol: string) => {
    setAutoTradeStocks((prev) =>
      prev.map((s) =>
        s.symbol === symbol ? { ...s, enabled: !s.enabled } : s,
      ),
    )

    const toggled = autoTradeStocks.find((s) => s.symbol === symbol)
    const willBeEnabled = toggled ? !toggled.enabled : false

    if (!willBeEnabled) return

    try {
      await fetch('/api/auto-trade/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      })
    } catch (e) {
      console.error('Failed to notify auto-trade enable', e)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-dark flex h-full flex-col border-border lg:row-span-2">
        <CardHeader className="flex-shrink-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Zap className="h-5 w-5 text-yellow-500" />
            Auto Trade Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-dark flex h-full flex-col border-border lg:row-span-2">
      <CardHeader className="flex-shrink-0 p-3">
        <div className="flex items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 p-3 text-lg font-semibold text-foreground">
            <Zap className="h-5 w-5 text-yellow-500" />
            Agentic Watchlist
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {autoTradeStocks.length} stocks
          </span>
        </div>

        {/* Deep research prompt */}
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-primary">
              Add a stock into your watchlist
            </span>{' '}
            for automatic trading based on predictions
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden p-3 pt-0">
        {/* Search to add stocks */}
        <div className="relative mb-3 flex-shrink-0" ref={dropdownRef}>
          <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stocks...(e.g. TSLA)"
            value={autoTradeSearch}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addToAutoTrade(autoTradeSearch)
              if (e.key === 'Escape') setShowDropdown(false)
            }}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true)
            }}
            className="relative z-0 w-full rounded-lg border border-border bg-muted/30 py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          {isSearching && (
            <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            </div>
          )}

          {autoTradeSearch && !isSearching && (
            <button
              onClick={() => addToAutoTrade(autoTradeSearch)}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded bg-primary p-1 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-black text-black shadow-lg">
              {searchResults.map((stock, index) => (
                <button
                  key={`${stock.symbol}-${index}`}
                  onClick={() => selectStock(stock)}
                  className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        <StockLogo
                          symbol={stock.symbol}
                          name={stock.name}
                          size="md"
                        />
                      </span>
                      <span className="font-semibold text-foreground">
                        {stock.symbol}
                      </span>
                      <span className="rounded bg-muted/50 px-1.5 py-0.5 text-xs text-muted-foreground">
                        {stock.type}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {stock.name}
                    </div>
                  </div>

                  {stock.price !== null && stock.price > 0 && (
                    <div className="ml-4 flex-shrink-0 text-right">
                      <div className="font-semibold text-foreground">
                        ${stock.price.toFixed(2)}
                      </div>
                      {stock.changePercent !== null && (
                        <div
                          className={`flex items-center justify-end gap-0.5 text-xs ${
                            stock.changePercent >= 0
                              ? 'text-primary'
                              : 'text-red-400'
                          }`}
                        >
                          {stock.changePercent >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
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

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {autoTradeStocks.map((stock) => (
            <div
              key={stock.symbol}
              className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                stock.enabled
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-muted/20'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* <button
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
                </button> */}

                <StockLogo symbol={stock.symbol} name={stock.name} size="md" />
                <div>
                  <div className="flex flex-col items-start gap-1 text-left">
                    <p className="text-xs font-medium text-foreground">
                      {stock.symbol}
                    </p>{' '}
                    <p className="text-xs font-medium text-foreground/50">
                      {getCompanyName(stock.symbol)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">
                    $
                    {stock.currentPrice.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="flex items-center justify-end gap-0.5 text-xs">
                    <span
                      className={
                        stock.changePercent >= 0
                          ? 'text-primary'
                          : 'text-red-400'
                      }
                    >
                      {stock.changePercent >= 0 ? (
                        <TrendingUp className="mr-0.5 inline h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-0.5 inline h-3 w-3" />
                      )}
                      {stock.changePercent >= 0 ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => removeFromAutoTrade(stock.symbol)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {autoTradeStocks.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <Zap className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No positions found</p>
              <p className="mt-1 text-xs">
                Add stocks using the search above or create positions
              </p>
            </div>
          )}
        </div>

        {autoTradeStocks.length > 0 && (
          <div className="mt-4 flex-shrink-0 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active trades</span>
              <span className="font-medium text-foreground">
                {autoTradeStocks.filter((s) => s.enabled).length} of{' '}
                {autoTradeStocks.length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
