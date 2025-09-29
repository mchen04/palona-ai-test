import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
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
    // Initialize embeddings model
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not configured")
    }
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey,
    })

    // Get Pinecone index
    const pc = getPinecone()
    const index = pc.index(PINECONE_INDEX_NAME)

    // Create vector store
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAMESPACE,
    })

    // Build filter object for Pinecone
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

    // Create retriever with optional filters
    return vectorStore.asRetriever({
      searchType: "similarity",
      k: 5,
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
    
    // Add timeout to prevent hanging
    const searchPromise = retriever.invoke(query)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Vector search timeout after 15 seconds')), 15000)
    )
    
    const results = await Promise.race([searchPromise, timeoutPromise]) as any[]
    
    // Extract product metadata from results
    const products = results.map((doc) => ({
      id: doc.metadata.id,
      name: doc.metadata.name,
      price: doc.metadata.price,
      category: doc.metadata.category,
      image: doc.metadata.image,
      description: doc.metadata.description,
      relevanceScore: doc.metadata._distance || 0,
    }))
    
    return products
  } catch (error) {
    console.error("Error searching products:", error)
    throw error
  }
}