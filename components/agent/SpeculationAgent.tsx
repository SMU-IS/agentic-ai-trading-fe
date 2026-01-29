'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AskAI from '../portfolio/chat/AskAI';

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

interface SpeculationAgentProps {
  selectedTrade: TradeEvent | null;
}

const generateDots = () => {
  const dots = [];
  const rows = 14;
  const cols = 14;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      dots.push({
        id: `${i}-${j}`,
        top: `${(i / rows) * 150}%`,
        left: `${(j / cols) * 150}%`,
        delay: Math.random() * 10,
        duration: 4 + Math.random() * 2,
      });
    }
  }

  return dots;
};

export default function SpeculationAgent({
  selectedTrade,
}: SpeculationAgentProps) {
  const [dots] = useState(() => generateDots());

  const [showAskAI, setShowAskAI] = useState(false);
  const [askAIData, setAskAIData] = useState<any>(null);

  // NEW: reset AskAI state when user clicks a different trade
  useEffect(() => {
    setShowAskAI(false);
    setAskAIData(null);
  }, [selectedTrade?.id]);

  // NEW: build context payload for AskAI (live data from selectedTrade)
  const askAIContext = useMemo(() => {
    if (!selectedTrade) return null;

    return {
      type: 'trade_analysis',
      trade: {
        id: selectedTrade.id,
        symbol: selectedTrade.symbol,
        side: selectedTrade.trade_type,
        status: selectedTrade.status,
        order_type: selectedTrade.order_type,
        timestamp: selectedTrade.timestamp,
        date_label: selectedTrade.date_label,
        time_label: selectedTrade.time_label,
        quantity: selectedTrade.quantity,
        price: selectedTrade.price,
        total_value: selectedTrade.total_value,
      },
      trigger_reason: selectedTrade.trigger_reason ?? null,
      narrative_context: selectedTrade.narrative_context ?? null,
      // add any other fields your AskAI expects
    };
  }, [selectedTrade]);

  // NEW: the button click handler that opens AskAI + sets context
  const handleAskAIClick = () => {
    setAskAIData(askAIContext);
    setShowAskAI(true);
  };

  if (!selectedTrade) {
    return (
      <div className="h-full flex items-center justify-center rounded-xl overflow-hidden relative bg-teal-900/10 border">
        <div className="absolute inset-0">
          {dots.map((dot) => (
            <div
              key={dot.id}
              className="absolute w-1 h-1 rounded-full bg-muted/30"
              style={{
                top: dot.top,
                left: dot.left,
                animation: `spec-dot-pulse ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="border w-80 bg-teal-900/20 rounded-full z-10 p-4 flex items-center">
          <Activity className="w-8 h-8 text-teal-900 mx-4" />
          <div className="flex-1 items-start text-left">
            <h2 className="text-xs font-semibold text-foreground">
              View trade analysis
            </h2>
            <p className="text-xs text-muted-foreground">
              Click on any trade from the left to view detailed analysis
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes spec-dot-pulse {
            0%,
            100% {
              background-color: rgb(148 163 184 / 0.1);
              transform: scale(1);
            }
            50% {
              background-color: rgb(14, 108, 97);
              transform: scale(1.5);
            }
          }
        `}</style>
      </div>
    );
  }

  // Mock current price (you can enhance this with real-time data later)
  const currentPrice = selectedTrade.price * (1 + (Math.random() - 0.5) * 0.05);
  const pnlUsd = (currentPrice - selectedTrade.price) * selectedTrade.quantity;
  const pnlPercent =
    ((currentPrice - selectedTrade.price) / selectedTrade.price) * 100;

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

  return (
    <div className="h-full flex flex-col overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold flex items-center">
            <Activity className="w-6 h-6 text-primary mr-2" />
            Trade Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed breakdown of selected trade
          </p>
        </div>
      </div>

      {/* Trade Details Card - scrollable content */}
      <Card className="bg-card border-border flex-shrink-0 mt-4 h-[calc(100vh-184px)] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{selectedTrade.symbol}</span>
              <div
                className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedTrade.trade_type === 'buy'
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}
              >
                {selectedTrade.trade_type.toUpperCase()}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedTrade.date_label} at {selectedTrade.time_label}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Status</div>
              <div
                className={`text-lg font-semibold ${
                  selectedTrade.status === 'filled'
                    ? 'text-green-500'
                    : 'text-yellow-500'
                }`}
              >
                {selectedTrade.status.toUpperCase()}
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Trade Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Entry Price
              </div>
              <div className="text-2xl font-bold">
                ${selectedTrade.price.toFixed(2)}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">Quantity</div>
              <div className="text-2xl font-bold">
                {selectedTrade.quantity} shares
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Total Value
              </div>
              <div className="text-2xl font-bold">
                ${selectedTrade.total_value.toFixed(2)}
              </div>
            </div>
          </div>

          {selectedTrade.trade_type === 'buy' && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Current Performance</h3>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {pnlPercent >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {pnlPercent >= 0 ? '+' : ''}
                  {pnlPercent.toFixed(2)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Current Price
                  </div>
                  <div className="text-xl font-bold">
                    ${currentPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Unrealized P/L
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      pnlUsd >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {pnlUsd >= 0 ? '+' : ''}${pnlUsd.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trigger Reason */}
          {selectedTrade.trigger_reason && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Trade Trigger
                </div>

                {/* NEW: AskAI button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={handleAskAIClick}
                >
                  <Sparkles className="w-3 h-3 mr-2" />
                  Ask AI
                </Button>

                {/* Keep AskAI mounted here so it can open as a modal/dialog */}
                <AskAI
                  open={showAskAI}
                  onOpenChange={(open) => {
                    setShowAskAI(open);
                    if (!open) setAskAIData(null);
                  }}
                  contextData={askAIData}
                />
              </div>

              <p className="text-sm text-foreground">
                {selectedTrade.trigger_reason}
              </p>
            </div>
          )}

          {selectedTrade.narrative_context && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="w-4 h-4 text-primary" />
                Narrative Context
                <span className="ml-auto px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                  {selectedTrade.narrative_context.credibility}/10 credibility
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {getPlatformIcon(selectedTrade.narrative_context.platform)}
                </span>
                <span>
                  Post by{' '}
                  <span className="text-primary font-medium">
                    {selectedTrade.narrative_context.author}
                  </span>{' '}
                  on {selectedTrade.narrative_context.platform}
                </span>
              </div>

              <p className="text-sm text-foreground leading-relaxed">
                "{selectedTrade.narrative_context.summary}"
              </p>
            </div>
          )}

          {/* Order Details */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-3">Order Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Order Type:</span>
                <span className="ml-2 font-medium">
                  {selectedTrade.order_type}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Order ID:</span>
                <span className="ml-2 font-mono text-xs">
                  {selectedTrade.id.slice(0, 16)}...
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
