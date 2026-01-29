"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Wallet, LineChart } from "lucide-react"
import PortfolioTab from "@/components/portfolio/PortfolioTab"
import PredictionsTab from "@/components/portfolio/ predictions/PredictionsTab"

export default function PortfolioPage() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"portfolio" | "predictions">(
    "portfolio",
  )

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [user, isLoading, router])

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    )
  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950/30 via-black to-teal-900/30">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="text-xl font-semibold text-foreground">
              Agent M
            </span>
            <div className="ml-4 flex items-center gap-1">
              <NavButton
                active={activeTab === "portfolio"}
                onClick={() => setActiveTab("portfolio")}
                icon={<Wallet className="mr-1.5 h-4 w-4" />}
                label="Portfolio"
              />
              <NavButton
                active={activeTab === "predictions"}
                onClick={() => setActiveTab("predictions")}
                icon={<LineChart className="mr-1.5 h-4 w-4" />}
                label="Predictions"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:block">
              Welcome, <span className="text-foreground">{user.username}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                signOut()
                router.push("/")
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {activeTab === "portfolio" ? <PortfolioTab /> : <PredictionsTab />}
      </main>
    </div>
  )
}

// Helper component for nav buttons
function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  )
}
