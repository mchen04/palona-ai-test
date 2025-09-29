import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
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
      embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey: process.env.GOOGLE_API_KEY!,
      })
    }

    const pc = getPinecone()
    const index = pc.index(PINECONE_INDEX_NAME)
    
    // Initialize vector store once
    try {
      vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
        namespace: PINECONE_NAMESPACE,
        maxConcurrency: 5, // Per docs recommendation
      })
    } catch (error) {
      console.error("Error creating PineconeStore:", error)
      throw error
    }
  }
  return vectorStore
}

export async function getCachedRetriever(filter?: ProductFilter) {
  const store = await getVectorStore()
  
  // Build filter for Pinecone
  const pineconeFilter: Record<string, any> = {}
  
  if (filter?.category) {
    pineconeFilter.category = { $eq: filter.category }
  }
  
  if (filter?.minPrice !== undefined || filter?.maxPrice !== undefined) {
    pineconeFilter.price = {}
    if (filter.minPrice !== undefined) {
      pineconeFilter.price.$gte = filter.minPrice
    }
    if (filter.maxPrice !== undefined) {
      pineconeFilter.price.$lte = filter.maxPrice
    }
  }

  const retriever = store.asRetriever({
    searchType: "similarity",
    k: 3, // Reduced from 5 to 3 for faster results
    filter: Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined,
  })
  return retriever
}