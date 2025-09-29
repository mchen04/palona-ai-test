import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { ChatOpenAI } from "@langchain/openai"
import { createStuffDocumentsChain } from "langchain/chains/combine_documents"
import { createRetrievalChain } from "langchain/chains/retrieval"

import { getCachedRetriever, type ProductFilter } from "./cachedRetriever"

const systemPrompt = `You are a helpful AI shopping assistant for an e-commerce website.
Use the following product information to answer questions and make recommendations.
IMPORTANT: Only recommend products that are actually shown in the context below.
When mentioning a product, include its EXACT id from the context in this format: [product_id: X].
Do NOT make up product IDs - only use the actual IDs from the products shown below.

Product Context:
{context}

Guidelines:
- Only recommend products that appear in the context above
- Use the EXACT product id, name, and price from the context
- If products are found, describe why they match the user's needs
- Include product names, prices, and key features in your recommendations
- You can recommend multiple products if relevant
- If no products match, apologize and suggest alternatives
- Keep responses concise and engaging
- Write in plain text without markdown formatting (no **, ##, ###, bullets, etc.)
- NEVER invent product IDs - only use the ones provided in the context`

export async function createProductRAGChain(filter?: ProductFilter) {
  try {
    // Initialize the model
    const model = new ChatOpenAI({
      model: "x-ai/grok-4-fast:free",
      temperature: 0.7,
      maxTokens: 2048,
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "AI Commerce Chatbot",
        },
      },
    })

    // Create the prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ])

    // Create document chain
    const documentChain = await createStuffDocumentsChain({
      llm: model,
      prompt,
    })

    // Get retriever with optional filters
    const retriever = await getCachedRetriever(filter)

    // Create retrieval chain
    const ragChain = await createRetrievalChain({
      retriever,
      combineDocsChain: documentChain,
    })

    return ragChain
  } catch (error) {
    console.error("Error creating RAG chain:", error)
    throw error
  }
}

export async function searchWithRAG(
  query: string,
  chatHistory: any[] = [],
  filter?: ProductFilter
) {
  try {
    const ragChain = await createProductRAGChain(filter)
    
    const response = await ragChain.invoke({
      input: query,
      chat_history: chatHistory,
    })

    // Extract product IDs from the response
    const _productIds = extractProductIds(response.answer)
    
    // Get unique product metadata from context
    const products = response.context
      .map((doc: any) => doc.metadata)
      .filter((product: any, index: number, self: any[]) => 
        index === self.findIndex((p) => p.id === product.id)
      )
      .slice(0, 4) // Limit to 4 products

    return {
      response: response.answer,
      products: products.map((p: any) => p.id),
      productDetails: products,
    }
  } catch (error) {
    console.error("Error in RAG search:", error)
    throw error
  }
}

function extractProductIds(text: string): string[] {
  const regex = /\[product_id:\s*(\d+)\]/gi
  const matches = text.matchAll(regex)
  return Array.from(matches, (m) => m[1])
}