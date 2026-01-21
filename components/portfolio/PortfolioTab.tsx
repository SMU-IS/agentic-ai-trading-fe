'use client';

import { useEffect, useState } from 'react';
import SummaryCards from './SummaryCards';
import PerformanceChart from './PerformanceChart';
import HoldingsTable from './HoldingsTable';
import StockHistoryModal from './StockHistoryModal';
import { StockWithHistory } from '@/lib/types';

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

  useEffect(() => {
    async function fetchData() {
      try {
        // 1) Account (Total Value)
        const accountRes = await fetch(
          'http://localhost:8000/api/v1/trading/account',
        );
        if (!accountRes.ok) throw new Error('Failed to fetch account');
        const account: AccountResponse = await accountRes.json();
        setTotalValue(Number(account.portfolio_value));
        setCashValue(Number(account.cash));

        // 2) Positions (for gain/loss and today change)
        const posRes = await fetch(
          'http://localhost:8000/api/v1/trading/positions',
        );
        if (!posRes.ok) throw new Error('Failed to fetch positions');
        const posData: Position[] = await posRes.json();
        setPositions(posData);

        // Aggregate numbers
        let cost = 0;
        let gain = 0;
        let today = 0;

        for (const p of posData) {
          cost += Number(p.cost_basis); // total cost basis
          gain += Number(p.unrealized_pl); // total unrealized P&L (all‑time gain/loss)
          today += Number(p.unrealized_intraday_pl); // today's P&L
        }

        setTotalCost(cost);
        setTotalGain(gain);
        setTodayChange(today);
      } catch (e) {
        console.error(e);
      }
    }

    fetchData();
  }, []);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-semibold mb-6">
          Your Portfolio
        </h1>
        <SummaryCards
          cash={cashValue}
          totalValue={totalValue}
          totalGain={totalGain}
          totalCost={totalCost}
          todayChange={todayChange}
        />
      </div>

      <div className="mb-8">
        <PerformanceChart />
      </div>

      <div>
        <HoldingsTable
          stocks={positions as any}
          onSelectStock={setSelectedStock}
        />
      </div>

      <StockHistoryModal
        stock={selectedStock}
        open={!!selectedStock}
        onOpenChange={(open) => !open && setSelectedStock(null)}
      />
    </>
  );
}
