"use client"

import AgentFlowTab from "@/components/agentflow/AgentFlow"
import { ModeToggle } from "@/components/mode-toggle"
import NotificationsDropdown from "@/components/notifications/Notifications"
import AskAI from "@/components/portfolio/chat/AskAI"
import PortfolioTab from "@/components/portfolio/PortfolioTab"
import TradesTab from "@/components/trades/TradesTab"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { AnimatePresence, motion } from "framer-motion"
import { DatabaseZapIcon, LogOut, Menu, Sparkles, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import AnimatedBackground from "./AnimatedBackground"

// Loading component
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="relative flex items-center justify-center">
        <motion.p
          className="font-geist font-thin absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-lg font-medium text-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
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
}

const NAV_TABS = [
  { key: "portfolio", label: "Portfolio", icon: null },
  { key: "trades", label: "Trades", icon: null },
  {
    key: "agentflow",
    label: "AgentFlow",
    icon: <DatabaseZapIcon className="mr-1.5 h-4 w-4" />,
  },
] as const

type Tab = "portfolio" | "trades" | "agentflow"

// Component that uses useSearchParams
function PortfolioContent() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [askAISymbol, setAskAISymbol] = useState<string | null>(null)
  const [showAskAI, setShowAskAI] = useState(false)
  const [askAIData, setAskAIData] = useState<any>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) || "portfolio",
  )

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setMobileNavOpen(false)
    router.push(`?tab=${tab}`)
  }

  if (isLoading) return <LoadingScreen />
  if (!user) return null

  const activeLabel = NAV_TABS.find((t) => t.key === activeTab)?.label ?? "Menu"

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          {/* Logo */}
          <span className="font-geist font-thin text-xl text-foreground">
            Agent M
          </span>

          {/* ── Desktop nav (hidden on mobile) ── */}
          <div className="hidden md:absolute md:left-1/2 md:-translate-x-1/2 md:flex items-center gap-2">
            {NAV_TABS.map(({ key, label, icon }) => (
              <NavButton
                key={key}
                active={activeTab === key}
                onClick={() => handleTabChange(key)}
                icon={icon}
                label={label}
              />
            ))}
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              className="h-8 bg-background text-foreground relative group transition-all duration-300 rounded-full hover:bg-muted"
              onClick={() => {
                setAskAISymbol(null)
                setShowAskAI(true)
              }}
            >
              <span
                className="pointer-events-none absolute -inset-[2px] rounded-full animate-rotate-border"
                style={{
                  padding: "2px",
                  background:
                    "conic-gradient(from var(--angle, 0deg), #14b8a6, #0d9488, #00faea, #134e4a, #14b8a6)",
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  zIndex: -1,
                }}
              />
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">AskAI</span>
            </Button>

            <ModeToggle />
            <NotificationsDropdown />

            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
              onClick={async () => {
                try {
                  await signOut()
                  router.push("/")
                } catch {
                  router.push("/")
                }
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>

            {/* ── Mobile hamburger (visible on mobile only) ── */}
            <button
              className="md:hidden flex items-center justify-center rounded-md p-1.5 text-foreground hover:bg-muted transition-colors"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown nav ── */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              key="mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden md:hidden border-t border-border bg-background"
            >
              <div className="flex flex-col px-4 py-3 gap-1">
                {NAV_TABS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors w-full text-left ${
                      activeTab === key
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}

                {/* Sign out inside mobile menu */}
                <button
                  className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors w-full text-left mt-1 border-t border-border pt-3"
                  onClick={async () => {
                    try {
                      await signOut()
                      router.push("/")
                    } catch {
                      router.push("/")
                    }
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {activeTab === "portfolio" && <PortfolioTab />}
        {activeTab === "trades" && <TradesTab />}
        {activeTab === "agentflow" && <AgentFlowTab />}
      </main>

      {/* Ask AI bottom sheet */}
      <AskAI
        open={showAskAI}
        onOpenChange={(open) => {
          setShowAskAI(open)
          if (!open) setAskAIData(null)
        }}
        contextData={askAIData}
      />
    </div>
  )
}

// Main export with Suspense wrapper
export default function PortfolioPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PortfolioContent />
    </Suspense>
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
