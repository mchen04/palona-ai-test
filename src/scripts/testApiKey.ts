import * as path from "path"

import { GoogleGenerativeAI } from "@google/generative-ai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function testGoogleApiKey() {
  console.log("=== Testing Google API Key ===\n")
  
  const apiKey = process.env.GOOGLE_API_KEY
  
  if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY not found in environment variables")
    process.exit(1)
  }
  
  console.log(`✓ API Key found: ${apiKey.substring(0, 10)}...`)
  
  // Test 1: Direct Google Generative AI SDK
  console.log("\n1. Testing direct Google Generative AI SDK...")
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    const result = await model.generateContent("Say 'Hello World' and nothing else")
    const response = await result.response
    const text = response.text()
    
    console.log(`✓ Direct SDK test successful. Response: ${text}`)
  } catch (error) {
    console.error("❌ Direct SDK test failed:")
    console.error(error)
  }
  
  // Test 2: LangChain wrapper
  console.log("\n2. Testing LangChain Google Generative AI wrapper...")
  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey,
      temperature: 0.3,
      maxOutputTokens: 100,
      verbose: true,
    })
    
    // Set a timeout for the LangChain test
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("LangChain test timeout after 10 seconds")), 10000)
    })
    
    const testPromise = model.invoke("Say 'Hello from LangChain' and nothing else")
    
    const result = await Promise.race([testPromise, timeoutPromise])
    
    if (result && typeof result === 'object' && 'content' in result) {
      console.log(`✓ LangChain test successful. Response: ${result.content}`)
    } else {
      console.log(`✓ LangChain test successful. Response:`, result || 'No response')
    }
  } catch (error) {
    console.error("❌ LangChain test failed:")
    console.error(error)
  }
  
  // Test 3: Try gemini-2.0-flash
  console.log("\n3. Testing gemini-2.0-flash model...")
  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey,
      temperature: 0.3,
      maxOutputTokens: 100,
    })
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("gemini-2.0 test timeout after 10 seconds")), 10000)
    })
    
    const testPromise = model.invoke("Say 'Hello from Gemini 2.0' and nothing else")
    
    const result = await Promise.race([testPromise, timeoutPromise])
    
    if (result && typeof result === 'object' && 'content' in result) {
      console.log(`✓ Gemini 2.0 test successful. Response: ${result.content}`)
    } else {
      console.log(`✓ Gemini 2.0 test successful. Response:`, result || 'No response')
    }
  } catch (error) {
    console.error("❌ Gemini 2.0 test failed:")
    console.error(error)
  }
  
  console.log("\n=== Test Complete ===")
}

// Run the test
testGoogleApiKey().catch(console.error)