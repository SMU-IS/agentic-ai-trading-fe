'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { PredictionCard as PredictionType } from '@/lib/types';

interface PredictionCardProps {
  prediction: PredictionType;
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  return (
    <Card className="bg-card mb-4 m-3 border-border hover:border-muted-foreground/50 transition-colors">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-foreground font-medium text-base">
            {prediction.question}
          </h3>
          <span className="text-muted-foreground text-sm whitespace-nowrap ml-4 flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            {prediction.volume}
          </span>
        </div>

        {/* Options */}
        <div className="space-y-2 mb-4">
          {prediction.options.map((option, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {option.label}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-foreground font-medium">
                  {option.probability.toFixed(1)}%
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium ${
                    option.change >= 0
                      ? 'bg-primary/10 text-primary'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {option.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {option.change >= 0 ? '+' : ''}
                  {Math.abs(option.change).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {prediction.summary}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="flex -space-x-1">
                {prediction.sourceIcons.map((icon, idx) => (
                  <span
                    key={idx}
                    className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs"
                  >
                    {icon}
                  </span>
                ))}
              </span>
              <span className="ml-1">{prediction.sources} sources</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              {prediction.timeAgo}
            </span>
          </div>
          <span className="text-primary hover:underline cursor-pointer">
            +{prediction.polymarketCount} on Polymarket
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
