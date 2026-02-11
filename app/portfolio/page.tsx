"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Wallet, LineChart } from "lucide-react"
import PortfolioTab from "@/components/portfolio/PortfolioTab"
import PredictionsTab from "@/components/portfolio/predictions/PredictionsTab"
import { ModeToggle } from "@/components/mode-toggle"
import TradesTab from "@/components/trades/TradesTab"
import NotificationsDropdown from "@/components/notifications/Notifications"
import AnimatedBackground from "./AnimatedBackground"
import { motion } from "framer-motion"
import AgentFlowTab from "@/components/agentflow/AgentFlow"

export default function PortfolioPage() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get tab from URL or default to portfolio
  const [activeTab, setActiveTab] = useState<
    "portfolio" | "trades" | "predictions"
  >((searchParams.get("tab") as any) || "portfolio")

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [user, isLoading, router])

  // Update URL when tab changes
  const handleTabChange = (tab: "portfolio" | "trades" | "predictions") => {
    setActiveTab(tab)
    router.push(`?tab=${tab}`, { scroll: false })
  }

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="relative">
          {/* Outer rotating ring */}
          <motion.div
            className="h-24 w-24 rounded-full border-4 border-primary/20"
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Inner spinning arc */}
          <motion.div
            className="absolute inset-0 h-24 w-24 rounded-full border-4 border-transparent border-t-primary"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Center pulsing circle */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Text below */}
          <motion.p
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-lg font-medium text-foreground"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Agent M
          </motion.p>
        </div>
      </div>
    )
  if (!user) return null

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-xl font-semibold text-foreground">Agent M</span>

          {/* Centered nav buttons */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
            <NavButton
              active={activeTab === "portfolio"}
              onClick={() => handleTabChange("portfolio")}
              icon={<Wallet className="mr-1.5 h-4 w-4" />}
              label="Portfolio"
            />
            <NavButton
              active={activeTab === "trades"}
              onClick={() => handleTabChange("trades")}
              icon={<Wallet className="mr-1.5 h-4 w-4" />}
              label="Trades"
            />
            <NavButton
              active={activeTab === "predictions"}
              onClick={() => handleTabChange("predictions")}
              icon={<LineChart className="mr-1.5 h-4 w-4" />}
              label="Predictions"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* <span className="hidden text-sm text-muted-foreground sm:block">
              Welcome, <span className="text-foreground">{user.username}</span>
            </span> */}
            <ModeToggle />
            <NotificationsDropdown />
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
        {activeTab === "portfolio" && <PortfolioTab />}
        {activeTab === "trades" && <TradesTab />}
        {activeTab === "predictions" && <PredictionsTab />}
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
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  )
}
