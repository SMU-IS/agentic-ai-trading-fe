'use client';

import { useState } from 'react';
import { mockPortfolioWithHistory } from '@/lib/data'; // Import from shared file
import { StockWithHistory } from '@/lib/types';
import SummaryCards from './SummaryCards';
import PerformanceChart from './PerformanceChart';
import HoldingsTable from './HoldingsTable';
import StockHistoryModal from './StockHistoryModal';

export default function PortfolioTab() {
  const [selectedStock, setSelectedStock] = useState<StockWithHistory | null>(
    null
  );

  // Calculate summary stats here to pass down
  const totalValue = mockPortfolioWithHistory.reduce(
    (sum, s) => sum + s.shares * s.currentPrice,
    0
  );
  const totalCost = mockPortfolioWithHistory.reduce(
    (sum, s) => sum + s.shares * s.avgPrice,
    0
  );
  const totalGain = totalValue - totalCost;
  const todayChange = mockPortfolioWithHistory.reduce(
    (sum, s) => sum + s.shares * s.change,
    0
  );

  return (
    <>
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-semibold mb-6">
          Your Portfolio
        </h1>
        <SummaryCards
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
          stocks={mockPortfolioWithHistory}
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
