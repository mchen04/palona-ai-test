import { config } from "dotenv"

import { searchProductsByImage } from "../lib/ai/imageSearch"

// Load environment variables
config({ path: ".env.local" })

async function testImageSearchDirectly() {
  console.log("Testing image search directly (bypassing API)...")
  console.log("=".repeat(50))
  
  try {
    // Create a proper test image (32x32 white square)
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAARklEQVRYR+3QQREAAAzCsOFf9WwYGlQJSi4d7bsBAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAgV8BB58AAiGGLyoAAAAASUVORK5CYII="
    
    console.log("Analyzing image...")
    const result = await searchProductsByImage(testImageBase64, "image/png", true)
    
    console.log("\n✅ Image analysis complete!")
    console.log("\nAnalysis Details:")
    console.log("- Description:", result.imageAnalysis.description?.substring(0, 150))
    console.log("- Features:", JSON.stringify(result.imageAnalysis.features))
    console.log("- Confidence:", result.imageAnalysis.confidence)
    
    console.log("\nSearch Query Generated:", result.searchQuery)
    
    console.log("\nProducts Matched:", result.products.length)
    if (result.products.length > 0) {
      console.log("\nTop 5 Matches:")
      result.products.slice(0, 5).forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} (${p.category})`)
        console.log(`   Price: $${p.price}`)
        console.log(`   Score: ${(p as any).relevanceScore || 'N/A'}`)
      })
    }
    
    if (result.response) {
      console.log("\nAI Response:")
      console.log(result.response)
    }
    
  } catch (error) {
    console.error("Error:", error)
    if (error instanceof Error) {
      console.error("Message:", error.message)
      console.error("Stack:", error.stack)
    }
  }
}

testImageSearchDirectly()