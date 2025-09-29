import { Pinecone } from "@pinecone-database/pinecone"

let pineconeInstance: Pinecone | null = null

export function getPinecone(): Pinecone {
  if (!pineconeInstance) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY environment variable is required")
    }
    pineconeInstance = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })
  }
  return pineconeInstance
}

export const pinecone = getPinecone

export const PINECONE_INDEX_NAME = "product-embeddings"
export const PINECONE_NAMESPACE = "products"

export async function initializePineconeIndex() {
  try {
    const pc = getPinecone()
    const indexList = await pc.listIndexes()
    const indexExists = indexList.indexes?.some(
      (index) => index.name === PINECONE_INDEX_NAME
    )

    if (!indexExists) {
      console.log("Creating Pinecone index...")
      await pc.createIndex({
        name: PINECONE_INDEX_NAME,
        dimension: 768, // Google's text-embedding-004 dimension
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      })
      console.log("Pinecone index created successfully")
      
      // Wait for index to be ready
      console.log("Waiting for index to be ready...")
      await new Promise(resolve => setTimeout(resolve, 5000))
    } else {
      console.log("Pinecone index already exists")
    }

    return pc.index(PINECONE_INDEX_NAME)
  } catch (error) {
    console.error("Error initializing Pinecone index:", error)
    throw error
  }
}