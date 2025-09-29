import fs from "fs"
import path from "path"

/**
 * Test script for image search functionality
 * Creates a test image and sends it to the API
 */
async function testImageSearch() {
  try {
    console.log("Testing image search API...")
    
    // Create a simple test image (1x1 pixel red PNG)
    const redPixelBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
    const buffer = Buffer.from(redPixelBase64, 'base64')
    
    // Create a Blob-like object
    const blob = new Blob([buffer], { type: 'image/png' })
    const file = new File([blob], 'test.png', { type: 'image/png' })
    
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
      console.log("- Description:", `${result.imageAnalysis.description?.substring(0, 200)  }...`)
      console.log("- Features:", result.imageAnalysis.features)
      console.log("- Confidence:", result.imageAnalysis.confidence)
    }
    
    console.log("\nSearch Query:", result.searchQuery)
    
    if (result.products && result.products.length > 0) {
      console.log("\nMatched Products:")
      result.products.slice(0, 3).forEach((product: any) => {
        console.log(`- ${product.name} ($${product.price}) - ${product.category}`)
      })
    } else {
      console.log("\nNo products matched")
    }
    
    if (result.response) {
      console.log("\nAI Response:", `${result.response.substring(0, 200)  }...`)
    }
    
  } catch (error) {
    console.error("Test failed:", error)
  }
}

// Run the test
testImageSearch()