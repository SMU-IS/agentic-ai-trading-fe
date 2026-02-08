'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  DollarSign,
  Calendar,
  Filter,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TradingTimelineProps {
  selectedTrade: TradeEvent | null;
  onSelectTrade: (trade: TradeEvent) => void;
}

interface TradeEvent {
  id: string;
  symbol: string;
  timestamp: string;
  date_label: string;
  time_label: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_value: number;
  order_type: 'market' | 'limit' | 'stop' | 'bracket';
  status: 'filled' | 'partial' | 'pending' | 'cancelled';
  trigger_reason?: string;
  narrative_context?: {
    platform: string;
    author: string;
    credibility: number;
    summary: string;
  };
  pnl?: number;
  pnl_percent?: number;
}

const SPECULATION_METADATA: Record<string, any> = {
  NVDA: {
    entry_reason: {
      origin: 'reddit_dd',
      author: 'u/ChipAnalyst',
      author_credibility: 9,
      platform: 'reddit',
      summary:
        'Reddit DD by u/ChipAnalyst (9/10 acc.) claims NVDA B200 GPU sales exceeded estimates.',
    },
  },
  AAPL: {
    entry_reason: {
      origin: 'twitter_momentum',
      author: '@TechTrader_AI',
      author_credibility: 8,
      platform: 'twitter',
      summary: 'Twitter thread highlights iPhone 16 supply chain acceleration.',
    },
  },
  META: {
    entry_reason: {
      origin: 'bloomberg_news',
      author: 'Bloomberg',
      author_credibility: 10,
      platform: 'bloomberg',
      summary:
        'Bloomberg reports META AI integration showing 40% faster adoption.',
    },
  },
};

