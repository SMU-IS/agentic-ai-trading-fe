'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, LogOut, Plus, Wallet } from 'lucide-react';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

interface Stock {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  change: number;
  changePercent: number;
}

interface PurchaseHistory {
  date: string;
  shares: number;
  pricePerShare: number;
}

interface StockWithHistory extends Stock {
  purchaseHistory: PurchaseHistory[];
}

const mockPortfolioWithHistory: StockWithHistory[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    shares: 50,
    avgPrice: 145.0,
    currentPrice: 178.72,
    change: 2.34,
    changePercent: 1.32,
    purchaseHistory: [
      { date: '2023-01-15', shares: 20, pricePerShare: 135.5 },
      { date: '2023-06-22', shares: 15, pricePerShare: 148.0 },
      { date: '2024-02-10', shares: 15, pricePerShare: 155.25 },
    ],
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    shares: 20,
    avgPrice: 120.0,
    currentPrice: 141.8,
    change: -1.2,
    changePercent: -0.84,
    purchaseHistory: [
      { date: '2023-03-08', shares: 10, pricePerShare: 105.0 },
      { date: '2023-11-20', shares: 10, pricePerShare: 135.0 },
    ],
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    shares: 35,
    avgPrice: 280.0,
    currentPrice: 378.91,
    change: 4.56,
    changePercent: 1.22,
    purchaseHistory: [
      { date: '2022-12-05', shares: 20, pricePerShare: 250.0 },
      { date: '2023-08-14', shares: 15, pricePerShare: 320.0 },
    ],
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    shares: 15,
    avgPrice: 450.0,
    currentPrice: 721.28,
    change: 12.45,
    changePercent: 1.76,
    purchaseHistory: [
      { date: '2023-04-18', shares: 5, pricePerShare: 280.0 },
      { date: '2023-09-30', shares: 5, pricePerShare: 450.0 },
      { date: '2024-01-05', shares: 5, pricePerShare: 620.0 },
    ],
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    shares: 25,
    avgPrice: 200.0,
    currentPrice: 248.5,
    change: -3.8,
    changePercent: -1.5,
    purchaseHistory: [
      { date: '2023-02-28', shares: 15, pricePerShare: 185.0 },
      { date: '2023-07-12', shares: 10, pricePerShare: 222.5 },
    ],
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    shares: 40,
    avgPrice: 130.0,
    currentPrice: 178.25,
    change: 1.89,
    changePercent: 1.07,
    purchaseHistory: [
      { date: '2023-05-03', shares: 25, pricePerShare: 115.0 },
      { date: '2024-03-15', shares: 15, pricePerShare: 155.0 },
    ],
  },
];

const generatePerformanceData = () => {
  const data = [];
  const startDate = new Date('2025-05-01');
  const endDate = new Date('2026-04-01');
  let value = 31.0;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 3)) {
    // Random walk with slight upward trend
    const change = (Math.random() - 0.48) * 1.5;
    value = Math.max(28, Math.min(42, value + change));

    // Add extra boost in recent months
    if (d > new Date('2026-02-01')) {
      value += Math.random() * 0.3;
    }

    data.push({
      date: new Date(d).toISOString(),
      value: Number.parseFloat(value.toFixed(2)),
    });
  }
  return data;
};

const performanceData = generatePerformanceData();

type TimePeriod = 'Monthly' | 'Quarterly' | 'Annually';

