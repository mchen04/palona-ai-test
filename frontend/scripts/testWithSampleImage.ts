import { config } from "dotenv"
import fs from "fs"

// Load environment variables
config({ path: ".env.local" })

/**
 * Test with a known good base64 image
 * This is a 28x28 image of a white square with black border
 */
async function testWithSampleImage() {
  try {
    console.log("Testing image search API with sample image...")
    
    // Create a 28x28 image (similar size to MNIST dataset)
    // This creates a white square with black border
    const sampleImageBase64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAcABwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhFB8FFhcQcTFCKBkaGxwdHhCBYjMvEVQlJyJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dbX2Nna4uPk5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK/9k="
    
    const buffer = Buffer.from(sampleImageBase64, 'base64')
    
    // Verify the image
    console.log("Image size:", buffer.length, "bytes")
    fs.writeFileSync('/tmp/sample-test.jpg', buffer)
    console.log("Saved to /tmp/sample-test.jpg")
    
    const blob = new Blob([buffer], { type: 'image/jpeg' })
    const file = new File([blob], 'sample.jpg', { type: 'image/jpeg' })
    
    const formData = new FormData()
    formData.append('image', file)
    formData.append('useRAG', 'true')
    
    const response = await fetch('http://localhost:3001/api/search/image', {
      method: 'POST',
      body: formData,
    })
    
    const result = await response.json()
    
    console.log("\n=== Results ===")
    console.log("Success:", result.success)
    
    if (result.error) {
      console.error("Error:", result.error)
      console.error("Details:", result.details)
    } else {
      console.log("Analysis:", result.imageAnalysis?.description?.substring(0, 150))
      console.log("Features:", result.imageAnalysis?.features)
      console.log("Products found:", result.products?.length || 0)
      
      if (result.products && result.products.length > 0) {
        console.log("\nTop matches:")
        result.products.slice(0, 3).forEach((p: any, i: number) => {
          console.log(`${i + 1}. ${p.name} (${p.category}) - Score: ${p.relevanceScore}`)
        })
      }
    }
    
  } catch (error) {
    console.error("Test failed:", error)
  }
}

testWithSampleImage()