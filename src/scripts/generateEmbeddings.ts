import dotenv from "dotenv"
import path from "path"

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

import { Document } from "@langchain/core/documents"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { TaskType } from "@google/generative-ai"
import { PineconeStore } from "@langchain/pinecone"

import { pinecone, PINECONE_INDEX_NAME, PINECONE_NAMESPACE, initializePineconeIndex } from "../lib/ai/pinecone"
import { products } from "../lib/products"

async function generateAndStoreEmbeddings() {
  try {
    console.log("Starting embedding generation...")

    // Validate API keys
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required")
    }

    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY environment variable is required")
    }

    // Initialize Pinecone index
    console.log("Initializing Pinecone index...")
    const index = await initializePineconeIndex()
    console.log("Pinecone index ready")

    // Initialize embeddings model
    console.log("Initializing Gemini embeddings model...")
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GEMINI_API_KEY,
      taskType: TaskType.RETRIEVAL_DOCUMENT,
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
    console.log("Generating embeddings and storing in Pinecone...")
    await PineconeStore.fromDocuments(documents, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAMESPACE,
      maxConcurrency: 5,
    })

    console.log("✅ Successfully generated and stored embeddings for all products!")
    console.log(`   - Products embedded: ${documents.length}`)
    console.log(`   - Index: ${PINECONE_INDEX_NAME}`)
    console.log(`   - Namespace: ${PINECONE_NAMESPACE}`)
    console.log("\n🎉 Your vector database is ready! You can now run the app.")
  } catch (error) {
    console.error("❌ Error generating embeddings:", error)
    console.error("\nTroubleshooting:")
    console.error("1. Check your .env.local file has GEMINI_API_KEY and PINECONE_API_KEY")
    console.error("2. Verify your Pinecone index is created (check Pinecone console)")
    console.error("3. Ensure your API keys are valid and have proper permissions")
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