export default function TradingTimeline({
  selectedTrade,
  onSelectTrade,
}: TradingTimelineProps) {
  const [trades, setTrades] = useState<TradeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'filled' | 'pending'
  >('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetchTradeHistory();
  }, []);

  const transformAlpacaOrderToTrade = (order: any): TradeEvent | null => {
    const qty = parseFloat(order.qty || order.filled_qty || '0');
    const price = parseFloat(
      order.filled_avg_price || order.limit_price || '0',
    );
    const totalValue = qty * price;

    if (qty === 0) return null;

    let status: 'filled' | 'partial' | 'pending' | 'cancelled' = 'pending';
    if (order.status === 'filled') status = 'filled';
    else if (order.status === 'partially_filled') status = 'partial';
    else if (order.status === 'cancelled') status = 'cancelled';

    const timestamp = order.filled_at || order.submitted_at || order.created_at;
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    let dateLabel = '';
    if (isToday) {
      dateLabel = 'Today';
    } else if (isYesterday) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }

    const timeLabel = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const speculationMetadata = SPECULATION_METADATA[order.symbol];

    return {
      id: order.id,
      symbol: order.symbol,
      timestamp,
      date_label: dateLabel,
      time_label: timeLabel,
      trade_type: order.side as 'buy' | 'sell',
      quantity: qty,
      price,
      total_value: totalValue,
      order_type: order.order_type || order.type,
      status,
      trigger_reason: speculationMetadata
        ? `Agent triggered by ${speculationMetadata.entry_reason.platform} narrative`
        : 'Manual trade',
      narrative_context: speculationMetadata
        ? {
            platform: speculationMetadata.entry_reason.platform,
            author: speculationMetadata.entry_reason.author,
            credibility: speculationMetadata.entry_reason.author_credibility,
            summary: speculationMetadata.entry_reason.summary,
          }
        : undefined,
    };
  };

  const fetchTradeHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/orders/all`,
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const orders = await res.json();

      const allTrades = orders
        .map(transformAlpacaOrderToTrade)
        .filter((t: TradeEvent | null): t is TradeEvent => t !== null)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

      setTrades(allTrades);
    } catch (error) {
      console.error('Error fetching trade history:', error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = trades.filter((trade) => {
    if (filterType !== 'all' && trade.trade_type !== filterType) return false;
    if (filterStatus === 'filled' && trade.status !== 'filled') return false;
    if (filterStatus === 'pending' && trade.status === 'filled') return false;
    return true;
  });

  const groupedTrades = filteredTrades.reduce(
    (acc, trade) => {
      const dateKey = trade.date_label;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(trade);
      return acc;
    },
    {} as Record<string, TradeEvent[]>,
  );

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'reddit':
        return '🔴';
      case 'twitter':
        return '🐦';
      case 'bloomberg':
        return '📰';
      case 'seekingalpha':
        return '📈';
      default:
        return '🌐';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'partial':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'pending':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'cancelled':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 mb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Historical Trades
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete history of all trades and AI agent activity
          </p>
        </div>
      </div>

      {/* Timeline Card - Fills remaining height */}
      <Card className="bg-card border-border">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-sm flex items-center gap-2 mb-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Trades ({filteredTrades.length} trades)
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-3 h-3 mr-2" />
                Filters
                {(filterType !== 'all' || filterStatus !== 'all') && (
                  <span className="ml-2 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-[10px]">
                    Active
                  </span>
                )}
              </Button>

              {showFilters && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-black/95 border border-border rounded-lg shadow-lg p-4 z-50">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Trade Type</h4>
                      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        <button
                          onClick={() => {
                            setFilterType('all');
                            setShowFilters(false);
                          }}
                          className={`h-8 text-xs flex-1 rounded transition-colors ${
                            filterType === 'all'
                              ? 'bg-secondary text-secondary-foreground'
                              : 'hover:bg-muted-foreground/10'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => {
                            setFilterType('buy');
                            setShowFilters(false);
                          }}
                          className={`h-8 text-xs flex-1 rounded transition-colors flex items-center justify-center gap-1 ${
                            filterType === 'buy'
                              ? 'bg-secondary text-secondary-foreground'
                              : 'hover:bg-muted-foreground/10'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          Buys
                        </button>
                        <button
                          onClick={() => {
                            setFilterType('sell');
                            setShowFilters(false);
                          }}
                          className={`h-8 text-xs flex-1 rounded transition-colors flex items-center justify-center gap-1 ${
                            filterType === 'sell'
                              ? 'bg-secondary text-secondary-foreground'
                              : 'hover:bg-muted-foreground/10'
                          }`}
                        >
                          <TrendingDown className="w-3 h-3" />
                          Sells
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Status</h4>
                      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        <button
                          onClick={() => {
                            setFilterStatus('all');
                            setShowFilters(false);
                          }}
                          className={`h-8 text-xs flex-1 rounded transition-colors ${
                            filterStatus === 'all'
                              ? 'bg-secondary text-secondary-foreground'
                              : 'hover:bg-muted-foreground/10'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => {
                            setFilterStatus('filled');
                            setShowFilters(false);
                          }}
                          className={`h-8 text-xs flex-1 rounded transition-colors ${
                            filterStatus === 'filled'
                              ? 'bg-secondary text-secondary-foreground'
                              : 'hover:bg-muted-foreground/10'
                          }`}
                        >
                          Filled
                        </button>
                        <button
                          onClick={() => {
                            setFilterStatus('pending');
                            setShowFilters(false);
                          }}
                          className={`h-8 text-xs flex-1 rounded transition-colors ${
                            filterStatus === 'pending'
                              ? 'bg-secondary text-secondary-foreground'
                              : 'hover:bg-muted-foreground/10'
                          }`}
                        >
                          Pending
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Dropdown */}
            {!loading && filteredTrades.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowStats(!showStats)}
                >
                  <Info className="w-3 h-3 mr-2" />
                  Statistics
                </Button>

                {showStats && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-black/95 border border-border rounded-lg shadow-lg p-4 z-50">
                    <h4 className="font-medium text-sm mb-3">
                      Trading Statistics
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <ArrowRightLeft className="w-3 h-3" />
                          <span className="text-xs">Total Trades</span>
                        </div>
                        <div className="text-xl font-bold">
                          {filteredTrades.length}
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <DollarSign className="w-3 h-3" />
                          <span className="text-xs">Total Volume</span>
                        </div>
                        <div className="text-xl font-bold">
                          $
                          {filteredTrades
                            .reduce((sum, t) => sum + t.total_value, 0)
                            .toFixed(0)}
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-xs">Buy Orders</span>
                        </div>
                        <div className="text-xl font-bold text-green-500">
                          {
                            filteredTrades.filter((t) => t.trade_type === 'buy')
                              .length
                          }
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <TrendingDown className="w-3 h-3" />
                          <span className="text-xs">Sell Orders</span>
                        </div>
                        <div className="text-xl font-bold text-red-500">
                          {
                            filteredTrades.filter(
                              (t) => t.trade_type === 'sell',
                            ).length
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        {/* Scrollable Content Area */}
        <CardContent className="flex-1 min-h-0   h-[calc(100vh-300px)] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading trade history...
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No trades found matching your filters
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedTrades).map(([dateLabel, dateTrades]) => (
                <div key={dateLabel}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-sm font-semibold text-foreground">
                      {dateLabel}
                    </div>
                    <div className="flex-1 h-px bg-border" />
                    <div className="text-xs text-muted-foreground">
                      {dateTrades.length} trade
                      {dateTrades.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Trades for this date */}
                  <div className="space-y-3">
                    {dateTrades.map((trade) => (
                      <div
                        key={trade.id}
                        onClick={() => onSelectTrade(trade)}
                        className={`relative flex gap-4 group rounded-lg p-3 transition-colors cursor-pointer ${
                          selectedTrade?.id === trade.id
                            ? 'bg-primary/10 border-2 border-primary/20'
                            : 'hover:bg-muted/30 border-2 border-transparent'
                        }`}
                      >
                        {/* Timeline Connector */}
                        <div className="flex flex-col items-center pt-1">
                          <div
                            className={`w-3 h-3 rounded-full border-2 ${
                              trade.trade_type === 'buy'
                                ? 'bg-green-500 border-green-500'
                                : 'bg-red-500 border-red-500'
                            }`}
                          />
                          <div className="w-0.5 flex-1 bg-border mt-2" />
                        </div>

                        {/* Trade Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="text-xs text-muted-foreground min-w-[70px]">
                                {trade.time_label}
                              </div>

                              <div
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  trade.trade_type === 'buy'
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                }`}
                              >
                                {trade.trade_type.toUpperCase()}
                              </div>

                              <div className="text-sm font-semibold">
                                {trade.symbol}
                              </div>

                              <div
                                className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(trade.status)}`}
                              >
                                {trade.status}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-semibold">
                                {trade.quantity} shares @ $
                                {trade.price.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Total: ${trade.total_value.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {trade.trigger_reason && (
                            <div className="text-xs text-muted-foreground mb-2">
                              <span className="font-medium">Trigger:</span>{' '}
                              {trade.trigger_reason}
                            </div>
                          )}

                          {trade.narrative_context && (
                            <div className="bg-muted/50 rounded-lg p-2 mt-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">
                                  Narrative Context
                                </span>
                                <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                  {trade.narrative_context.credibility}/10
                                  credibility
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mb-1">
                                {getPlatformIcon(
                                  trade.narrative_context.platform,
                                )}{' '}
                                <span className="text-primary font-medium">
                                  {trade.narrative_context.author}
                                </span>{' '}
                                on {trade.narrative_context.platform}
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">
                                {trade.narrative_context.summary}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Order type: {trade.order_type}</span>
                            <span>•</span>
                            <span>ID: {trade.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Click outside to close dropdowns */}
      {(showFilters || showStats) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowFilters(false);
            setShowStats(false);
          }}
        />
      )}
    </div>
  );
}
