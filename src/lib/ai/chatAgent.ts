import { InMemoryChatMessageHistory } from "@langchain/core/chat_history"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables"

import { searchProducts as textSearchProducts, type Product } from "@/lib/products"
import type { ChatResponse } from "@/types/chat"

import { geminiModel } from "./config"
import { SYSTEM_PROMPT } from "./prompts"
import { searchWithRAG } from "./ragChain"
import { searchProducts, type ProductFilter } from "./retriever"

// Session store for conversation memory (in-memory for MVP)
const sessionStore = new Map<string, InMemoryChatMessageHistory>()

// Session factory function for RunnableWithMessageHistory
function getSessionHistory(sessionId: string): InMemoryChatMessageHistory {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, new InMemoryChatMessageHistory())
  }
  return sessionStore.get(sessionId)!
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
  const searchKeywords = [
    "find", "search", "looking for", "need", "want", "show me", "recommend",
    "laptop", "phone", "headphones", "shirt", "jeans", "shoes", "jacket",
    "coffee", "kitchen", "home", "sports", "fitness", "gift", "budget",
    "cheap", "expensive", "premium", "electronics", "clothing", "workout"
  ]
  
  const lowerMessage = message.toLowerCase()
  return searchKeywords.some(keyword => lowerMessage.includes(keyword))
}

// Create the main chat agent with conversation memory
export async function processChatMessage(
  message: string,
  sessionId: string = "default"
): Promise<ChatResponse> {
  try {
    // Check if we should search for products
    if (shouldSearchProducts(message)) {
      // Try to use vector search with RAG
      try {
        // Extract any filters from the message
        const filter = extractFilters(message)
        
        // Use RAG chain for product search - pass empty history for now
        // TODO: Could enhance RAG to consider conversation history
        const ragResult = await searchWithRAG(message, [], filter)
        
        // Get product details
        const products = ragResult.productDetails || []
        
        // Create enhanced response that includes product context for memory
        let enhancedResponse = ragResult.response
        if (products.length > 0) {
          enhancedResponse += `\n\n[Context: I found and showed ${products.length} products: ${products.map(p => p.name).join(', ')}]`
        }
        
        // Create chain with conversation memory
        const chain = RunnableSequence.from([
          chatPrompt,
          geminiModel,
          new StringOutputParser(),
        ])
        
        const chainWithHistory = new RunnableWithMessageHistory({
          runnable: chain,
          getMessageHistory: getSessionHistory,
          inputMessagesKey: "input",
          historyMessagesKey: "history",
        })
        
        // Process with memory - use the enhanced response
        await chainWithHistory.invoke(
          { input: message },
          { configurable: { sessionId } }
        )
        
        return {
          response: ragResult.response, // Return original response to user
          products: products.length > 0 ? products : undefined,
          sessionId,
        }
      } catch (ragError) {
        console.error("RAG search failed:", ragError instanceof Error ? ragError.message : "Unknown error")
        
        // Fallback to text search with memory
        const foundProducts = await productSearchTool(message)
        
        // Create the chain with memory
        const chain = RunnableSequence.from([
          chatPrompt,
          geminiModel,
          new StringOutputParser(),
        ])
        
        const chainWithHistory = new RunnableWithMessageHistory({
          runnable: chain,
          getMessageHistory: getSessionHistory,
          inputMessagesKey: "input",
          historyMessagesKey: "history",
        })

        // Process the message with conversation memory
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Gemini API timeout after 30 seconds")), 30000)
        })
        
        const response = await Promise.race([
          chainWithHistory.invoke(
            { input: message },
            { configurable: { sessionId } }
          ),
          timeoutPromise
        ]) as string

        return {
          response,
          products: foundProducts.length > 0 ? foundProducts : undefined,
          sessionId,
        }
      }
    } else {
      // General conversation with memory
      const chain = RunnableSequence.from([
        chatPrompt,
        geminiModel,
        new StringOutputParser(),
      ])
      
      const chainWithHistory = new RunnableWithMessageHistory({
        runnable: chain,
        getMessageHistory: getSessionHistory,
        inputMessagesKey: "input",
        historyMessagesKey: "history",
      })
      
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Gemini API timeout after 30 seconds")), 30000)
      })
      
      try {
        const response = await Promise.race([
          chainWithHistory.invoke(
            { input: message },
            { configurable: { sessionId } }
          ),
          timeoutPromise
        ]) as string
        
        return {
          response,
          sessionId,
        }
      } catch (timeoutError) {
        throw timeoutError
      }
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
  sessionId: string = "default"
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
      geminiModel,
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