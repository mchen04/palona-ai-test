import dotenv from "dotenv"

import path from "path"

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

import { Document } from "@langchain/core/documents"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { PineconeStore } from "@langchain/pinecone"

import { pinecone, PINECONE_INDEX_NAME, PINECONE_NAMESPACE, initializePineconeIndex } from "../lib/ai/pinecone"
import { products } from "../lib/products"

async function generateAndStoreEmbeddings() {
  try {
    console.log("Starting embedding generation...")
    
    // Initialize Pinecone index
    console.log("Initializing Pinecone index...")
    const index = await initializePineconeIndex()
    console.log("Pinecone index ready")

    // Initialize embeddings model
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GOOGLE_API_KEY!,
    })

    // Prepare documents with rich metadata
    const documents = products.map(
      (product) =>
        new Document({
          pageContent: `Product ID: ${product.id}. ${product.name}. ${product.description}. Category: ${product.category}. Price: $${product.price}. Perfect for: ${getProductTags(product)}`,
          metadata: {
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            image: product.image,
            description: product.description,
          },
        })
    )

    console.log(`Prepared ${documents.length} products for embedding...`)

    // Create vector store and add documents
    await PineconeStore.fromDocuments(documents, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAMESPACE,
      maxConcurrency: 5,
    })

    console.log("✅ Successfully generated and stored embeddings for all products!")
  } catch (error) {
    console.error("Error generating embeddings:", error)
    process.exit(1)
  }
}

function getProductTags(product: any): string {
  const tags: Record<string, string[]> = {
    clothing: ["fashion", "apparel", "style", "outfit", "wardrobe"],
    electronics: ["tech", "gadget", "device", "technology", "smart"],
    home: ["living", "decor", "household", "comfort", "interior"],
    sports: ["fitness", "exercise", "athletic", "workout", "active"],
  }

  const categoryTags = tags[product.category] || []
  
  // Add specific tags based on product name
  const specificTags: string[] = []
  const name = product.name.toLowerCase()
  
  if (name.includes("winter") || name.includes("cozy")) specificTags.push("cold weather", "warm")
  if (name.includes("running") || name.includes("gym")) specificTags.push("exercise", "training")
  if (name.includes("smart")) specificTags.push("intelligent", "connected", "modern")
  if (name.includes("premium") || name.includes("pro")) specificTags.push("professional", "high-end")
  
  return [...categoryTags, ...specificTags].join(", ")
}

// Run the script
generateAndStoreEmbeddings()