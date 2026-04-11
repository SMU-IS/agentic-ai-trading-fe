"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowUp, Mic, MicOff, Square, SquarePen, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { MarkdownRenderer } from "@/components/portfolio/chat/MarkdownRenderer"

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
  isThinking?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}`
const API_URL = `${BASE_URL}/info-agent/query`
const DELETE_SESSION_API_URL = `${BASE_URL}/info-agent/history`

const SUGGESTED_PROMPTS = [
  "What is Agent M?",
  "How does autonomous trading work?",
  "What makes Agent M different?",
  "Is my portfolio safe?",
]

// ─── Markdown Streaming Content ───────────────────────────────────────────────

function MarkdownStreamingContent({
  content,
  isStreaming,
}: {
  content: string
  isStreaming: boolean
}) {
  const [displayedText, setDisplayedText] = useState("")
  const animFrameRef = useRef<number>()
  const lastUpdateRef = useRef<number>(0)
  const currentIndexRef = useRef(0)
  const contentRef = useRef(content)

  useEffect(() => {
    contentRef.current = content

    if (!isStreaming) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = undefined
      lastUpdateRef.current = 0
      setDisplayedText(content)
      currentIndexRef.current = content.length
      return
    }

    if (currentIndexRef.current > contentRef.current.length) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = undefined
      currentIndexRef.current = 0
      lastUpdateRef.current = 0
      setDisplayedText("")
    }

    if (animFrameRef.current) return

    let speed = 10 + Math.random() * 40

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
        speed = 20 + Math.random() * 35
      }

      if (currentIndexRef.current < contentRef.current.length) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        animFrameRef.current = undefined
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => {}
  }, [content, isStreaming])

  return (
    <div className="relative">
      <MarkdownRenderer content={displayedText} />
      {isStreaming && (
        <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-teal-400" />
      )}
    </div>
  )
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function AgentMLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-label="Agent M"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="24"
        cy="24"
        r="22"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <path
        d="M12 32V16L24 26L36 16V32"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="2.5" fill="currentColor" />
      <line
        x1="24"
        y1="8"
        x2="24"
        y2="21.5"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />
      <line
        x1="12"
        y1="16"
        x2="21.5"
        y2="23"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />
      <line
        x1="36"
        y1="16"
        x2="26.5"
        y2="23"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface AskAIDemoProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function AskAIDemo({ open, onOpenChange }: AskAIDemoProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [newChatKey, setNewChatKey] = useState(0)

  const sessionIdRef = useRef<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollAnimFrameRef = useRef<number>()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Scroll ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
      // Prevent background scrolling on iOS/mobile
      document.body.style.touchAction = "none"
    } else {
      document.body.style.overflow = ""
      document.body.style.touchAction = ""
    }
    return () => {
      document.body.style.overflow = ""
      document.body.style.touchAction = ""
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (!sessionIdRef.current) {
        sessionIdRef.current = crypto.randomUUID()
      }
    } else {
      abortControllerRef.current?.abort()
      setMessages([])
      setInput("")
      setError(null)
      setLoading(false)
      setIsListening(false)
      sessionIdRef.current = ""
    }
  }, [open])

  const scrollToBottom = () => {
    const scroll = () => {
      if (scrollContainerRef.current)
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight
    }
    scroll()
    if (scrollAnimFrameRef.current)
      cancelAnimationFrame(scrollAnimFrameRef.current)
    scrollAnimFrameRef.current = requestAnimationFrame(scroll)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    return () => {
      if (scrollAnimFrameRef.current)
        cancelAnimationFrame(scrollAnimFrameRef.current)
    }
  }, [])

  // ── Textarea auto-resize ─────────────────────────────────────────────────────

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  // ── Stream ───────────────────────────────────────────────────────────────────

  const streamResponse = async (
    userMessage: string,
    assistantMessageId: string,
    signal: AbortSignal,
  ) => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: userMessage,
        session_id: sessionIdRef.current,
      }),
      signal,
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
            
            // Only capture the actual answer or reasoning, ignore raw source context
            const token = parsed.token || parsed.reasoning_content || ""
            
            if (token) {
              accumulatedContent += token
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: accumulatedContent,
                        isStreaming: true,
                        isThinking: false,
                      }
                    : msg,
                ),
              )
              scrollToBottom()
            }
          } catch {
            if (
              data.trim() &&
              data.trim() !== "[DONE]" &&
              !data.includes("{")
            ) {
              accumulatedContent += data
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: accumulatedContent,
                        isStreaming: true,
                        isThinking: false,
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

  // ── Send message ─────────────────────────────────────────────────────────────

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText ?? input.trim()
    if (!textToSend || loading || isResetting) return

    const userMessageId = `user-${Date.now()}`
    const assistantMessageId = `assistant-${Date.now()}`

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: textToSend },
    ])
    if (!messageText) {
      setInput("")
      if (textareaRef.current) textareaRef.current.style.height = "auto"
    }

    setLoading(true)
    setError(null)
    abortControllerRef.current = new AbortController()

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
        isThinking: true,
      },
    ])

    try {
      await streamResponse(
        textToSend,
        assistantMessageId,
        abortControllerRef.current.signal,
      )
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, isStreaming: false, isThinking: false }
            : msg,
        ),
      )
    } catch (e: unknown) {
      const err = e as Error
      if (err.name === "AbortError" || err.message === "AbortError") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false, isThinking: false }
              : msg,
          ),
        )
      } else {
        setError(err instanceof Error ? err.message : "Unexpected error")
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId),
        )
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => abortControllerRef.current?.abort()
  const handleSend = () => handleSendMessage()

  const deleteSessionHistory = async () => {
    try {
      const DELETE_URL = `${DELETE_SESSION_API_URL}/${sessionIdRef.current}`
      await fetch(DELETE_URL, {
        method: "DELETE",
      })
    } catch (err) {
      console.error("Failed to clear history:", err)
    }
  }

  // ── New chat ─────────────────────────────────────────────────────────────────
  const handleNewChat = async () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    await deleteSessionHistory()

    setIsResetting(true)
    setTimeout(() => {
      setMessages([])
      setInput("")
      setError(null)
      setLoading(false)
      sessionIdRef.current = crypto.randomUUID()
      if (textareaRef.current) textareaRef.current.style.height = "auto"
      setIsResetting(false)
    }, 600)
  }

  // ── Voice ────────────────────────────────────────────────────────────────────

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError("Voice input not supported in this browser. Try Chrome or Edge.")
      return
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "",
        final = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        event.results[i].isFinal ? (final += t) : (interim += t)
      }
      setInput(final || interim)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") setError(`Voice error: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognition.start()
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-background/40 backdrop-blur-sm transition-opacity duration-300 ease-out touch-none ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => onOpenChange?.(false)}
      />

      {/* Outer shell — pointer-events-none so backdrop clicks work around the panel */}
      <div
        className="pointer-events-none fixed bottom-20 z-50 w-full px-4 sm:right-6 sm:w-auto sm:max-w-lg sm:px-0
  left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0"
      >
        {" "}
        {/* ↓ This div is the animated panel — re-enables pointer-events and drives open/close */}
        <div
          className={`pointer-events-auto transform transition-all duration-500 ${
            open
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-[calc(100%+2rem)] scale-95 opacity-0"
          }`}
          style={{
            transitionTimingFunction: open
              ? "cubic-bezier(0.16, 1, 0.3, 1)"
              : "cubic-bezier(0.7, 0, 0.84, 0)",
          }}
        >
          {/* Suggested prompts */}
          <div className="mb-3 flex flex-wrap justify-end gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading || isResetting}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground
                transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-foreground
                disabled:pointer-events-none disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat card */}
          <div className="relative w-full rounded-2xl p-[2px]">
            {/* Spinning gradient border */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <div
                className="animate-spin-border bg-gradient-conic-smooth absolute inset-[-100%]"
                style={{
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                  transform: "translateZ(0)",
                }}
              />
            </div>

            <div
              className="relative flex flex-col overflow-hidden rounded-[calc(1rem-2px)] border-0 bg-card shadow-2xl"
              style={{ minHeight: "50vh", maxHeight: "70vh" }}
            >
              {/* Header */}
              <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 pb-2 pt-3">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      AskAI
                    </p>
                    <p className="text-[10px] text-muted-foreground ">
                      Try out the RAG-powered agent that we use for trades
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {(messages.length > 0 || isResetting) && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: isResetting ? 0.5 : 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleNewChat}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border
                        px-3 py-1.5 text-xs text-muted-foreground transition-colors
                        hover:border-muted-foreground/40 hover:bg-muted hover:text-foreground"
                        aria-label="New chat"
                      >
                        <SquarePen className="h-3.5 w-3.5" />
                        <span className="hidden sm:block">
                          {isResetting ? "Clearing…" : "New Chat"}
                        </span>
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => onOpenChange?.(false)}
                    className="inline-flex items-center justify-center rounded-full border border-border
                    p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollContainerRef}
                className="flex-1 space-y-3 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4 text-sm"
                style={{
                  scrollBehavior: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {messages.length === 0 && !error && !loading && (
                  <p className="text-xs text-muted-foreground">
                    This rag agent is specific to query on anything about Agent
                    M, autonomous trading, or it's capabilities.
                  </p>
                )}

                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-xl px-3 py-2 font-medium ${
                        m.role === "user"
                          ? "border-2 border-foreground/10 bg-primary/10 text-foreground"
                          : "bg-transparent text-foreground"
                      }`}
                    >
                      {m.role === "assistant" && m.isThinking && !m.content ? (
                        <div className="flex flex-row items-center gap-2">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                          <span className="animate-pulse text-xs text-muted-foreground">
                            Thinking…
                          </span>
                        </div>
                      ) : m.role === "assistant" ? (
                        <MarkdownStreamingContent
                          key={m.id}
                          content={m.content}
                          isStreaming={m.isStreaming ?? false}
                        />
                      ) : (
                        <span className="whitespace-pre-wrap text-sm">
                          {m.content}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}

                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-destructive"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Input */}
              <div className="flex-shrink-0 border-t border-border px-4 py-3">
                <div
                  className="flex items-end gap-2 rounded-xl border border-border bg-muted/40
                  px-3 pb-3 pt-1.5 transition-all focus-within:border-primary/60
                  focus-within:ring-2 focus-within:ring-primary/20"
                >
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    className="min-h-[10vh] flex-1 resize-none bg-transparent py-1.5 text-sm
                    leading-relaxed outline-none placeholder:text-muted-foreground overscroll-contain touch-pan-y"
                    placeholder={
                      isListening
                        ? "Listening… speak now"
                        : "Ask about Agent M…"
                    }
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      autoResize()
                    }}
                    onKeyDown={(e) => {
                      const isMobile = window.matchMedia(
                        "(hover: none) and (pointer: coarse)",
                      ).matches
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !loading &&
                        !isMobile
                      ) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    disabled={loading || isResetting}
                    style={{
                      maxHeight: "120px",
                      overflowY: "auto",
                      fontSize: "16px",
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    disabled={loading || isResetting}
                    aria-label={
                      isListening ? "Stop listening" : "Start voice input"
                    }
                    className={`flex-shrink-0 rounded-lg p-1.5 transition-colors ${
                      isListening
                        ? "animate-pulse text-destructive hover:text-destructive/80"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>

                  {loading ? (
                    <button
                      type="button"
                      onClick={handleStop}
                      aria-label="Stop streaming"
                      className="flex-shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Square className="h-4 w-4" fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!input.trim() || isResetting}
                      aria-label="Send message"
                      className="flex-shrink-0 rounded-lg bg-primary/80 p-1.5 text-primary-foreground
                      transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
                  Enter to send &middot; Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* ← end animated div */}
      </div>
    </>
  )
}
