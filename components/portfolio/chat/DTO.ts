export interface iApiMessage {
  content: string
  type: "human" | "ai"
  created_at: string
}

export interface iChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}

export interface iChatLibraryProps {
  conversationHistory: {
    thread_id: string
    title: string
    updated_at: string
    messages: iChatMessage[]
  }[]
  currentSessionId: string
  onSelectSession: (threadId: string, messages: iChatMessage[]) => void
}
