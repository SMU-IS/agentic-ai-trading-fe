"use client"

import { useState } from "react"
import { Activity } from "lucide-react"

const generateDots = () => {
  const dots = []
  const rows = 14
  const cols = 14
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      dots.push({
        id: `${i}-${j}`,
        top: `${(i / rows) * 150}%`,
        left: `${(j / cols) * 150}%`,
        delay: Math.random() * 10,
        duration: 4 + Math.random() * 2,
      })
    }
  }
  return dots
}

export default function EmptyState() {
  const [dots] = useState(() => generateDots())

  return (
    <div className="h-full flex items-center justify-center rounded-xl overflow-hidden relative bg-teal-900/10 border">
      <div className="absolute inset-0">
        {dots.map((dot) => (
          <div
            key={dot.id}
            className="absolute w-1 h-1 rounded-full bg-muted/30"
            style={{
              top: dot.top,
              left: dot.left,
              animation: `spec-dot-pulse ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
            }}
          />
        ))}
      </div>
      <div className="border w-80 bg-teal-900/20 rounded-full z-10 p-4 flex items-center">
        <Activity className="w-8 h-8 text-teal-900 mx-4" />
        <div className="flex-1 items-start text-left">
          <h2 className="text-xs font-bold text-foreground">
            View trade analysis
          </h2>
          <p className="text-xs text-foreground">
            Click on any trade from the left to view detailed analysis
          </p>
        </div>
      </div>
      <style jsx>{`
        @keyframes spec-dot-pulse {
          0%,
          100% {
            background-color: rgb(148 163 184 / 0.1);
            transform: scale(1);
          }
          50% {
            background-color: rgb(14, 108, 97);
            transform: scale(1.5);
          }
        }
      `}</style>
    </div>
  )
}
