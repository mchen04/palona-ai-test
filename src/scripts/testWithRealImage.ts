import fs from "fs"
import path from "path"

import { config } from "dotenv"

// Load environment variables
config({ path: ".env.local" })

/**
 * Test with a larger, more realistic image
 * Creates a 10x10 white square PNG
 */
async function testWithLargerImage() {
  try {
    console.log("Testing image search API with larger image...")
    
    // Create a 10x10 white square PNG (more realistic than 1x1)
    // This is a valid PNG that Gemini should be able to process
    const largerImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAH0lEQVQoU2P8////fwYKAOPo4tHFo4tHF48uHl08LAAALKEd/cJqgnkAAAAASUVORK5CYII="
    
    const buffer = Buffer.from(largerImageBase64, 'base64')
    const blob = new Blob([buffer], { type: 'image/png' })
    const file = new File([blob], 'test-image.png', { type: 'image/png' })
    
    // Save to file for debugging
    fs.writeFileSync('/tmp/test-image.png', buffer)
    console.log("Test image saved to /tmp/test-image.png")
    console.log("Image size:", buffer.length, "bytes")
    
    // Create FormData
    const formData = new FormData()
    formData.append('image', file)
    formData.append('useRAG', 'true')
    
    // Send request
    const response = await fetch('http://localhost:3001/api/search/image', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error("API Error:", error)
      return
    }
    
    const result = await response.json()
    
    console.log("\n=== Image Search Results ===")
    console.log("Success:", result.success)
    
    if (result.imageAnalysis) {
      console.log("\nImage Analysis:")
      console.log("- Description:", result.imageAnalysis.description?.substring(0, 200))
      console.log("- Features:", JSON.stringify(result.imageAnalysis.features, null, 2))
      console.log("- Confidence:", result.imageAnalysis.confidence)
    }
    
    console.log("\nSearch Query:", result.searchQuery)
    
    if (result.products && result.products.length > 0) {
      console.log(`\nMatched Products (${  result.products.length  } found):`)
      result.products.slice(0, 5).forEach((product: any, idx: number) => {
        console.log(`${idx + 1}. ${product.name} ($${product.price})`)
        console.log(`   Category: ${product.category}`)
        console.log(`   Score: ${product.relevanceScore || 'N/A'}`)
      })
    } else {
      console.log("\nNo products matched")
    }
    
    if (result.response) {
      console.log("\nAI Response:")
      console.log(result.response.substring(0, 300))
    }
    
  } catch (error) {
    console.error("Test failed:", error)
  }
}

// Alternative: Test with a real clothing image from a URL
async function testWithUrlImage() {
  try {
    console.log("\nTesting with image from URL...")
    
    // Use a sample image URL (white t-shirt)
    const imageUrl = "https://via.placeholder.com/150/FFFFFF/000000?text=T-Shirt"
    
    // Fetch the image
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')
    
    const blob = new Blob([imageBuffer], { type: 'image/png' })
    const file = new File([blob], 'tshirt.png', { type: 'image/png' })
    
    const formData = new FormData()
    formData.append('image', file)
    formData.append('useRAG', 'true')
    
    const response = await fetch('http://localhost:3001/api/search/image', {
      method: 'POST',
      body: formData,
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log("✅ URL image test successful")
      console.log("Products found:", result.products?.length || 0)
      if (result.products && result.products.length > 0) {
        console.log("Top match:", result.products[0].name)
      }
    } else {
      console.error("❌ URL image test failed:", result.error)
    }
    
  } catch (error) {
    console.error("URL test failed:", error)
  }
}

// Run both tests
async function runTests() {
  await testWithLargerImage()
  await testWithUrlImage()
}

runTests()