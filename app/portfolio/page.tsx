"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Wallet,
  LineChart,
  Settings2,
  DatabaseZapIcon,
} from "lucide-react"
import PortfolioTab from "@/components/portfolio/PortfolioTab"
import PredictionsTab from "@/components/portfolio/predictions/PredictionsTab"
import { ModeToggle } from "@/components/mode-toggle"
import TradesTab from "@/components/trades/TradesTab"
import NotificationsDropdown from "@/components/notifications/Notifications"
import AnimatedBackground from "./AnimatedBackground"
import { motion } from "framer-motion"
import AgentFlowTab from "@/components/agentflow/AgentFlow"
import { FaRobot } from "react-icons/fa"

export default function PortfolioPage() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<
    "portfolio" | "trades" | "agentflow"
  >((searchParams.get("tab") as any) || "portfolio")

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  const handleTabChange = (tab: "portfolio" | "trades" | "agentflow") => {
    setActiveTab(tab)
    router.push(`?tab=${tab}`, { scroll: false })
  }

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Ripple circles */}
          {/* {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="absolute h-24 w-24 rounded-full border-4 border-primary"
              animate={{
                scale: [0, 2.5],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                delay: index * 0.6,
                ease: "easeOut",
              }}
            />
          ))} */}

          {/* Center dot */}
          {/* <motion.div
            className="h-4 w-4 rounded-full bg-primary"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
          /> */}

          {/* Text below */}
          <motion.p
            className="font-geist font-thin absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-lg font-medium text-foreground"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop",
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
          <span className="font-geist font-thin text-xl font-semibold text-foreground">
            Agent M
          </span>

          {/* Centered nav buttons */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <NavButton
              active={activeTab === "portfolio"}
              onClick={() => handleTabChange("portfolio")}
              label="Portfolio"
            />
            <NavButton
              active={activeTab === "trades"}
              onClick={() => handleTabChange("trades")}
              label="Trades"
            />
            <NavButton
              active={activeTab === "agentflow"}
              onClick={() => handleTabChange("agentflow")}
              icon={<DatabaseZapIcon className="mr-1.5 h-4 w-4" />}
              label="AgentFlow"
            />
          </div>

          <div className="flex items-center gap-4">
            <ModeToggle />
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await signOut()
                  router.push("/login")
                } catch (error) {
                  console.error("Sign out error:", error)
                  router.push("/login")
                }
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
        {activeTab === "agentflow" && <AgentFlowTab />}
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
