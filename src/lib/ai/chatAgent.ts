import { InMemoryChatMessageHistory } from "@langchain/core/chat_history"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables"

import { searchProducts as textSearchProducts, type Product } from "@/lib/products"
import type { ChatResponse } from "@/types/chat"

import { grokModel, getCurrentModel } from "./config"
import { SYSTEM_PROMPT } from "./prompts"
import { searchWithRAG } from "./ragChain"
import { searchProducts as _searchProducts, type ProductFilter } from "./retriever"

// Configuration
const MAX_MESSAGES_PER_SESSION = 50 // Keep last 50 messages
const MAX_CONTEXT_MESSAGES = 20 // Pass last 20 messages to RAG
const SESSION_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000 // Clean up every 10 minutes

// Session metadata for tracking
interface SessionMetadata {
  history: InMemoryChatMessageHistory
  lastAccessed: number
  lock: Promise<void>
}

// Session store for conversation memory with metadata
const sessionStore = new Map<string, SessionMetadata>()

// Simple async lock implementation
let lockResolver: (() => void) | null = null

// Cleanup old sessions periodically
function startSessionCleanup() {
  setInterval(() => {
    const now = Date.now()
    const sessionsToDelete: string[] = []

    for (const [sessionId, metadata] of sessionStore.entries()) {
      if (now - metadata.lastAccessed > SESSION_TIMEOUT_MS) {
        sessionsToDelete.push(sessionId)
      }
    }

    for (const sessionId of sessionsToDelete) {
      sessionStore.delete(sessionId)
      console.log(`Cleaned up expired session: ${sessionId}`)
    }

    if (sessionsToDelete.length > 0) {
      console.log(`Cleanup: Removed ${sessionsToDelete.length} expired sessions. Active: ${sessionStore.size}`)
    }
  }, CLEANUP_INTERVAL_MS)
}

// Start cleanup on module load
if (typeof window === 'undefined') { // Only run on server
  startSessionCleanup()
}

// Truncate messages to keep memory bounded
async function truncateMessages(history: InMemoryChatMessageHistory): Promise<void> {
  const messages = await history.getMessages()
  if (messages.length > MAX_MESSAGES_PER_SESSION) {
    const messagesToKeep = messages.slice(-MAX_MESSAGES_PER_SESSION)
    await history.clear()
    for (const msg of messagesToKeep) {
      await history.addMessage(msg)
    }
  }
}

// Get last N messages for context window management
async function getRecentMessages(history: InMemoryChatMessageHistory, limit: number = MAX_CONTEXT_MESSAGES) {
  const messages = await history.getMessages()
  return messages.slice(-limit)
}

// Acquire lock for session to prevent race conditions
async function acquireLock(sessionId: string): Promise<() => void> {
  const metadata = sessionStore.get(sessionId)
  if (metadata) {
    await metadata.lock
  }

  let release: () => void
  const lock = new Promise<void>((resolve) => {
    release = resolve
  })

  if (metadata) {
    metadata.lock = lock
  }

  return () => release!()
}

// Session factory function for RunnableWithMessageHistory
function getSessionHistory(sessionId: string): InMemoryChatMessageHistory {
  let metadata = sessionStore.get(sessionId)

  if (!metadata) {
    metadata = {
      history: new InMemoryChatMessageHistory(),
      lastAccessed: Date.now(),
      lock: Promise.resolve(),
    }
    sessionStore.set(sessionId, metadata)
  }

  // Update last accessed time
  metadata.lastAccessed = Date.now()

  return metadata.history
}

// Product search tool function (fallback for non-vector search)
async function productSearchTool(query: string): Promise<Product[]> {
  const results = textSearchProducts(query)
  return results.slice(0, 6) // Limit to top 6 results
}

// Create the chat prompt template with conversation history support
const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
])

// Function to determine if we need to search for products
function shouldSearchProducts(message: string): boolean {
  const lowerMessage = message.toLowerCase()

  // Don't search if asking about conversation history
  const historyIndicators = [
    "what was", "what did", "what were", "earlier", "before",
    "first item", "last item", "previous", "you recommended", "you showed",
    "you suggested", "you said", "you told"
  ]

  if (historyIndicators.some(phrase => lowerMessage.includes(phrase))) {
    return false
  }

  // Search if looking for new products
  const searchKeywords = [
    "find", "search", "looking for", "need", "want", "show me",
    "i want a", "i need a", "looking for a",
    "laptop", "phone", "headphones", "shirt", "jeans", "shoes", "jacket",
    "coffee", "kitchen", "home", "sports", "fitness", "gift", "budget",
    "cheap", "expensive", "premium", "electronics", "clothing", "workout"
  ]

  return searchKeywords.some(keyword => lowerMessage.includes(keyword))
}

