"use client"

import { accessToken } from "@/app/util/getAccessToken"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowUp, Square, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { motion, useAnimation } from "framer-motion"

function MarkdownStreamingContent({
  content,
  isStreaming,
}: {
  content: string
  isStreaming: boolean
}) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const animationFrameRef = useRef<number>()
  const lastUpdateRef = useRef<number>(0)

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(content)
      setCurrentIndex(content.length)
      return
    }
    if (currentIndex > content.length) {
      setCurrentIndex(0)
      setDisplayedText("")
    }
    // Streaming animation
    const speed = 30 // milliseconds per character

    const animate = (timestamp: number) => {
      if (lastUpdateRef.current === 0) {
        lastUpdateRef.current = timestamp
      }

      const elapsed = timestamp - lastUpdateRef.current

      if (elapsed >= speed && currentIndex < content.length) {
        const nextIndex = Math.min(currentIndex + 1, content.length)
        setDisplayedText(content.slice(0, nextIndex))
        setCurrentIndex(nextIndex)
        lastUpdateRef.current = timestamp
      }

      if (currentIndex < content.length) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [content, currentIndex, isStreaming])

  const parseMarkdown = (text: string) => {
    const parts: JSX.Element[] = []
    let buffer = ""
    let i = 0

    while (i < text.length) {
      // Check for bold: **text**
      if (text[i] === "*" && text[i + 1] === "*") {
        // Save any buffer text first
        if (buffer) {
          parts.push(<span key={`text-${parts.length}`}>{buffer}</span>)
          buffer = ""
        }
        // Find closing **
        let j = i + 2
        let boldText = ""
        let foundClosing = false

        while (j < text.length - 1) {
          if (text[j] === "*" && text[j + 1] === "*") {
            boldText = text.slice(i + 2, j)
            foundClosing = true
            j += 2
            break
          }
          j++
        }

        if (foundClosing) {
          parts.push(
            <strong key={`bold-${parts.length}`} className="font-semibold">
              {boldText}
            </strong>,
          )
          i = j
        } else {
          // No closing **, treat as regular text (still streaming)
          buffer += text.slice(i, j)
          i = j
        }
      }
      // Check for italic: *text* (single asterisk, not **)
      else if (
        text[i] === "*" &&
        text[i + 1] !== "*" &&
        (i === 0 || text[i - 1] !== "*")
      ) {
        if (buffer) {
          parts.push(<span key={`text-${parts.length}`}>{buffer}</span>)
          buffer = ""
        }

        let j = i + 1
        let italicText = ""
        let foundClosing = false

        while (j < text.length) {
          if (
            text[j] === "*" &&
            (j === text.length - 1 || text[j + 1] !== "*")
          ) {
            italicText = text.slice(i + 1, j)
            foundClosing = true
            j += 1
            break
          }
          j++
        }

        if (foundClosing) {
          parts.push(
            <em key={`italic-${parts.length}`} className="italic">
              {italicText}
            </em>,
          )
          i = j
        } else {
          buffer += text.slice(i, j)
          i = j
        }
      }
      // Check for inline code: `text`
      else if (text[i] === "`") {
        if (buffer) {
          parts.push(<span key={`text-${parts.length}`}>{buffer}</span>)
          buffer = ""
        }

        let j = i + 1
        let codeText = ""
        let foundClosing = false

        while (j < text.length) {
          if (text[j] === "`") {
            codeText = text.slice(i + 1, j)
            foundClosing = true
            j += 1
            break
          }
          j++
        }

        if (foundClosing) {
          parts.push(
            <code
              key={`code-${parts.length}`}
              className="rounded bg-muted px-1 py-0.5 font-mono text-xs"
            >
              {codeText}
            </code>,
          )
          i = j
        } else {
          buffer += text.slice(i, j)
          i = j
        }
      }
      // Check for newlines
      else if (text[i] === "\n") {
        if (buffer) {
          parts.push(<span key={`text-${parts.length}`}>{buffer}</span>)
          buffer = ""
        }
        parts.push(<br key={`br-${parts.length}`} />)
        i++
      }
      // Regular character
      else {
        buffer += text[i]
        i++
      }
    }

    // Add any remaining buffer
    if (buffer) {
      parts.push(<span key={`text-${parts.length}`}>{buffer}</span>)
    }

    return parts
  }

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {parseMarkdown(displayedText)}
      {isStreaming && <span className="animate-pulse">|</span>}
    </div>
  )
}

interface AskAIProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contextData?: any
}

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

