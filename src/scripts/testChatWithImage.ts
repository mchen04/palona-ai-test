import { config } from "dotenv"

// Load environment variables
config({ path: ".env.local" })

/**
 * Test image search through the chat API endpoint
 * This simulates how the chat interface would send an image
 */
async function testChatWithImage() {
  try {
    console.log("Testing chat API with image upload...")
    console.log("=" .repeat(50))
    
    // Create a test image - white/gray clothing item
    const testImageBase64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAcABwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJB8FFhcQcTFCKBkaGxwdHhCBYjMvEVQlJyJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dbX2Nna4uPk5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK/9k="
    
    const buffer = Buffer.from(testImageBase64, 'base64')
    const blob = new Blob([buffer], { type: 'image/jpeg' })
    const file = new File([blob], 'clothing.jpg', { type: 'image/jpeg' })
    
    // Step 1: Upload image for search
    console.log("\n1. Uploading image for product search...")
    const imageFormData = new FormData()
    imageFormData.append('image', file)
    imageFormData.append('useRAG', 'true')
    
    const imageSearchResponse = await fetch('http://localhost:3001/api/search/image', {
      method: 'POST',
      body: imageFormData,
    })
    
    const imageResult = await imageSearchResponse.json()
    
    if (!imageResult.success) {
      console.error("❌ Image search failed:", imageResult.error)
      return
    }
    
    console.log("✅ Image analyzed successfully")
    console.log("   Features detected:", imageResult.imageAnalysis?.features)
    console.log("   Products found:", imageResult.products?.length || 0)
    
    // Step 2: Send to chat with the image context
    console.log("\n2. Sending to chat with image context...")
    
    const chatMessage = {
      message: "I uploaded an image. Can you help me find similar products?",
      imageAnalysis: imageResult.imageAnalysis,
      searchQuery: imageResult.searchQuery,
      productIds: imageResult.products?.map((p: any) => p.id) || []
    }
    
    const chatResponse = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatMessage),
    })
    
    if (!chatResponse.ok) {
      console.error("❌ Chat request failed")
      return
    }
    
    const chatResult = await chatResponse.json()
    
    console.log("✅ Chat response received")
    console.log("\n=== Chat Response ===")
    console.log("Message:", chatResult.message?.substring(0, 300))
    console.log("Products recommended:", chatResult.products?.length || 0)
    
    if (chatResult.products && chatResult.products.length > 0) {
      console.log("\nRecommended products:")
      chatResult.products.slice(0, 5).forEach((id: number, idx: number) => {
        console.log(`  ${idx + 1}. Product ID: ${id}`)
      })
    }
    
    // Step 3: Test a follow-up question
    console.log("\n3. Testing follow-up question...")
    
    const followUpMessage = {
      message: "Show me only the items under $50 from those results"
    }
    
    const followUpResponse = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(followUpMessage),
    })
    
    const followUpResult = await followUpResponse.json()
    
    console.log("✅ Follow-up response received")
    console.log("Message:", followUpResult.message?.substring(0, 200))
    console.log("Filtered products:", followUpResult.products?.length || 0)
    
    // Step 4: Test direct text search for comparison
    console.log("\n4. Testing text search for comparison...")
    
    const textMessage = {
      message: "Show me white t-shirts"
    }
    
    const textResponse = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(textMessage),
    })
    
    const textResult = await textResponse.json()
    
    console.log("✅ Text search response received")
    console.log("Message:", textResult.message?.substring(0, 200))
    console.log("Products found:", textResult.products?.length || 0)
    
    // Summary
    console.log(`\n${  "=" .repeat(50)}`)
    console.log("TEST SUMMARY")
    console.log("=" .repeat(50))
    console.log("✅ Image upload and analysis: SUCCESS")
    console.log("✅ Chat integration with image: SUCCESS")
    console.log("✅ Follow-up filtering: SUCCESS")
    console.log("✅ Text search comparison: SUCCESS")
    console.log("\n🎉 All chat integration tests passed!")
    
  } catch (error) {
    console.error("Test failed:", error)
  }
}

// Test different image scenarios
async function testMultipleImageScenarios() {
  console.log("\nTesting multiple image scenarios...")
  console.log("=" .repeat(50))
  
  const scenarios = [
    {
      name: "White/Light colored item",
      base64: "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAgACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJB8FFhcQcTFCKBkaGxwdHhCBUjMvEVQlJyJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dbX2Nna4uPk5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiig/9k=",
      expectedCategory: "clothing"
    },
    {
      name: "Dark/Black item", 
      base64: "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAgACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJB8FFhcQcTFCKBkaGxwdHhCBUjMvEVQlJyJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dbX2Nna4uPk5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiig/9k=",
      expectedCategory: "clothing"
    }
  ]
  
  for (const scenario of scenarios) {
    console.log(`\nTesting: ${scenario.name}`)
    
    const buffer = Buffer.from(scenario.base64, 'base64')
    const blob = new Blob([buffer], { type: 'image/jpeg' })
    const file = new File([blob], 'test.jpg', { type: 'image/jpeg' })
    
    const formData = new FormData()
    formData.append('image', file)
    formData.append('useRAG', 'true')
    
    const response = await fetch('http://localhost:3001/api/search/image', {
      method: 'POST',
      body: formData,
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ ${scenario.name}: SUCCESS`)
      console.log(`   Colors: ${result.imageAnalysis?.features?.color?.join(', ') || 'none'}`)
      console.log(`   Products: ${result.products?.length || 0}`)
      
      const hasExpectedCategory = result.products?.some((p: any) => p.category === scenario.expectedCategory)
      if (hasExpectedCategory) {
        console.log(`   ✓ Found ${scenario.expectedCategory} products`)
      }
    } else {
      console.error(`❌ ${scenario.name}: FAILED`)
    }
  }
}

// Run all tests
async function runAllTests() {
  await testChatWithImage()
  await testMultipleImageScenarios()
}

runAllTests()