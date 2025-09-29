import { NextResponse } from "next/server"

import { initializePineconeIndex } from "@/lib/ai/pinecone"

export async function POST() {
  try {
    console.log("Initializing Pinecone index...")
    const _index = await initializePineconeIndex()
    
    return NextResponse.json({
      success: true,
      message: "Pinecone index initialized successfully",
      indexName: "product-embeddings",
    })
  } catch (error) {
    console.error("Failed to initialize Pinecone:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize Pinecone index",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/embeddings/init",
    description: "Initialize Pinecone index for product embeddings",
    note: "Use POST to initialize the index",
  })
}