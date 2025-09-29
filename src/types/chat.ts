import type { Product } from "@/lib/products"

export interface ChatRequest {
  message: string
  sessionId?: string
  context?: any
}

export interface ChatResponse {
  response: string
  products?: Product[]
  sessionId: string
  isStreaming?: boolean
}

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  products?: string[]
  isStreaming?: boolean
}

export interface ProductSearchResult {
  products: Product[]
  query: string
  totalResults: number
}