"use client"

import { useState } from "react"
import { Clock, ChevronRight, Loader2 } from "lucide-react"
import { iApiMessage, iChatLibraryProps, iChatMessage } from "./DTO"
import { formatDate } from "@/components/utils/utils"

export default function ChatLibrary({
  conversationHistory,
  currentSessionId,
  onSelectSession,
}: iChatLibraryProps) {
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSessionClick = async (threadId: string) => {
    setLoadingSessionId(threadId)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/history/${threadId}`,
        {
          credentials: "include",
        },
      )

      if (!response.ok) throw new Error("Failed to fetch")

      const data: { history: iApiMessage[] } = await response.json()
      const mapped: iChatMessage[] = data.history.map((msg) => ({
        role: msg.type === "human" ? "user" : "assistant",
        content: msg.content,
        timestamp: msg.created_at !== "unknown" ? msg.created_at : undefined,
      }))
      onSelectSession(threadId, mapped)
    } catch (err) {
      setError("Failed to load chat history")
    } finally {
      setLoadingSessionId(null)
    }
  }

  return (
    <div className="flex flex-col gap-1 px-3 py-2 overflow-y-auto max-h-[220px] bg-muted">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1">
        Recent Chats
      </p>

      {error && <p className="text-xs text-red-400 px-1">{error}</p>}
      <ConversationHistory
        conversationHistory={conversationHistory}
        handleSessionClick={handleSessionClick}
        loadingSessionId={loadingSessionId}
        currentSessionId={currentSessionId}
      />
    </div>
  )
}

const ConversationHistory = ({
  conversationHistory,
  handleSessionClick,
  loadingSessionId,
  currentSessionId,
}: any) => {
  return (
    <>
      {conversationHistory.map(({ thread_id, title, updated_at }: any) => (
        <button
          key={thread_id}
          onClick={() => handleSessionClick(thread_id)}
          disabled={loadingSessionId === thread_id}
          className={`w-full text-left rounded-lg px-3 py-2.5 transition-all group hover:bg-card/50 border ${
            thread_id === currentSessionId
              ? "border-teal-500/30 bg-teal-500/5"
              : "border-transparent hover:border-border"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {title}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                <span>{formatDate(updated_at)}</span>
              </div>
            </div>
            {loadingSessionId === thread_id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mt-0.5 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground mt-0.5 flex-shrink-0 transition-colors" />
            )}
          </div>
        </button>
      ))}
    </>
  )
}
