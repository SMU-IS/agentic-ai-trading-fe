"use client"

import ChatLibrary from "@/components/portfolio/chat/ChatLibrary"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUp, PanelLeft, Square, SquarePen, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Cookies from "js-cookie"

const getToken = () => Cookies.get("jwt") ?? ""

function MarkdownStreamingContent({
  content,
  isStreaming,
}: {
  content: string
  isStreaming: boolean
}) {
  const [displayedText, setDisplayedText] = useState("")
  const animationFrameRef = useRef<number>()
  const lastUpdateRef = useRef<number>(0)
  const currentIndexRef = useRef(0)

  const contentRef = useRef(content)

  useEffect(() => {
    contentRef.current = content // update ref synchronously before any logic

    if (!isStreaming) {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
      lastUpdateRef.current = 0
      setDisplayedText(content)
      currentIndexRef.current = content.length
      return
    }

    if (currentIndexRef.current > contentRef.current.length) {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
      currentIndexRef.current = 0
      lastUpdateRef.current = 0
      setDisplayedText("")
    }

    if (animationFrameRef.current) return

    let speed = 10 + Math.random() * 40 // one roll to start

    const animate = (timestamp: number) => {
      if (lastUpdateRef.current === 0) lastUpdateRef.current = timestamp
      const elapsed = timestamp - lastUpdateRef.current

      if (
        elapsed >= speed &&
        currentIndexRef.current < contentRef.current.length
      ) {
        currentIndexRef.current += 1
        setDisplayedText(contentRef.current.slice(0, currentIndexRef.current))
        lastUpdateRef.current = timestamp
        speed = 30 + Math.random() * 40 // ← new roll only after rendering a char
      }

      if (currentIndexRef.current < contentRef.current.length) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        animationFrameRef.current = undefined
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {}
  }, [content, isStreaming])

  const parseMarkdown = (text: string) => {
    const parts: JSX.Element[] = []
    let buffer = ""
    let i = 0

    while (i < text.length) {
      if (text[i] === "*" && text[i + 1] === "*") {
        if (buffer) {
          parts.push(<span key={`text-${parts.length}`}>{buffer}</span>)
          buffer = ""
        }
        let j = i + 2,
          boldText = "",
          foundClosing = false
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
          buffer += text.slice(i, j)
          i = j
        }
      } else if (
        text[i] === "*" &&
        text[i + 1] !== "*" &&
        (i === 0 || text[i - 1] !== "*")
      ) {
        if (buffer) {
          parts.push(<span key={`text-${parts.length}`}>{buffer}</span>)
          buffer = ""
        }
        let j = i + 1,
          italicText = "",
          foundClosing = false
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
      } else if (text[i] === "`") {
        if (buffer) {
          parts.push(<span key={`text-${parts.length}`}>{buffer}</span>)
          buffer = ""
        }
        let j = i + 1,
          codeText = "",
          foundClosing = false
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
      } else if (text[i] === "\\\\n") {
        if (buffer) {
          parts.push(<span key={`text-${parts.length}`}>{buffer}</span>)
          buffer = ""
        }
        parts.push(<br key={`br-${parts.length}`} />)
        i++
      } else {
        buffer += text[i]
        i++
      }
    }

    if (buffer) parts.push(<span key={`text-${parts.length}`}>{buffer}</span>)
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
  const [showLibrary, setShowLibrary] = useState(false)
  const hasAutoSentRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const scrollAnimationFrameRef = useRef<number>()
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const [isResetting, setIsResetting] = useState(false)
  const [newChatKey, setNewChatKey] = useState(0)

  const CHAT_URL = `${process.env.NEXT_PUBLIC_CHAT_API_URL}`
  const threadId = crypto.randomUUID()
  const userId = sessionStorage.getItem("userId")
  const THREAD_HISTORY_URL = `${process.env.NEXT_PUBLIC_THREAD_API_URL}`

  const sessionIdRef = useRef<string>(crypto.randomUUID())

  const scrollToBottom = () => {
    const scroll = () => {
      if (scrollContainerRef.current)
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight
    }
    scroll()
    if (scrollAnimationFrameRef.current)
      cancelAnimationFrame(scrollAnimationFrameRef.current)
    scrollAnimationFrameRef.current = requestAnimationFrame(scroll)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (loading) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.isStreaming) scrollToBottom()
    }
  }, [messages, loading])

  useEffect(() => {
    if (!open) {
      hasAutoSentRef.current = false
      if (abortControllerRef.current) abortControllerRef.current.abort()
      setShowLibrary(false)
      setMessages([])
      setError(null)
      setLoading(false)
    } else {
      sessionIdRef.current = crypto.randomUUID()
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
      if (scrollAnimationFrameRef.current)
        cancelAnimationFrame(scrollAnimationFrameRef.current)
    }
  }, [open])

  const getHistory = (e?: React.MouseEvent) => {
    e?.preventDefault()
    setShowLibrary((v) => !v)
  }

  useEffect(() => {
    if (showLibrary) {
      fetchData()
    }
  }, [showLibrary])

  const fetchData = async () => {
    const token = getToken() 

    try {
      const response = await fetch(`${THREAD_HISTORY_URL}?user_id=${userId}`, {
        credentials: "include",
        headers: {
              Authorization: `Bearer ${token}`,
            },
      })
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setConversationHistory(data)
      console.log(data)
    } catch (error) {
      console.error("Error fetching thread history:", error)
    }
  }

  const handleNewChat = () => {
    const controller = abortControllerRef.current
    abortControllerRef.current = null
    controller?.abort()

    sessionIdRef.current = crypto.randomUUID()
    setNewChatKey((k) => k + 1)
    setIsResetting(true) // keep button visible while animation plays

    // delay the clear until shimmer finishes (600ms matches transition duration)
    setTimeout(() => {
      setMessages([])
      setInput("")
      setError(null)
      setLoading(false)
      setStreamingMessageId(null)
      setShowLibrary(false)
      hasAutoSentRef.current = false
      setIsResetting(false)
    }, 3000)
  }

  const streamBackendResponse = async (
    userMessage: string,
    order_id: string | undefined,
    assistantMessageId: string,
    signal: AbortSignal,
  ) => {
    const shouldIncludeOrderId = order_id && order_id.length > 0

    const response = await fetch(`${CHAT_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({
        query: userMessage,
        user_id: userId,
        session_id: sessionIdRef.current,
        ...(shouldIncludeOrderId && { order_id }),
      }),
      signal,
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) throw new Error("No response body")

    let accumulatedContent = ""
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split("\n\n")
      buffer = events.pop() || ""

      for (const event of events) {
        if (!event.trim()) continue
        for (const line of event.split("\n")) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data.trim() === "[DONE]") continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) throw new Error(parsed.error)
            const token = parsed.token || ""
            if (token) {
              accumulatedContent += token
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent, isStreaming: true }
                    : msg,
                ),
              )
              scrollToBottom()
            }
          } catch {
            if (data.trim() && data.trim() !== "[DONE]") {
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
    if (!textToSend || loading || isResetting) return

    const userMessageId = `user-${Date.now()}`
    const assistantMessageId = `assistant-${Date.now()}`

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: textToSend },
    ])
    if (!messageText) setInput("")

    setLoading(true)
    setError(null)
    setStreamingMessageId(assistantMessageId)
    setShowLibrary(false)
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
      } else if (contextData.dataType === "transaction") {
        const txDate = new Date(contextData.datetime).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        autoMessage =
          `I'm reviewing transactions made by the agent and I'd like to expand my understanding of one of them.` +
          `This transaction is made for ${contextData.symbol}:\n` +
          `- Type: ${contextData.type.toUpperCase()}\n` +
          `- Date: ${txDate}\n` +
          `- Price: $${contextData.price.toFixed(2)}\n` +
          `- Quantity: ${contextData.filledQty} shares\n` +
          `- Total Value: $${contextData.totalValue.toFixed(2)}\n` +
          `- Trade Reason: ${contextData.reason}\n\n` +
          `Can you analyze this transaction and provide detailed insights?`
        shouldIncludeOrderId = true
      }

      if (autoMessage) handleSendMessage(autoMessage, shouldIncludeOrderId)
    }
  }, [open, contextData])

  const handleSelectSession = (threadId: string, sessionMessages: any[]) => {
    const mapped: ChatMessage[] = sessionMessages.map((m, i) => ({
      id: `history-${i}`,
      role: m.role,
      content: m.content,
      isStreaming: false,
    }))
    sessionIdRef.current = threadId
    setMessages(mapped)
    setShowLibrary(false)

    sessionIdRef.current = threadId
  }

  const handleSend = () => handleSendMessage(undefined, false)
  const handleStop = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-background/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => onOpenChange(false)}
      />

      <div className="pointer-events-none fixed bottom-2 left-0 right-0 z-50">
        <div className="pointer-events-none mx-auto max-w-5xl px-4 pb-4">
          <div
            className={`pointer-events-auto transform transition-all duration-500 ease-out ${open ? "translate-y-0 scale-100 opacity-100" : "translate-y-[calc(100%+2rem)] scale-95 opacity-0"}`}
            style={{
              transitionTimingFunction: open
                ? "cubic-bezier(0.16, 1, 0.3, 1)"
                : "cubic-bezier(0.7, 0, 0.84, 0)",
            }}
          >
            <div className="relative rounded-2xl p-[2px]">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div
                  className="bg-gradient-conic-smooth animate-spin-border absolute inset-[-100%]"
                  style={{
                    willChange: "transform",
                    backfaceVisibility: "hidden",
                    transform: "translateZ(0)",
                  }}
                />
              </div>

              <Card
                className="relative flex flex-col overflow-hidden rounded-2xl border-0 bg-card shadow-2xl backdrop-blur-xl"
                style={{
                  minHeight: "30vh",
                  maxHeight: showLibrary ? "80vh" : "60vh",
                  transition: "max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Header */}
                <div className="relative flex items-center justify-between border-b border-border px-4 pb-2 pt-3 flex-shrink-0 overflow-visible">
                  <div className="flex items-center gap-2">
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
                  </div>

                  {/* Right side buttons */}
                  <div className="flex items-center gap-2">
                    {(messages.length > 0 || isResetting) && (
                      <div className="relative group/newchat">
                        <motion.button
                          type="button"
                          aria-label="New Chat"
                          onClick={handleNewChat}
                          className="relative overflow-hidden inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5"
                          whileTap={{ scale: 0.95 }}
                          animate={{
                            opacity: isResetting ? 0.5 : 1,
                            borderColor: isResetting
                              ? "hsl(var(--primary))"
                              : "hsl(var(--border))",
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Shimmer sweep — bright and visible */}
                          {isResetting && (
                            <motion.div
                              key={newChatKey}
                              className="absolute inset-0 rounded-full"
                              style={{
                                background:
                                  "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.5) 50%, transparent 100%)",
                                backgroundSize: "200% 100%",
                              }}
                              animate={{
                                backgroundPosition: ["200% 0", "-200% 0"],
                              }}
                              transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                          )}

                          {/* Content */}
                          <motion.div
                            className="relative flex items-center gap-1.5 text-xs font-medium"
                            animate={{
                              color: isResetting
                                ? "hsl(var(--primary))"
                                : "hsl(var(--muted-foreground))",
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <motion.div
                              // animate={{ rotate: isResetting ? 360 : 0 }}
                              transition={
                                isResetting
                                  ? {
                                      duration: 1.5,
                                      repeat: Infinity,
                                      ease: "linear",
                                    }
                                  : {
                                      type: "spring",
                                      stiffness: 300,
                                      damping: 15,
                                    }
                              }
                              whileHover={
                                !isResetting ? { rotate: 15, scale: 1.15 } : {}
                              }
                            >
                              <SquarePen className="h-3.5 w-3.5" />
                            </motion.div>
                            {isResetting ? "Creating..." : "New Chat"}
                          </motion.div>
                        </motion.button>

                        {/* Tooltip */}
                        <div className="pointer-events-none absolute right-0 top-full mt-2 z-[999] opacity-0 group-hover/newchat:opacity-100 translate-y-1 group-hover/newchat:translate-y-0 transition-all duration-200">
                          <div className="relative rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-lg">
                            <p className="whitespace-nowrap text-[11px] text-muted-foreground">
                              Start a fresh conversation
                            </p>
                            <div className="absolute -top-1 right-4 h-2 w-2 rotate-45 border-l border-t border-border bg-card" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Library Toggle Button */}
                    <div className="relative group/library">
                      <button
                        type="button"
                        aria-label="Chat Library"
                        onClick={getHistory}
                        className={`inline-flex items-center gap-1.5 text-xs justify-center rounded-full px-3 py-1.5 transition-all duration-200 border font-medium ${
                          showLibrary
                            ? "border-teal-500/50 bg-teal-500/10 text-teal-400"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-muted-foreground/30"
                        }`}
                      >
                        <PanelLeft className="h-3.5 w-3.5" />
                        Recent Chats
                      </button>

                      {/* Tooltip */}
                      <div className="pointer-events-none absolute right-0 top-full mt-2 z-[999] opacity-0 group-hover/library:opacity-100 translate-y-1 group-hover/library:translate-y-0 transition-all duration-200">
                        <div className="relative rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-lg">
                          <p className="whitespace-nowrap text-[11px] text-muted-foreground">
                            {showLibrary
                              ? "Close chat history"
                              : "Browse past conversations"}
                          </p>
                          <div className="absolute -top-1 right-4 h-2 w-2 rotate-45 border-l border-t border-border bg-card" />
                        </div>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      type="button"
                      aria-label="Close Ask AI"
                      onClick={() => onOpenChange(false)}
                      className="inline-flex items-center justify-center rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Chat Library Panel */}
                <AnimatePresence>
                  {showLibrary && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden border-b border-border flex-shrink-0"
                    >
                      <ChatLibrary
                        conversationHistory={conversationHistory}
                        currentSessionId={sessionIdRef.current}
                        onSelectSession={handleSelectSession}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Messages */}
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto space-y-2 px-4 py-3 text-sm"
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
                            ? "bg-primary/10 border-2 border-foreground/10 text-foreground"
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
                            key={m.id}
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

                {/* Input */}
                <div className="flex-shrink-0 flex items-center gap-2 border-t border-border px-4 py-3">
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      className="flex-1 rounded-xl border-border bg-border px-4 py-3 text-sm outline-none transition-all focus-visible:border-gray-600 focus-visible:ring-2 focus-visible:ring-gray-600"
                      placeholder="Ask anything about your portfolio..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !loading) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      disabled={loading || isResetting}
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
                        disabled={!input.trim() || isResetting}
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
    </>
  )
}
