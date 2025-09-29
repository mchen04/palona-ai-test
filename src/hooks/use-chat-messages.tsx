"use client"

import { useChat } from "@/components/chat/chat-context"

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isStreaming?: boolean
  products?: string[]
  image?: string // URL to the uploaded image
}

/**
 * Hook that provides access to chat messages and operations.
 * Internally uses ChatContext to persist state across component unmounts.
 * This maintains backward compatibility while using context under the hood.
 */
export function useChatMessages() {
  const {
    messages,
    sessionId,
    addMessage,
    addStreamingMessage,
    updateStreamingMessage,
    completeStreamingMessage,
    clearMessages,
  } = useChat()

  return {
    messages,
    sessionId,
    addMessage,
    addStreamingMessage,
    updateStreamingMessage,
    completeStreamingMessage,
    clearMessages,
  }
}
