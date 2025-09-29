import { NextRequest, NextResponse } from "next/server"
import { searchProductsByImage, validateImage, fileToBase64 } from "@/lib/ai/imageSearch"

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData()
    const file = formData.get("image") as File
    const useRAG = formData.get("useRAG") === "true"

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      )
    }

    // Validate the image
    const validation = validateImage(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Convert to base64
    const imageBase64 = await fileToBase64(file)

    // Search for products based on the image
    const results = await searchProductsByImage(
      imageBase64,
      file.type,
      useRAG
    )

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error) {
    console.error("Image search API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process image search",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/search/image",
    methods: ["POST"],
    description: "Image-based product search using Gemini vision",
    requirements: {
      image: "Required - JPEG, PNG, or WebP format, max 4MB",
      useRAG: "Optional - boolean, whether to use RAG for intelligent responses"
    }
  })
}