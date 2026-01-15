'use client';

import { Search, X } from 'lucide-react';
// import { predictionCategories } from '@/lib/data';

interface MarketFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  watchlistSymbols: string[];
  setWatchlistSymbols: (val: string[]) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
}

export default function MarketFilters({
  searchQuery,
  setSearchQuery,
  watchlistSymbols,
  setWatchlistSymbols,
  selectedCategory,
  setSelectedCategory,
}: MarketFiltersProps) {
  const addToWatchlist = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    if (!watchlistSymbols.includes(upperSymbol) && upperSymbol.length > 0) {
      setWatchlistSymbols([...watchlistSymbols, upperSymbol]);
    }
    setSearchQuery('');
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlistSymbols(watchlistSymbols.filter((s) => s !== symbol));
  };

  return (
    <>
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search prediction markets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.length > 0) {
              addToWatchlist(searchQuery);
            }
          }}
          className="w-full bg-muted/30 border border-border rounded-lg py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      {/* Watchlist Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {watchlistSymbols.map((symbol) => (
          <span
            key={symbol}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary/50 text-secondary-foreground text-sm font-medium rounded-full"
          >
            {symbol}
            <button
              onClick={() => removeFromWatchlist(symbol)}
              className="ml-1 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Category Buttons */}
      {/* <div className="flex flex-wrap gap-2">
        {predictionCategories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedCategory === category
                ? 'bg-foreground text-background border-foreground'
                : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground'
            }`}
          >
            {category}
          </button>
        ))}
      </div> */}
    </>
  );
}
