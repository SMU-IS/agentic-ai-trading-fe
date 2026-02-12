"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"

interface LoadingTransitionProps {
  isLoading: boolean
  onComplete?: () => void
}

const loadingStages = [
  // "thinking",
  // "reading news",
  "consolidating trades",
  "preparing your portfolio",
]

export default function LoadingTransition({
  isLoading,
  onComplete,
}: LoadingTransitionProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [showFinalText, setShowFinalText] = useState(false)
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading) return

    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= loadingStages.length - 1) {
          clearInterval(stageInterval)
          setTimeout(() => {
            setShowFinalText(true)
            setTimeout(() => onComplete?.(), 2000)
          }, 1500)
          return prev
        }
        return prev + 1
      })
    }, 2000)

    return () => clearInterval(stageInterval)
  }, [isLoading, onComplete])

  if (!isLoading) return null

  // Determine base color based on theme
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark")
  const baseColor = isDark ? "255,255,255" : "0,0,0" // white for dark mode, black for light mode

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10"
          style={{ filter: "blur(120px)" }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10">
        {!showFinalText ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <motion.h1
                className="text-4xl font-semibold pb-1 -mb-1"
                style={{
                  background: `linear-gradient(90deg, rgba(${baseColor},0.6) 0%, rgba(${baseColor},0.6) 40%, rgba(45,212,191,0.9) 50%, rgba(${baseColor},0.6) 60%, rgba(${baseColor},0.6) 100%)`,
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                animate={{
                  backgroundPosition: ["100% 0%", "-100% 0%"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {loadingStages[currentStage]}
              </motion.h1>
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h1
              className="text-6xl font-geist font-thin pb-1 -mb-1"
              style={{
                background: `linear-gradient(90deg, rgba(${baseColor},1) 0%, rgba(${baseColor},1) 40%, rgba(45,212,191,0.8) 50%, rgba(${baseColor},1) 60%, rgba(${baseColor},1) 100%)`,
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              animate={{
                backgroundPosition: ["100% 0%", "-100% 0%"],
              }}
              transition={{
                duration: 1,
                ease: "easeInOut",
              }}
            >
              Agent M.
            </motion.h1>
          </motion.div>
        )}
      </div>
    </div>
  )
}
