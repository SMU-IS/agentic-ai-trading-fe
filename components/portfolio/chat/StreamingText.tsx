"use client"

import { useState, useEffect } from "react"
import { MarkdownRenderer } from "./MarkdownRenderer"

interface StreamingTextProps {
  text: string
  isStreaming?: boolean
  speed?: number
  className?: string
}

export default function StreamingText({
  text,
  isStreaming = false,
  speed = 20,
  className,
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (text !== displayedText + text.slice(currentIndex)) {
      setDisplayedText("")
      setCurrentIndex(0)
    }
  }, [text])

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, text, speed])

  return (
    <div className={className}>
      <MarkdownRenderer content={displayedText} />
      {isStreaming && currentIndex < text.length && (
        <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-teal-400" />
      )}
    </div>
  )
}
