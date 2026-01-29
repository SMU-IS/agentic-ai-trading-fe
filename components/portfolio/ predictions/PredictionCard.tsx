'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import { PredictionCard as PredictionType } from '@/lib/types'

interface PredictionCardProps {
  prediction: PredictionType
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  return (
    <Card className="m-3 mb-4 border-border bg-card transition-colors hover:border-muted-foreground/50">
      <CardContent className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-base font-medium text-foreground">
            {prediction.question}
          </h3>
          <span className="ml-4 flex items-center gap-1 whitespace-nowrap text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            {prediction.volume}
          </span>
        </div>

        {/* Options */}
        <div className="mb-4 space-y-2">
          {prediction.options.map((option, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {option.label}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-medium text-foreground">
                  {option.probability.toFixed(1)}%
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-xs font-medium ${
                    option.change >= 0
                      ? 'bg-primary/10 text-primary'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {option.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {option.change >= 0 ? '+' : ''}
                  {Math.abs(option.change).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
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
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs"
                  >
                    {icon}
                  </span>
                ))}
              </span>
              <span className="ml-1">{prediction.sources} sources</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-muted-foreground" />
              {prediction.timeAgo}
            </span>
          </div>
          <span className="cursor-pointer text-primary hover:underline">
            +{prediction.polymarketCount} on Polymarket
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
