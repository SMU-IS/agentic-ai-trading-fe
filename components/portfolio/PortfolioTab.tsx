'use client';

import { StockWithHistory } from '@/lib/types';
import { useEffect, useState } from 'react';
import HoldingsTable from './HoldingsTable';
import PerformanceChart from './PerformanceChart';
import StockHistoryModal from './StockHistoryModal';
import SummaryCards from './SummaryCards';
import { getCompanyName } from '@/lib/tickerMap';

type AccountResponse = {
  cash: string;
  portfolio_value: string;
};

type Position = {
  symbol: string;
  qty: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_intraday_pl: string;
  current_price: string;
  change_today: string;
  side: 'long' | 'short';
};

export default function PortfolioTab() {
  const [selectedStock, setSelectedStock] = useState<StockWithHistory | null>(
    null,
  );
  const [cashValue, setCashValue] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalGain, setTotalGain] = useState<number>(0);
  const [todayChange, setTodayChange] = useState<number>(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradingAccStatus, setTradingAccStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // 1) Account (Total Value)
        const accountRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/account`,
        );
        if (!accountRes.ok) throw new Error('Failed to fetch account');
        const account: AccountResponse = await accountRes.json();
        setTotalValue(Number(account.portfolio_value));
        setCashValue(Number(account.cash));
        setTradingAccStatus(true);

        // 2) Positions (for gain/loss and today change)
        const posRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/trading/positions`,
        );
        if (!posRes.ok) throw new Error('Failed to fetch positions');
        const posData: Position[] = await posRes.json();
        setPositions(posData);

        // Aggregate numbers
        let cost = 0;
        let gain = 0;
        let today = 0;

        for (const p of posData) {
          cost += Number(p.cost_basis);
          gain += Number(p.unrealized_pl);
          today += Number(p.unrealized_intraday_pl);
        }

        setTotalCost(cost);
        setTotalGain(gain);
        setTodayChange(today);
      } catch (e) {
        console.error(e);
        setTradingAccStatus(false);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-foreground text-3xl font-semibold">
            Your Portfolio
          </h1>

          {loading ? (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-gray-600" />
              <div className="h-3 w-48 bg-gray-600 rounded" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  tradingAccStatus ? 'bg-teal-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <p
                className={`text-xs ${
                  tradingAccStatus ? 'text-teal-500' : 'text-red-500'
                }`}
              >
                {tradingAccStatus
                  ? 'Agent M is connected to Alpaca Trading'
                  : 'Alpaca Trading connection failed, please try again later'}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <SummaryCardsSkeleton />
        ) : (
          <SummaryCards
            cash={cashValue}
            totalValue={totalValue}
            totalGain={totalGain}
            totalCost={totalCost}
            todayChange={todayChange}
          />
        )}
      </div>

      <div className="mb-8">
        <PerformanceChart />
      </div>

      <div>
        {loading ? (
          <HoldingsTableSkeleton />
        ) : (
          <HoldingsTable
            stocks={positions.map((p) => ({
              ...p,
              name: getCompanyName(p.symbol), // Add name here
            }))}
            onSelectStock={setSelectedStock}
          />
        )}
      </div>

      <StockHistoryModal
        stock={selectedStock}
        open={!!selectedStock}
        onOpenChange={(open) => !open && setSelectedStock(null)}
      />
    </>
  );
}

// Summary Cards Skeleton
function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-lg p-4 animate-pulse"
        >
          <div className="h-4 w-24 bg-gray-700 rounded mb-3" />
          <div className="h-8 w-32 bg-gray-600 rounded mb-2" />
          <div className="h-3 w-20 bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

// Holdings Table Skeleton
function HoldingsTableSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="h-6 w-32 bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-7 gap-4 px-6 py-3 border-b border-border bg-muted/30">
        {[
          'Stock',
          'Shares',
          'Avg Price',
          'Current Price',
          'Market Value',
          'Gain/Loss',
          'Today',
        ].map((_, i) => (
          <div key={i} className="h-4 bg-gray-700 rounded animate-pulse" />
        ))}
      </div>

      {/* Table Rows */}
      {[1, 2, 3, 4, 5].map((row) => (
        <div
          key={row}
          className="grid grid-cols-7 gap-4 px-6 py-4 border-b border-border last:border-b-0 animate-pulse"
        >
          {/* Stock Symbol & Name */}
          <div className="space-y-2">
            <div className="h-5 w-16 bg-gray-600 rounded" />
            <div className="h-3 w-24 bg-gray-700 rounded" />
          </div>

          {/* Other columns */}
          {[1, 2, 3, 4, 5, 6].map((col) => (
            <div key={col} className="flex items-center">
              <div className="h-5 w-20 bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
