import { NextRequest, NextResponse } from "next/server"
import { searchProducts } from "@/lib/ai/retriever"
import { searchWithRAG } from "@/lib/ai/ragChain"
import { ProductFilter } from "@/lib/ai/retriever"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, filters, useRAG = false } = body

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      )
    }

    // Parse filters
    const productFilter: ProductFilter = {}
    
    if (filters?.category) {
      productFilter.category = filters.category
    }
    
    if (filters?.minPrice !== undefined) {
      productFilter.minPrice = filters.minPrice
    }
    
    if (filters?.maxPrice !== undefined) {
      productFilter.maxPrice = filters.maxPrice
    }

    let results

    if (useRAG) {
      // Use RAG chain for more intelligent responses
      const ragResult = await searchWithRAG(query, [], productFilter)
      results = {
        products: ragResult.productDetails || [],
        response: ragResult.response,
        query,
      }
    } else {
      // Direct vector search
      const products = await searchProducts(query, productFilter)
      results = {
        products,
        query,
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to search products",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// GET endpoint for basic health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/search/products",
    methods: ["POST"],
    description: "Semantic product search with vector embeddings",
  })
}