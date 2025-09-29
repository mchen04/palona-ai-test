import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { TaskType } from "@google/generative-ai"
import { PineconeStore } from "@langchain/pinecone"

import { getCachedRetriever } from "./cachedRetriever"
import { getPinecone, PINECONE_INDEX_NAME, PINECONE_NAMESPACE } from "./pinecone"

export interface ProductFilter {
  category?: string
  minPrice?: number
  maxPrice?: number
}

export async function getProductRetriever(filter?: ProductFilter) {
  try {
    // Initialize embeddings model using Gemini API key
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured")
    }
    
    // Use Gemini embeddings for vector search
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004", // Latest Gemini embedding model
      apiKey,
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    })

    // Get Pinecone index
    const pc = getPinecone()
    const index = pc.index(PINECONE_INDEX_NAME)

    // Create vector store
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAMESPACE,
    })

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
    return vectorStore.asRetriever({
      k: 4,
      filter: Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined,
    })
  } catch (error) {
    console.error("Error creating product retriever:", error)
    throw error
  }
}

export async function searchProducts(query: string, filter?: ProductFilter) {
  try {
    const retriever = await getCachedRetriever(filter)
    const results = await retriever.invoke(query)
    
    return results.map((doc: any) => ({
      id: doc.metadata.id,
      name: doc.metadata.name,
      price: doc.metadata.price,
      description: doc.pageContent,
      image: doc.metadata.image,
      category: doc.metadata.category,
      features: doc.metadata.features,
    }))
  } catch (error) {
    console.error("Error searching products:", error)
    return []
  }
}