import { geminiModel } from "./config"
import { SYSTEM_PROMPT } from "./prompts"
import { searchProducts as textSearchProducts, type Product } from "@/lib/products"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence } from "@langchain/core/runnables"
import { StringOutputParser } from "@langchain/core/output_parsers"
import type { ChatResponse } from "@/types/chat"
import { searchWithRAG, searchProducts } from "./ragChain"
import { ProductFilter } from "./retriever"

// Product search tool function (fallback for non-vector search)
async function productSearchTool(query: string): Promise<Product[]> {
  console.log(`Using text search for: ${query}`)
  const results = textSearchProducts(query)
  console.log(`Found ${results.length} products`)
  return results.slice(0, 6) // Limit to top 6 results
}

// Create the chat prompt template
const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
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

// Create the main chat agent
export async function processChatMessage(
  message: string,
  sessionId: string = "default"
): Promise<ChatResponse> {
  try {
    // Check if we should search for products
    if (shouldSearchProducts(message)) {
      // Try to use vector search with RAG
      try {
        console.log("Using vector search with RAG...")
        
        // Extract any filters from the message
        const filter = extractFilters(message)
        
        // Use RAG chain for product search
        const ragResult = await searchWithRAG(message, [], filter)
        
        // Get product details
        const products = ragResult.productDetails || []
        
        return {
          response: ragResult.response,
          products: products.length > 0 ? products : undefined,
          sessionId,
        }
      } catch (ragError) {
        console.error("RAG search failed, falling back to text search:", ragError)
        
        // Fallback to text search
        const foundProducts = await productSearchTool(message)
        let enhancedMessage = message
        
        if (foundProducts.length > 0) {
          enhancedMessage = `${message}\n\nAvailable products that might be relevant:\n${foundProducts
            .map(p => `- ${p.name} ($${p.price}) - ${p.description}`)
            .join('\n')}`
        }

        // Create the chain
        const chain = RunnableSequence.from([
          chatPrompt,
          geminiModel,
          new StringOutputParser(),
        ])

        // Process the message
        const response = await chain.invoke({
          input: enhancedMessage,
        })

        return {
          response,
          products: foundProducts.length > 0 ? foundProducts : undefined,
          sessionId,
        }
      }
    } else {
      // General conversation without product search
      const chain = RunnableSequence.from([
        chatPrompt,
        geminiModel,
        new StringOutputParser(),
      ])

      const response = await chain.invoke({
        input: message,
      })

      return {
        response,
        sessionId,
      }
    }
  } catch (error) {
    console.error("Error in chat agent:", error)
    
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

    return stream
  } catch (error) {
    console.error("Error in streaming chat agent:", error)
    
    // Return error message as async iterable
    async function* errorStream() {
      yield "I apologize, but I encountered an error while processing your request. Please try again."
    }
    
    return errorStream()
  }
}