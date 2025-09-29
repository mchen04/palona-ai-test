"use client"

import type React from "react"
import { createContext, useContext, useReducer, useRef, type ReactNode } from "react"

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isStreaming?: boolean
  products?: string[]
  image?: string
}

interface ChatState {
  messages: ChatMessage[]
  sessionId: string
}

type ChatAction =
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "ADD_STREAMING_MESSAGE"; payload: ChatMessage }
  | { type: "UPDATE_STREAMING_MESSAGE"; payload: { id: string; content: string; products?: string[] } }
  | { type: "COMPLETE_STREAMING_MESSAGE"; payload: string }
  | { type: "CLEAR_MESSAGES" }

const ChatContext = createContext<{
  state: ChatState
  dispatch: React.Dispatch<ChatAction>
  addMessage: (message: ChatMessage) => void
  addStreamingMessage: (message: ChatMessage) => void
  updateStreamingMessage: (id: string, content: string, products?: string[]) => void
  completeStreamingMessage: (id: string) => void
  clearMessages: () => void
  messages: ChatMessage[]
  sessionId: string
} | null>(null)

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      }

    case "ADD_STREAMING_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, { ...action.payload, isStreaming: true }],
      }

    case "UPDATE_STREAMING_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id
            ? { ...msg, content: action.payload.content, products: action.payload.products || msg.products }
            : msg
        ),
      }

    case "COMPLETE_STREAMING_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload ? { ...msg, isStreaming: false } : msg
        ),
      }

    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
      }

    default:
      return state
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  // Generate stable session ID once when provider mounts
  const sessionIdRef = useRef(`session_${Date.now()}`)

  const [state, dispatch] = useReducer(chatReducer, {
    messages: [],
    sessionId: sessionIdRef.current,
  })

  const addMessage = (message: ChatMessage) => {
    dispatch({ type: "ADD_MESSAGE", payload: message })
  }

  const addStreamingMessage = (message: ChatMessage) => {
    dispatch({ type: "ADD_STREAMING_MESSAGE", payload: message })
  }

  const updateStreamingMessage = (id: string, content: string, products?: string[]) => {
    dispatch({ type: "UPDATE_STREAMING_MESSAGE", payload: { id, content, products } })
  }

  const completeStreamingMessage = (id: string) => {
    dispatch({ type: "COMPLETE_STREAMING_MESSAGE", payload: id })
  }

  const clearMessages = () => {
    dispatch({ type: "CLEAR_MESSAGES" })
  }

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        addMessage,
        addStreamingMessage,
        updateStreamingMessage,
        completeStreamingMessage,
        clearMessages,
        messages: state.messages,
        sessionId: state.sessionId,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}