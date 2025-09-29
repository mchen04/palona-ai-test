import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { TaskType } from "@google/generative-ai"
import { PineconeStore } from "@langchain/pinecone"

import { getPinecone, PINECONE_INDEX_NAME, PINECONE_NAMESPACE } from "./pinecone"

export interface ProductFilter {
  category?: string
  minPrice?: number
  maxPrice?: number
}

// Cache instances at module level (persists across requests in warm containers)
let vectorStore: PineconeStore | null = null
let embeddings: GoogleGenerativeAIEmbeddings | null = null

async function getVectorStore() {
  if (!vectorStore) {
    // Initialize embeddings once
    if (!embeddings) {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured")
      }
      
      // Use Gemini embeddings for vector search
      embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004", // Latest Gemini embedding model
        apiKey,
        taskType: TaskType.RETRIEVAL_DOCUMENT,
      })
    }

    const pc = getPinecone()
    const index = pc.index(PINECONE_INDEX_NAME)
    
    vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAMESPACE,
    })
  }
  
  return vectorStore
}

export async function getCachedRetriever(filter?: ProductFilter) {
  try {
    const store = await getVectorStore()
    
    // Build filter
    const pineconeFilter: any = {}
    if (filter?.category) {
      pineconeFilter.category = { $eq: filter.category }
    }
    if (filter?.minPrice !== undefined) {
      pineconeFilter.price = { $gte: filter.minPrice }
    }
    if (filter?.maxPrice !== undefined) {
      pineconeFilter.price = { ...pineconeFilter.price, $lte: filter.maxPrice }
    }

    // Create retriever with filter
    return store.asRetriever({
      k: 4,
      filter: Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined,
    })
  } catch (error) {
    console.error("Error creating cached retriever:", error)
    throw error
  }
}

// Helper to clear cache if needed
export function clearCache() {
  vectorStore = null
  embeddings = null
}