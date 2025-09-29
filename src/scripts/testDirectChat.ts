import * as path from "path"

import * as dotenv from "dotenv"

// Load environment variables BEFORE importing anything else
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Now import after env vars are loaded
import { processChatMessage } from "../lib/ai/chatAgent"

async function testDirectChat() {
  console.log("=== Testing Direct Chat Function ===\n")
  
  const apiKey = process.env.GOOGLE_API_KEY
  
  if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY not found")
    process.exit(1)
  }
  
  console.log("API Key loaded:", `${apiKey.substring(0, 10)  }...`)
  
  try {
    console.log("\nTesting processChatMessage with 'hello'...")
    console.time("Chat Response Time")
    
    const response = await processChatMessage("hello", "test_session_123")
    
    console.timeEnd("Chat Response Time")
    console.log("\n✓ Response received:")
    console.log("  Message:", response.response)
    console.log("  Session:", response.sessionId)
    console.log("  Products:", response.products?.length || 0)
    
  } catch (error) {
    console.error("\n❌ Test failed:")
    console.error(error)
    
    if (error instanceof Error) {
      console.error("\nError details:")
      console.error("  Name:", error.name)
      console.error("  Message:", error.message)
      console.error("  Stack:", error.stack)
    }
  }
  
  console.log("\n=== Test Complete ===")
}

// Run the test
testDirectChat().catch(console.error)