// Create the main chat agent with conversation memory
export async function processChatMessage(
  message: string,
  sessionId: string = "default"
): Promise<ChatResponse> {
  try {
    // Acquire lock for this session to prevent race conditions
    const releaseLock = await acquireLock(sessionId)

    try {
      // Check if we should search for products
      if (shouldSearchProducts(message)) {
        // Try to use vector search with RAG
        try {
          // Extract any filters from the message
          const filter = extractFilters(message)

          // Get conversation history for RAG context
          const sessionHistory = getSessionHistory(sessionId)

          // Get only recent messages to avoid context window issues
          const recentMessages = await getRecentMessages(sessionHistory, MAX_CONTEXT_MESSAGES)

          // Use RAG chain for product search with limited conversation history
          const ragResult = await searchWithRAG(message, recentMessages, filter)

          // Get product details
          const products = ragResult.productDetails || []

          // Add clean conversation to history (without product metadata injection)
          await sessionHistory.addUserMessage(message)
          await sessionHistory.addAIMessage(ragResult.response)

          // Truncate old messages to prevent memory leak
          await truncateMessages(sessionHistory)

          return {
            response: ragResult.response, // Return original response to user
            products: products.length > 0 ? products : undefined,
            sessionId,
          }
        } catch (ragError) {
          console.error("RAG search failed:", ragError instanceof Error ? ragError.message : "Unknown error")

          // Log the error and fallback
          console.warn("RAG search failed, falling back to text search")

          // Fallback to text search with memory
          const foundProducts = await productSearchTool(message)

          // Create the chain with memory
          const chain = RunnableSequence.from([
            chatPrompt,
            grokModel,
            new StringOutputParser(),
          ])

          const chainWithHistory = new RunnableWithMessageHistory({
            runnable: chain,
            getMessageHistory: getSessionHistory,
            inputMessagesKey: "input",
            historyMessagesKey: "history",
          })

          // Process the message with conversation memory
          const response = await chainWithHistory.invoke(
            { input: message },
            { configurable: { sessionId } }
          )

          return {
            response,
            products: foundProducts.length > 0 ? foundProducts : undefined,
            sessionId,
          }
        } finally {
          // Always release lock
          releaseLock()
        }
      } else {
        // General conversation with memory
        const chain = RunnableSequence.from([
          chatPrompt,
          grokModel,
          new StringOutputParser(),
        ])

        const chainWithHistory = new RunnableWithMessageHistory({
          runnable: chain,
          getMessageHistory: getSessionHistory,
          inputMessagesKey: "input",
          historyMessagesKey: "history",
        })

        const response = await chainWithHistory.invoke(
          { input: message },
          { configurable: { sessionId } }
        )

        // Truncate history after general conversation
        const sessionHistory = getSessionHistory(sessionId)
        await truncateMessages(sessionHistory)

        // Release lock after general conversation
        releaseLock()

        return {
          response,
          sessionId,
        }
      }
    } catch (innerError) {
      // Make sure lock is released even on unexpected errors
      throw innerError
    }
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw timeout errors so they're handled properly at API level
      if (error.message.includes("timeout") || error.message.includes("Timeout")) {
        throw error
      }
      
      
      console.error("Error in chat agent:", error.message)
    }
    
    return {
      response: "I apologize, but I encountered an error while processing your request. Please try again.",
      sessionId,
    }
  }
}

// Helper function to extract filters from message
function extractFilters(message: string): ProductFilter {
  const filter: ProductFilter = {}
  const lowerMessage = message.toLowerCase()
  
  // Extract category
  if (lowerMessage.includes("clothing") || lowerMessage.includes("clothes")) {
    filter.category = "clothing"
  } else if (lowerMessage.includes("electronics") || lowerMessage.includes("tech")) {
    filter.category = "electronics"
  } else if (lowerMessage.includes("home") || lowerMessage.includes("house")) {
    filter.category = "home"
  } else if (lowerMessage.includes("sports") || lowerMessage.includes("fitness")) {
    filter.category = "sports"
  }
  
  // Extract price range
  const priceMatch = lowerMessage.match(/under\s*\$?(\d+)|below\s*\$?(\d+)|less\s*than\s*\$?(\d+)/)
  if (priceMatch) {
    filter.maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3])
  }
  
  const minPriceMatch = lowerMessage.match(/over\s*\$?(\d+)|above\s*\$?(\d+)|more\s*than\s*\$?(\d+)/)
  if (minPriceMatch) {
    filter.minPrice = parseInt(minPriceMatch[1] || minPriceMatch[2] || minPriceMatch[3])
  }
  
  return filter
}

// Streaming version for future use
export async function processChatMessageStream(
  message: string,
  _sessionId: string = "default"
): Promise<AsyncIterable<string>> {
  try {
    let enhancedMessage = message

    // Check if we should search for products
    if (shouldSearchProducts(message)) {
      const foundProducts = await productSearchTool(message)
      
      if (foundProducts.length > 0) {
        enhancedMessage = `${message}\n\nAvailable products that might be relevant:\n${foundProducts
          .map(p => `- ${p.name} ($${p.price}) - ${p.description}`)
          .join('\n')}`
      }
    }

    // Create the chain
    const chain = RunnableSequence.from([
      chatPrompt,
      grokModel,
    ])

    // Process the message with streaming
    const stream = await chain.stream({
      input: enhancedMessage,
    })

    // Convert the stream to async iterable of strings
    async function* stringStream() {
      for await (const chunk of stream) {
        yield chunk.content.toString()
      }
    }

    return stringStream()
  } catch (error) {
    console.error("Error in streaming chat agent:", error)
    
    // Return error message as async iterable
    async function* errorStream() {
      yield "I apologize, but I encountered an error while processing your request. Please try again."
    }
    
    return errorStream()
  }
}