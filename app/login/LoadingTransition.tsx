"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface LoadingTransitionProps {
  isLoading: boolean
  onComplete?: () => void
}

const loadingStages = [
  "thinking",
  "reading news",
  "consolidating trades",
  "preparing your portfolio",
]

export default function LoadingTransition({
  isLoading,
  onComplete,
}: LoadingTransitionProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [showFinalText, setShowFinalText] = useState(false)

  useEffect(() => {
    if (!isLoading) return

    // Progress through stages
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= loadingStages.length - 1) {
          clearInterval(stageInterval)
          // Show final text after last stage
          setTimeout(() => {
            setShowFinalText(true)
            setTimeout(() => onComplete?.(), 2000) // Wait 2s before completing
          }, 3000)
          return prev
        }
        return prev + 1
      })
    }, 3000) // 3 seconds per stage

    return () => clearInterval(stageInterval)
  }, [isLoading, onComplete])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Animated teal illumination background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute h-[500px] w-[500px] rounded-full bg-teal-500/30 blur-[120px]"
          animate={{
            x: ["-20%", "120%", "-20%"],
            y: ["-20%", "100%", "-20%"],
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute h-[400px] w-[400px] rounded-full bg-teal-400/40 blur-[100px]"
          animate={{
            x: ["100%", "-20%", "100%"],
            y: ["80%", "-10%", "80%"],
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center">
        {!showFinalText ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative"
              style={{ perspective: "1000px" }}
            >
              <h1 className="text-4xl font-semibold whitespace-nowrap">
                {loadingStages[currentStage].split("").map((char, index) => (
                  <motion.span
                    key={`${currentStage}-${index}`}
                    className="inline-block"
                    animate={{
                      color: [
                        "rgb(255, 255, 255)",
                        "rgb(20, 184, 166)",
                        "rgb(255, 255, 255)",
                      ],
                      textShadow: [
                        "0 0 0px rgba(20, 184, 166, 0)",
                        "0 0 20px rgba(20, 184, 166, 1), 0 0 40px rgba(20, 184, 166, 0.5)",
                        "0 0 0px rgba(20, 184, 166, 0)",
                      ],
                    }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.08,
                      repeat: Infinity,
                      repeatDelay:
                        3 - loadingStages[currentStage].length * 0.08,
                      ease: "easeInOut",
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </h1>
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-6xl font-bold text-foreground">Agent M.</h1>
          </motion.div>
        )}
      </div>
    </div>
  )
}
