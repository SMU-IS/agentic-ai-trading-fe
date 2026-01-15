// lib/data.ts (includes types)

export interface Stock {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  change: number;
  changePercent: number;
}

export interface PurchaseHistory {
  date: string;
  shares: number;
  pricePerShare: number;
}

export interface StockWithHistory extends Stock {
  purchaseHistory: PurchaseHistory[];
}

export const mockPortfolioWithHistory: StockWithHistory[] = [
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

export const generatePerformanceData = () => {
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

export const mockPredictions = [
  {
    id: '1',
    question: 'AAPL price end of Q1 2026?',
    volume: '$12.3M vol.',
    options: [
      { label: 'Above $185', probability: 62.0, change: 2.4 },
      { label: '$175-$185', probability: 28.0, change: -1.2 },
      { label: 'Below $175', probability: 10.0, change: -1.2 },
    ],
    summary:
      "Apple's stock shows strong momentum heading into Q1 earnings with analysts projecting continued growth from services revenue and iPhone 17 pre-orders exceeding expectations.",
    sources: 5,
    sourceIcons: ['🍎', '📊', '💹'],
    timeAgo: '2 hr. ago',
    polymarketCount: 3,
    category: 'Earnings',
    relatedSymbols: ['AAPL'],
  },
  {
    id: '2',
    question: 'NVDA largest market cap by March?',
    volume: '$8.7M vol.',
    options: [
      { label: 'NVIDIA', probability: 78.0, change: 4.2 },
      { label: 'Apple', probability: 15.0, change: -2.8 },
      { label: 'Microsoft', probability: 7.0, change: -1.4 },
    ],
    summary:
      "NVIDIA continues to dominate AI chip market with 78% probability of becoming the world's largest company by market cap, driven by unprecedented demand for H100 and B200 chips.",
    sources: 4,
    sourceIcons: ['🟢', '📈', '🤖'],
    timeAgo: '4 hr. ago',
    polymarketCount: 6,
    category: 'Tech',
    relatedSymbols: ['NVDA', 'AAPL', 'MSFT'],
  },
  {
    id: '3',
    question: 'Fed rate decision January 2026?',
    volume: '$45.2M vol.',
    options: [
      { label: 'No change', probability: 94.0, change: 1.3 },
      { label: '25 bps cut', probability: 5.5, change: -0.8 },
      { label: '25 bps hike', probability: 0.5, change: -0.5 },
    ],
    summary:
      "The Fed's January meeting is expected to hold rates steady with 94% probability as inflation remains above target and labor market shows resilience despite recent cooling.",
    sources: 6,
    sourceIcons: ['🏛️', '📊', '💵'],
    timeAgo: '1 hr. ago',
    polymarketCount: 8,
    category: 'Economy',
    relatedSymbols: [],
  },
  {
    id: '4',
    question: 'TSLA deliveries beat Q1 estimates?',
    volume: '$5.4M vol.',
    options: [
      { label: 'Beat estimates', probability: 45.0, change: 3.2 },
      { label: 'Meet estimates', probability: 35.0, change: -1.5 },
      { label: 'Miss estimates', probability: 20.0, change: -1.7 },
    ],
    summary:
      "Tesla's Q1 delivery expectations are divided with Robotaxi expansion boosting sentiment but competition from Chinese EVs creating uncertainty in key markets.",
    sources: 4,
    sourceIcons: ['🚗', '⚡', '📉'],
    timeAgo: '6 hr. ago',
    polymarketCount: 2,
    category: 'Earnings',
    relatedSymbols: ['TSLA'],
  },
  {
    id: '5',
    question: 'GOOGL AI revenue growth 2026?',
    volume: '$3.8M vol.',
    options: [
      { label: '>50% growth', probability: 52.0, change: 5.1 },
      { label: '25-50% growth', probability: 38.0, change: -2.3 },
      { label: '<25% growth', probability: 10.0, change: -2.8 },
    ],
    summary:
      "Google's Gemini AI platform adoption accelerates with enterprise customers, positioning cloud division for significant revenue growth despite competitive pressure from Microsoft.",
    sources: 3,
    sourceIcons: ['🔍', '🤖', '☁️'],
    timeAgo: '3 hr. ago',
    polymarketCount: 4,
    category: 'Tech',
    relatedSymbols: ['GOOGL'],
  },
  {
    id: '6',
    question: 'AMZN AWS market share end 2026?',
    volume: '$2.1M vol.',
    options: [
      { label: '>32%', probability: 58.0, change: 1.8 },
      { label: '30-32%', probability: 32.0, change: -0.9 },
      { label: '<30%', probability: 10.0, change: -0.9 },
    ],
    summary:
      'Amazon Web Services maintains cloud leadership with strong enterprise AI workload growth, though Azure continues to close the gap in key verticals.',
    sources: 4,
    sourceIcons: ['☁️', '📊', '🏢'],
    timeAgo: '5 hr. ago',
    polymarketCount: 3,
    category: 'Tech',
    relatedSymbols: ['AMZN'],
  },
];
