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
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { generatePerformanceData } from '@/lib/data';

type TimePeriod = 'Monthly' | 'Quarterly' | 'Annually';

export default function PerformanceChart() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('Monthly');

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
    const performanceData = generatePerformanceData();

    return performanceData.filter((item) => new Date(item.date) >= startDate);
  };

  const formatXAxisDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();

    if (date.getMonth() === 0) {
      return year.toString();
    }
    return `${month} '${year.toString().slice(-2)}`;
  };

  return (
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
  );
}