export default function AskAI({ open, onOpenChange, contextData }: AskAIProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const hasAutoSentRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const scrollAnimationFrameRef = useRef<number>()

  const CHAT_URL = `${process.env.NEXT_PUBLIC_CHAT_API_URL}`

  // Aggressive auto-scroll that works during streaming
  const scrollToBottom = () => {
    const scroll = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight
      }
    }

    // Execute immediately
    scroll()

    // And also schedule for next frame to catch any rendering delays
    if (scrollAnimationFrameRef.current) {
      cancelAnimationFrame(scrollAnimationFrameRef.current)
    }
    scrollAnimationFrameRef.current = requestAnimationFrame(scroll)
  }

  // Trigger scroll on every message update
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Additional scroll trigger specifically for streaming content changes
  useEffect(() => {
    if (loading) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.isStreaming) {
        scrollToBottom()
      }
    }
  }, [messages, loading])

  useEffect(() => {
    if (!open) {
      hasAutoSentRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [open])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
      if (scrollAnimationFrameRef.current) {
        cancelAnimationFrame(scrollAnimationFrameRef.current)
      }
    }
  }, [open])

  const streamBackendResponse = async (
    userMessage: string,
    order_id: string | string[] | undefined,
    assistantMessageId: string,
    signal: AbortSignal,
  ) => {
    const shouldIncludeOrderId =
      order_id &&
      (typeof order_id === "string" ? order_id.length > 0 : order_id.length > 0)

    const response = await fetch(`${CHAT_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: userMessage,
        ...(shouldIncludeOrderId && { order_id }),
      }),
      signal: signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error("No response body")
    }

    let accumulatedContent = ""
    let buffer = ""
    let hasReceivedFirstToken = false

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const events = buffer.split("\n\n")
      buffer = events.pop() || ""

      for (const event of events) {
        if (!event.trim()) continue

        const lines = event.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)

            if (data.trim() === "[DONE]") {
              continue
            }

            try {
              const parsed = JSON.parse(data)

              if (parsed.error) {
                throw new Error(parsed.error)
              }

              const token = parsed.token || ""

              if (token) {
                if (!hasReceivedFirstToken) {
                  hasReceivedFirstToken = true
                }

                accumulatedContent += token

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: accumulatedContent,
                          isStreaming: true,
                        }
                      : msg,
                  ),
                )

                // Force scroll after each token
                scrollToBottom()
              }
            } catch (parseError) {
              if (data.trim() && data.trim() !== "[DONE]") {
                if (!hasReceivedFirstToken) {
                  hasReceivedFirstToken = true
                }
                accumulatedContent += data
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: accumulatedContent,
                          isStreaming: true,
                        }
                      : msg,
                  ),
                )

                scrollToBottom()
              }
            }
          }
        }
      }
    }

    if (buffer.trim()) {
      const lines = buffer.split("\n")
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data.trim() && data.trim() !== "[DONE]") {
            try {
              const parsed = JSON.parse(data)
              const token = parsed.token || ""
              if (token) {
                accumulatedContent += token
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: accumulatedContent,
                          isStreaming: true,
                        }
                      : msg,
                  ),
                )
                scrollToBottom()
              }
            } catch {
              accumulatedContent += data
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent, isStreaming: true }
                    : msg,
                ),
              )
              scrollToBottom()
            }
          }
        }
      }
    }
  }

  const handleSendMessage = async (
    messageText?: string,
    includeOrderId: boolean = false,
  ) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || loading) return

    const userMessageId = `user-${Date.now()}`
    const assistantMessageId = `assistant-${Date.now()}`

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: textToSend,
    }

    setMessages((prev) => [...prev, userMessage])

    if (!messageText) {
      setInput("")
    }

    setLoading(true)
    setError(null)
    setStreamingMessageId(assistantMessageId)

    abortControllerRef.current = new AbortController()

    try {
      let order_id: string | undefined = undefined

      if (
        includeOrderId &&
        contextData?.dataType === "transaction" &&
        contextData?.orderId
      ) {
        order_id = contextData.orderId
      }

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          isStreaming: true,
        },
      ])

      await streamBackendResponse(
        textToSend,
        order_id,
        assistantMessageId,
        abortControllerRef.current.signal,
      )

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg,
        ),
      )
    } catch (e: any) {
      if (e.name === "AbortError" || e.message === "AbortError") {
        setError("Question is cancelled")
      } else {
        setError(
          e instanceof Error ? e.message : "Unexpected error talking to Ask AI",
        )
      }

      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId))
    } finally {
      setLoading(false)
      setStreamingMessageId(null)
      abortControllerRef.current = null
    }
  }

  useEffect(() => {
    if (open && contextData && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true

      let autoMessage = ""
      let shouldIncludeOrderId = false

      if (contextData.dataType === "holding") {
        autoMessage =
          `I have a position in ${contextData.symbol}:\n` +
          `- Current Price: $${contextData.currentPrice.toFixed(2)}\n` +
          `- Shares: ${Math.abs(contextData.shares)}\n` +
          `- Avg Entry Price: $${contextData.avgPrice.toFixed(2)}\n` +
          `- Total P/L: ${contextData.totalPL >= 0 ? "+" : ""}$${contextData.totalPL.toFixed(2)} (${contextData.changePercent.toFixed(2)}%)\n\n` +
          `Can you analyze this position and provide insights?`
        shouldIncludeOrderId = false
      } else if (contextData.dataType === "transaction") {
        const txDate = new Date(contextData.datetime).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        autoMessage =
          `I have a transaction for ${contextData.symbol}:\n` +
          `- Type: ${contextData.type.toUpperCase()}\n` +
          `- Date: ${txDate}\n` +
          `- Price: $${contextData.price.toFixed(2)}\n` +
          `- Quantity: ${contextData.filledQty} shares\n` +
          `- Total Value: $${contextData.totalValue.toFixed(2)}\n` +
          `- Trade Reason: ${contextData.reason}\n\n` +
          `Can you analyze this transaction and provide insights?`
        shouldIncludeOrderId = true
      } else {
        contextData = []
      }

      if (autoMessage) {
        handleSendMessage(autoMessage, shouldIncludeOrderId)
      }
    }
  }, [open, contextData])

  const handleSend = () => {
    handleSendMessage(undefined, false)
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-background/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${open ? "opacity-100" : "pointer-events-none opacity-0"} `}
        onClick={() => onOpenChange(false)}
      />

      <div className="pointer-events-none fixed bottom-2 left-0 right-0 z-50">
        <div className="pointer-events-none mx-auto max-w-5xl px-4 pb-4">
          <div
            className={`pointer-events-auto transform transition-all duration-500 ease-out ${open ? "translate-y-0 scale-100 opacity-100" : "translate-y-[calc(100%+2rem)] scale-95 opacity-0"} `}
            style={{
              transitionTimingFunction: open
                ? "cubic-bezier(0.16, 1, 0.3, 1)"
                : "cubic-bezier(0.7, 0, 0.84, 0)",
            }}
          >
            <div className="relative rounded-2xl p-[2px]">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="bg-gradient-conic-smooth animate-spin-border absolute inset-[-100%]" />
              </div>

              <Card className="relative flex flex-col min-h-[30vh] max-h-[60vh] overflow-hidden rounded-2xl border-0 bg-card shadow-2xl backdrop-blur-xl">
                {/* Header - fixed */}
                <div className="flex items-center justify-between border-b border-border px-4 pb-2 pt-3 flex-shrink-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Ask Agent M.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contextData?.symbol
                        ? `Analyzing ${contextData.symbol}`
                        : "Ask about your holdings, risk, or what to do next."}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close Ask AI"
                    onClick={() => onOpenChange(false)}
                    className="ml-2 inline-flex items-center justify-center rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Messages - scrollable, fills remaining space */}
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto space-y-2 px-4 py-3 text-sm" // ✅ Removed mb-20, max-h-96
                  style={{ scrollBehavior: "auto" }}
                >
                  {messages.length === 0 && !error && !loading && (
                    <p className="text-xs text-muted-foreground">
                      {contextData
                        ? "Loading analysis..."
                        : 'Try: "Why is my portfolio down today?" or "What should I do with my largest position?"'}
                    </p>
                  )}

                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] font-medium rounded-xl px-3 py-2 ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-transparent text-foreground"
                        }`}
                      >
                        {m.role === "assistant" &&
                        m.isStreaming &&
                        !m.content ? (
                          <div className="flex flex-row items-center justify-start gap-2">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-teal-300" />
                            <span className="animate-pulse text-muted-foreground">
                              Thinking...
                            </span>
                          </div>
                        ) : m.role === "assistant" ? (
                          <MarkdownStreamingContent
                            content={m.content}
                            isStreaming={m.isStreaming || false}
                          />
                        ) : (
                          <span className="whitespace-pre-wrap">
                            {m.content}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-400"
                    >
                      {error}
                    </motion.p>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input - fixed at bottom, never overlaps */}
                <div className="flex-shrink-0 flex items-center gap-2 border-t border-border px-4 py-3">
                  {" "}
                  {/* ✅ Removed absolute positioning */}
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      className="flex-1 rounded-xl border-border bg-border px-4 py-3 text-sm outline-none transition-all focus-visible:border-gray-600 focus-visible:ring-2 focus-visible:ring-gray-600"
                      placeholder={"Ask anything about your portfolio..."}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !loading) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      disabled={loading}
                    />
                    {loading ? (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="rounded-xl transition-transform hover:scale-110 active:scale-95 bg-muted"
                        onClick={handleStop}
                        aria-label="Stop streaming"
                      >
                        <Square className="h-4 w-4" fill="currentColor" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        className="rounded-xl transition-transform hover:scale-110 active:scale-95"
                        onClick={handleSend}
                        disabled={!input.trim()}
                        aria-label="Send message"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-border {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-border {
          animation: spin-border 4s linear infinite;
        }

        .bg-gradient-conic-smooth {
          background: conic-gradient(
            from 0deg,
            #14b8a6,
            #0d9488,
            #0f766e,
            #115e59,
            #134e4a,
            #00faea,
            hsl(var(--background)),
            hsl(var(--muted)),
            hsl(var(--card)),
            hsl(var(--muted)),
            hsl(var(--background)),
            #00ffee,
            #134e4a,
            #115e59,
            #0f766e,
            #0d9488,
            #14b8a6
          );
        }
      `}</style>
    </>
  )
}
