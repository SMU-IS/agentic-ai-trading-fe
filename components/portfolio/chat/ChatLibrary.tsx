"use client"

import { useState } from "react"
import { MessageSquare, Clock, ChevronRight, Loader2 } from "lucide-react"

interface ApiMessage {
  content: string
  type: "human" | "ai"
  created_at: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}

interface ChatSession {
  session_id: string
  created_at: string
  updated_at?: string
  messages: ChatMessage[]
  preview?: string
}

interface ChatLibraryProps {
  currentSessionId: string
  onSelectSession: (sessionId: string, messages: ChatMessage[]) => void
}

const HARDCODED_SESSION_ID = "0f19c4d2-7e5b-48a1-9c3f-d4e6b7a8c9d0"

const MOCK_SESSIONS: ChatSession[] = [
  {
    session_id: "mock-1",
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    messages: [{ role: "user", content: "Can you analyze my TSLA position?" }],
  },
  {
    session_id: "mock-2",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    messages: [
      { role: "user", content: "Why did the agent sell NVDA yesterday?" },
    ],
  },
  {
    session_id: "mock-3",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        role: "user",
        content: "What is my portfolio risk exposure right now?",
      },
    ],
  },
  {
    session_id: "mock-4",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        role: "user",
        content: "Show me trades made by the agent in the past 7 days",
      },
    ],
  },
  {
    session_id: "mock-5",
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      { role: "user", content: "What should I do with my AAPL position?" },
    ],
  },
]

export default function ChatLibrary({
  currentSessionId,
  onSelectSession,
}: ChatLibraryProps) {
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const CHAT_URL = `${process.env.NEXT_PUBLIC_CHAT_API_URL}`

  const handleSessionClick = async (session: ChatSession) => {
    setLoadingSessionId(session.session_id)
    setError(null)
    try {
      const response = await fetch(
        `${CHAT_URL}/history/${HARDCODED_SESSION_ID}`,
        { credentials: "include" },
      )

      if (!response.ok) throw new Error("Failed to fetch")

      const data: { history: ApiMessage[] } = await response.json()

      // Map API types to ChatMessage format
      const mapped: ChatMessage[] = data.history.map((msg) => ({
        role: msg.type === "human" ? "user" : "assistant",
        content: msg.content,
        timestamp: msg.created_at !== "unknown" ? msg.created_at : undefined,
      }))

      onSelectSession(HARDCODED_SESSION_ID, mapped)
    } catch {
      // Fall back to mock messages on failure
      onSelectSession(session.session_id, session.messages)
    } finally {
      setLoadingSessionId(null)
    }
  }

  const getPreview = (session: ChatSession) => {
    if (session.preview) return session.preview
    const firstUser = session.messages.find((m) => m.role === "user")
    return firstUser?.content?.slice(0, 80) || "Empty session"
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getMessageCount = (messages: ChatMessage[]) =>
    messages.filter((m) => m.role === "user").length

  return (
    <div className="flex flex-col gap-1 px-3 py-2 overflow-y-auto max-h-[220px] bg-muted">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1">
        Recent Chats
      </p>

      {error && <p className="text-xs text-red-400 px-1">{error}</p>}

      {MOCK_SESSIONS.map((session) => (
        <button
          key={session.session_id}
          onClick={() => handleSessionClick(session)}
          disabled={loadingSessionId === session.session_id}
          className={`w-full text-left rounded-lg px-3 py-2.5 transition-all group hover:bg-card/50 border ${
            session.session_id === currentSessionId
              ? "border-teal-500/30 bg-teal-500/5"
              : "border-transparent hover:border-border"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {getPreview(session)}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                <span>{formatDate(session.created_at)}</span>
                <span>•</span>
                <span>
                  {getMessageCount(session.messages)} message
                  {getMessageCount(session.messages) !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            {loadingSessionId === session.session_id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mt-0.5 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground mt-0.5 flex-shrink-0 transition-colors" />
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
