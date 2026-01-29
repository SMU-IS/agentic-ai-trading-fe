'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryCardsProps {
  cash: number;
  totalValue: number;
  totalGain: number;
  totalCost: number;
  todayChange: number;
}

export default function SummaryCards({
  cash,
  totalValue,
  totalGain,
  totalCost,
  todayChange,
}: SummaryCardsProps) {
  const totalGainPercent = (totalGain / totalCost) * 100;
  const todayChangePercent = (todayChange / (totalValue - todayChange)) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Value Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Total Portfolio Value (USD)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground text-3xl font-semibold">
            $
            {totalValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </p>
        </CardContent>
      </Card>{' '}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Cash (USD)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground text-3xl font-semibold">
            $
            {cash.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </p>
        </CardContent>
      </Card>
      {/* Total Gain/Loss Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Total Gain/Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {totalGain >= 0 ? (
              <TrendingUp className="w-5 h-5 text-primary" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            <p
              className={`text-3xl font-semibold ${
                totalGain >= 0 ? 'text-primary' : 'text-red-500'
              }`}
            >
              {totalGain >= 0 ? '+' : ''}$
              {totalGain.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <p
            className={`text-sm ${
              totalGain >= 0 ? 'text-primary' : 'text-red-500'
            }`}
          >
            {totalGain >= 0 ? '+' : ''}
            {totalGainPercent.toFixed(2)}% all time
          </p>
        </CardContent>
      </Card>
      {/* Today's Change Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Today's Change
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {todayChange >= 0 ? (
              <TrendingUp className="w-5 h-5 text-primary" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            <p
              className={`text-3xl font-semibold ${
                todayChange >= 0 ? 'text-primary' : 'text-red-500'
              }`}
            >
              {todayChange >= 0 ? '+' : ''}$
              {todayChange.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <p
            className={`text-sm ${
              todayChange >= 0 ? 'text-primary' : 'text-red-500'
            }`}
          >
            {totalGain >= 0 ? '+' : ''}
            {todayChangePercent.toFixed(2)}% change
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
