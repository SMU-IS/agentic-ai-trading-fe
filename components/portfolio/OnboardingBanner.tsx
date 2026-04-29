"use client"

import { useState } from "react"
import { KeyRound, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OnboardingBannerProps {
  onOpenGuide: () => void
}

export default function OnboardingBanner({ onOpenGuide }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="border-b border-teal-500/30 bg-teal-500/10 px-4 py-3 sm:px-6">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-teal-500/20 p-1.5 shrink-0">
            <KeyRound className="h-4 w-4 text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Welcome! Let&apos;s get you set up 🎉
            </p>
            <p className="text-xs text-muted-foreground">
              Connect your Alpaca API key to start trading and viewing your
              portfolio.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={onOpenGuide}
            className="h-8 bg-teal-600 hover:bg-teal-700 text-white text-xs"
          >
            Connect Alpaca API Key
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
