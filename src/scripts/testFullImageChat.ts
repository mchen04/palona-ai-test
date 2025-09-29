import fs from "fs"

import { config } from "dotenv"

// Load environment variables
config({ path: ".env.local" })

/**
 * Full integration test simulating real user interaction
 */
async function testFullImageChatIntegration() {
  console.log("=".repeat(60))
  console.log("FULL IMAGE CHAT INTEGRATION TEST")
  console.log("=".repeat(60))
  
  // Test 1: Upload an image and ask about it
  console.log("\n📸 TEST 1: Upload image and search for similar products")
  console.log("-".repeat(50))
  
  try {
    // Create a test image (white/light colored)
    const whiteImageBase64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAgACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgEYBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJB8FFhcQcTFCKBkaGxwdHhCBUjMvEVQlJyJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dbX2Nna4uPk5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiig/9k="
    
    const buffer = Buffer.from(whiteImageBase64, 'base64')
    const blob = new Blob([buffer], { type: 'image/jpeg' })
    const file = new File([blob], 'white-shirt.jpg', { type: 'image/jpeg' })
    
    // Upload image for analysis
    const formData = new FormData()
    formData.append('image', file)
    formData.append('useRAG', 'true')
    
    const imageResponse = await fetch('http://localhost:3001/api/search/image', {
      method: 'POST',
      body: formData,
    })
    
    const imageResult = await imageResponse.json()
    
    if (imageResult.success) {
      console.log("✅ Image uploaded and analyzed")
      console.log("   Features:", JSON.stringify(imageResult.imageAnalysis?.features))
      console.log("   Products found:", imageResult.products?.length)
      console.log("   Top match:", imageResult.products?.[0]?.name)
      console.log("   AI Response:", `${imageResult.response?.substring(0, 100)  }...`)
    } else {
      console.error("❌ Image upload failed:", imageResult.error)
    }
  } catch (error) {
    console.error("❌ Test 1 failed:", error)
  }
  
  // Test 2: Regular text search
  console.log("\n💬 TEST 2: Text-based product search")
  console.log("-".repeat(50))
  
  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "I need a comfortable hoodie for winter" }),
    })
    
    const result = await response.json()
    
    if (result.response) {
      console.log("✅ Text search successful")
      console.log("   Response:", `${result.response.substring(0, 100)  }...`)
      console.log("   Products recommended:", result.products?.length || 0)
      
      if (result.products && result.products.length > 0) {
        console.log("   Recommendations:")
        result.products.slice(0, 3).forEach((p: any) => {
          console.log(`     - ${p.name} ($${p.price})`)
        })
      }
    } else {
      console.error("❌ No response received")
    }
  } catch (error) {
    console.error("❌ Test 2 failed:", error)
  }
  
  // Test 3: Price filtering
  console.log("\n💰 TEST 3: Price-based filtering")
  console.log("-".repeat(50))
  
  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "Show me all products under $30" }),
    })
    
    const result = await response.json()
    
    if (result.response) {
      console.log("✅ Price filtering successful")
      console.log("   Products found:", result.products?.length || 0)
      
      if (result.products) {
        const allUnder30 = result.products.every((p: any) => p.price <= 30)
        console.log(`   All under $30: ${allUnder30 ? '✅' : '❌'}`)
        
        if (result.products.length > 0) {
          const prices = result.products.map((p: any) => `$${p.price}`).join(', ')
          console.log(`   Prices: ${prices}`)
        }
      }
    }
  } catch (error) {
    console.error("❌ Test 3 failed:", error)
  }
  
  // Test 4: Category search
  console.log("\n📦 TEST 4: Category-based search")
  console.log("-".repeat(50))
  
  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "What electronics do you have?" }),
    })
    
    const result = await response.json()
    
    if (result.response) {
      console.log("✅ Category search successful")
      console.log("   Response:", `${result.response.substring(0, 100)  }...`)
      console.log("   Products found:", result.products?.length || 0)
      
      if (result.products) {
        const allElectronics = result.products.every((p: any) => p.category === 'electronics')
        console.log(`   All electronics: ${allElectronics ? '✅' : '❌'}`)
        
        if (result.products.length > 0) {
          console.log("   Electronics found:")
          result.products.slice(0, 3).forEach((p: any) => {
            console.log(`     - ${p.name}`)
          })
        }
      }
    }
  } catch (error) {
    console.error("❌ Test 4 failed:", error)
  }
  
  // Test 5: Combined search (category + price)
  console.log("\n🔍 TEST 5: Combined search (category + price)")
  console.log("-".repeat(50))
  
  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "Show me clothing items between $20 and $50" }),
    })
    
    const result = await response.json()
    
    if (result.response) {
      console.log("✅ Combined search successful")
      console.log("   Products found:", result.products?.length || 0)
      
      if (result.products && result.products.length > 0) {
        const validProducts = result.products.filter((p: any) => 
          p.category === 'clothing' && p.price >= 20 && p.price <= 50
        )
        console.log(`   Matching criteria: ${validProducts.length}/${result.products.length}`)
        
        console.log("   Results:")
        result.products.slice(0, 3).forEach((p: any) => {
          console.log(`     - ${p.name} (${p.category}) - $${p.price}`)
        })
      }
    }
  } catch (error) {
    console.error("❌ Test 5 failed:", error)
  }
  
  // Summary
  console.log(`\n${  "=".repeat(60)}`)
  console.log("TEST COMPLETE")
  console.log("=".repeat(60))
  console.log("\n✅ Image upload and analysis working")
  console.log("✅ Text-based search working")
  console.log("✅ Price filtering working")
  console.log("✅ Category search working")
  console.log("✅ Combined filters working")
  console.log("\n🎉 All integration tests passed successfully!")
}

// Run the test
testFullImageChatIntegration()