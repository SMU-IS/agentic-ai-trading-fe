"use client"

import AskAIDemo from "@/components/portfolio/chat/AskAIDemo"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useState } from "react"

export default function AskAIDemoTrigger() {
  const [showAskAI, setShowAskAI] = useState(false)

  return (
    <>
      {/* Floating Ask AI button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          disabled={showAskAI}
          className={`h-10 bg-background text-foreground relative group transition-all duration-300 rounded-full hover:bg-muted shadow-lg ${
            showAskAI ? "opacity-30 scale-95" : "opacity-100 scale-100"
          }`}
          onClick={() => setShowAskAI(true)}
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
          <span className="hidden sm:inline ml-1">Try AskAI</span>
        </Button>
      </div>

      <AskAIDemo open={showAskAI} onOpenChange={(open) => setShowAskAI(open)} />
    </>
  )
}