export default function PortfolioPage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [selectedStock, setSelectedStock] = useState<StockWithHistory | null>(
    null
  );
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('Monthly');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalValue = mockPortfolioWithHistory.reduce(
    (sum, stock) => sum + stock.shares * stock.currentPrice,
    0
  );
  const totalCost = mockPortfolioWithHistory.reduce(
    (sum, stock) => sum + stock.shares * stock.avgPrice,
    0
  );
  const totalGain = totalValue - totalCost;
  const totalGainPercent = (totalGain / totalCost) * 100;
  const todayChange = mockPortfolioWithHistory.reduce(
    (sum, stock) => sum + stock.shares * stock.change,
    0
  );

  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  const getFilteredData = () => {
    const now = new Date('2026-04-01');
    let startDate: Date;

    switch (timePeriod) {
      case 'Monthly':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 12);
        break;
      case 'Quarterly':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'Annually':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date('2025-05-01');
    }

    return performanceData.filter((item) => new Date(item.date) >= startDate);
  };

  const formatXAxisDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();

    // Show year for January or first data point
    if (date.getMonth() === 0) {
      return year.toString();
    }
    return `${month} '${year.toString().slice(-2)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-foreground text-xl font-semibold">
              Agent M
            </span>
            <span className="text-muted-foreground text-sm">Portfolio</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm hidden sm:block">
              Welcome, <span className="text-foreground">{user.username}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Portfolio Summary */}
        <div className="mb-8">
          <h1 className="text-foreground text-3xl font-semibold mb-6">
            Your Portfolio
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Total Value
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
            </Card>

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
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Portfolio Performance Chart */}
        <div className="mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-foreground text-xl font-semibold">
                  Portfolio Performance
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Here is your performance stats of each month
                </CardDescription>
              </div>
              <div className="flex items-center rounded-lg border border-border overflow-hidden">
                {(['Monthly', 'Quarterly', 'Annually'] as TimePeriod[]).map(
                  (period) => (
                    <button
                      key={period}
                      onClick={() => setTimePeriod(period)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        timePeriod === period
                          ? 'bg-card text-foreground'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {period}
                    </button>
                  )
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ChartContainer
                config={{
                  value: {
                    label: 'Portfolio Value',
                    color: 'hsl(221, 83%, 53%)',
                  },
                }}
                className="h-[350px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={getFilteredData()}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="portfolioGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="hsl(221, 83%, 53%)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="hsl(221, 83%, 53%)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatXAxisDate}
                      tick={{
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 12,
                      }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={50}
                    />
                    <YAxis
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tickFormatter={(val) => val.toFixed(2)}
                      tick={{
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 12,
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                      labelStyle={{
                        color: 'hsl(var(--foreground))',
                        fontWeight: 500,
                        marginBottom: 4,
                      }}
                      itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      formatter={(value: number) => [
                        `$${value.toFixed(2)}K`,
                        'Value',
                      ]}
                      labelFormatter={(label) =>
                        new Date(label).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      }
                    />
                    <Area
                      type="linear"
                      dataKey="value"
                      stroke="hsl(221, 83%, 53%)"
                      strokeWidth={2}
                      fill="url(#portfolioGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Holdings */}
        <div>
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
                  {mockPortfolioWithHistory.map((stock) => {
                    const value = stock.shares * stock.currentPrice;
                    const cost = stock.shares * stock.avgPrice;
                    const gain = value - cost;
                    const gainPercent = (gain / cost) * 100;

                    return (
                      <tr
                        key={stock.symbol}
                        onClick={() => setSelectedStock(stock)}
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
                              stock.change >= 0
                                ? 'text-primary'
                                : 'text-red-500'
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
                            className={
                              gain >= 0 ? 'text-primary' : 'text-red-500'
                            }
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
        </div>
      </main>

      {/* Purchase History Modal */}
      <Dialog
        open={!!selectedStock}
        onOpenChange={(open) => !open && setSelectedStock(null)}
      >
        <DialogContent className="sm:max-w-[600px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-3">
              <span className="text-2xl font-semibold">
                {selectedStock?.symbol}
              </span>
              <span className="text-muted-foreground font-normal text-base">
                {selectedStock?.name}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <h3 className="text-foreground font-medium mb-3">
              Purchase History
            </h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-muted-foreground text-sm font-medium px-4 py-3">
                      Date
                    </th>
                    <th className="text-right text-muted-foreground text-sm font-medium px-4 py-3">
                      Shares
                    </th>
                    <th className="text-right text-muted-foreground text-sm font-medium px-4 py-3">
                      Price
                    </th>
                    <th className="text-right text-muted-foreground text-sm font-medium px-4 py-3">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStock?.purchaseHistory.map((purchase, index) => (
                    <tr
                      key={index}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 text-foreground">
                        {new Date(purchase.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {purchase.shares}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        ${purchase.pricePerShare.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        $
                        {(
                          purchase.shares * purchase.pricePerShare
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30">
                    <td className="px-4 py-3 text-foreground font-medium">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right text-foreground font-medium">
                      {selectedStock?.shares}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-sm">
                      Avg: ${selectedStock?.avgPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground font-medium">
                      $
                      {selectedStock
                        ? (
                            selectedStock.shares * selectedStock.avgPrice
                          ).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })
                        : '0.00'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Current Value Summary */}
            {selectedStock && (
              <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Value</span>
                  <span className="text-foreground font-semibold">
                    $
                    {(
                      selectedStock.shares * selectedStock.currentPrice
                    ).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-muted-foreground">Total Gain/Loss</span>
                  {(() => {
                    const currentVal =
                      selectedStock.shares * selectedStock.currentPrice;
                    const costVal =
                      selectedStock.shares * selectedStock.avgPrice;
                    const gainVal = currentVal - costVal;
                    const gainPct = (gainVal / costVal) * 100;
                    return (
                      <span
                        className={`font-semibold ${
                          gainVal >= 0 ? 'text-primary' : 'text-red-500'
                        }`}
                      >
                        {gainVal >= 0 ? '+' : ''}$
                        {gainVal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        ({gainVal >= 0 ? '+' : ''}
                        {gainPct.toFixed(2)}%)
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
