import { geminiModel } from "./config"
import { SYSTEM_PROMPT } from "./prompts"
import { searchProducts, type Product } from "@/lib/products"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence } from "@langchain/core/runnables"
import { StringOutputParser } from "@langchain/core/output_parsers"
import type { ChatResponse } from "@/types/chat"

// Product search tool function
async function productSearchTool(query: string): Promise<Product[]> {
  console.log(`Searching products for: ${query}`)
  const results = searchProducts(query)
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
    let foundProducts: Product[] = []
    let enhancedMessage = message

    // Check if we should search for products
    if (shouldSearchProducts(message)) {
      foundProducts = await productSearchTool(message)
      
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
  } catch (error) {
    console.error("Error in chat agent:", error)
    
    return {
      response: "I apologize, but I encountered an error while processing your request. Please try again.",
      sessionId,
    }
  }
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