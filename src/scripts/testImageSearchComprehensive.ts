import fs from "fs"
import path from "path"

/**
 * Comprehensive test script for image search functionality
 * Tests multiple image scenarios
 */

// Helper function to create test images
function createTestImages() {
  return {
    // Red pixel (simulating red clothing)
    redPixel: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
    
    // Blue pixel (simulating blue jeans)
    bluePixel: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    
    // Black pixel (simulating black shoes)
    blackPixel: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYGBgAAAABQABXvMqOgAAAABJRU5ErkJggg==",
    
    // White pixel (simulating white shirt)
    whitePixel: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAIAQMA/5cUXwAAAABJRU5ErkJggg==",
    
    // Gray pixel (simulating gray hoodie)
    grayPixel: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
  }
}

async function testSingleImage(name: string, base64: string, expectedCategory?: string) {
  try {
    console.log(`\n=== Testing ${name} ===`)
    
    const buffer = Buffer.from(base64, 'base64')
    const blob = new Blob([buffer], { type: 'image/png' })
    const file = new File([blob], `${name}.png`, { type: 'image/png' })
    
    const formData = new FormData()
    formData.append('image', file)
    formData.append('useRAG', 'true')
    
    const response = await fetch('http://localhost:3001/api/search/image', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error(`❌ API Error for ${name}:`, error)
      return false
    }
    
    const result = await response.json()
    
    if (result.success) {
      console.log("✅ Success")
      console.log(`   Analysis: ${result.imageAnalysis?.description?.substring(0, 100)}...`)
      console.log(`   Features:`, JSON.stringify(result.imageAnalysis?.features || {}))
      console.log(`   Query: "${result.searchQuery}"`)
      console.log(`   Products found: ${result.products?.length || 0}`)
      
      if (result.products && result.products.length > 0) {
        console.log(`   Top match: ${result.products[0].name} (${result.products[0].category})`)
      }
      
      if (expectedCategory && result.products?.length > 0) {
        const hasExpectedCategory = result.products.some((p: any) => p.category === expectedCategory)
        if (hasExpectedCategory) {
          console.log(`   ✓ Found expected category: ${expectedCategory}`)
        } else {
          console.log(`   ⚠ Expected category ${expectedCategory} not in results`)
        }
      }
      
      return true
    } else {
      console.error(`❌ Failed for ${name}:`, result.error)
      return false
    }
    
  } catch (error) {
    console.error(`❌ Test failed for ${name}:`, error)
    return false
  }
}

async function testWithoutRAG() {
  try {
    console.log("\n=== Testing without RAG (direct vector search) ===")
    
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAIAQMA/5cUXwAAAABJRU5ErkJggg=="
    const buffer = Buffer.from(base64, 'base64')
    const blob = new Blob([buffer], { type: 'image/png' })
    const file = new File([blob], 'test.png', { type: 'image/png' })
    
    const formData = new FormData()
    formData.append('image', file)
    formData.append('useRAG', 'false')
    
    const response = await fetch('http://localhost:3001/api/search/image', {
      method: 'POST',
      body: formData,
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log("✅ Direct vector search successful")
      console.log(`   Products found: ${result.products?.length || 0}`)
      console.log(`   Has AI response: ${!!result.response}`)
      return true
    } else {
      console.error("❌ Direct vector search failed:", result.error)
      return false
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error)
    return false
  }
}

async function testInvalidImage() {
  try {
    console.log("\n=== Testing invalid image ===")
    
    const invalidBase64 = "invalid_base64_data"
    const buffer = Buffer.from(invalidBase64, 'base64')
    const blob = new Blob([buffer], { type: 'image/png' })
    const file = new File([blob], 'invalid.png', { type: 'image/png' })
    
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await fetch('http://localhost:3001/api/search/image', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      console.log("✅ Invalid image correctly rejected")
      return true
    } else {
      console.error("❌ Invalid image should have been rejected")
      return false
    }
    
  } catch (error) {
    console.log("✅ Invalid image handling working")
    return true
  }
}

async function runAllTests() {
  console.log("Starting comprehensive image search tests...")
  console.log("=" .repeat(50))
  
  const images = createTestImages()
  const results = []
  
  // Test different colored images
  results.push(await testSingleImage("Red clothing", images.redPixel, "clothing"))
  results.push(await testSingleImage("Blue jeans", images.bluePixel, "clothing"))
  results.push(await testSingleImage("Black shoes", images.blackPixel, "clothing"))
  results.push(await testSingleImage("White shirt", images.whitePixel, "clothing"))
  results.push(await testSingleImage("Gray hoodie", images.grayPixel, "clothing"))
  
  // Test without RAG
  results.push(await testWithoutRAG())
  
  // Test error handling
  results.push(await testInvalidImage())
  
  // Summary
  console.log(`\n${  "=" .repeat(50)}`)
  console.log("TEST SUMMARY")
  console.log("=" .repeat(50))
  const passed = results.filter(r => r).length
  const total = results.length
  console.log(`Passed: ${passed}/${total} tests`)
  
  if (passed === total) {
    console.log("🎉 All tests passed!")
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed`)
  }
}

// Run the tests
runAllTests()