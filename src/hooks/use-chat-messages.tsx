"use client"

import { useState, useCallback } from "react"

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isStreaming?: boolean
  products?: string[]
  image?: string // URL to the uploaded image
}

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const addStreamingMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, { ...message, isStreaming: true }])
  }, [])

  const updateStreamingMessage = useCallback((id: string, content: string, products?: string[]) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content, products: products || msg.products } : msg)),
    )
  }, [])

  const completeStreamingMessage = useCallback((id: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, isStreaming: false } : msg)))
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    addMessage,
    addStreamingMessage,
    updateStreamingMessage,
    completeStreamingMessage,
    clearMessages,
  }
}
