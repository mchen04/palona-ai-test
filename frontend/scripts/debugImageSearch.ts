import { config } from "dotenv"
import { analyzeProductImage } from "../lib/ai/imageAnalyzer"

// Load environment variables
config({ path: ".env.local" })

async function debugImageAnalysis() {
  try {
    console.log("Testing Gemini Vision API...")
    console.log("API Key exists:", !!process.env.GOOGLE_API_KEY)
    console.log("API Key length:", process.env.GOOGLE_API_KEY?.length)
    
    // Create a simple white pixel image
    const whitePixelBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAIAQMA/5cUXwAAAABJRU5ErkJggg=="
    
    console.log("\nAnalyzing image...")
    const result = await analyzeProductImage(whitePixelBase64, "image/png")
    
    console.log("\nAnalysis Result:")
    console.log(JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error("\nError occurred:")
    console.error(error)
    
    if (error instanceof Error) {
      console.error("\nError details:")
      console.error("Message:", error.message)
      console.error("Stack:", error.stack)
    }
  }
}

debugImageAnalysis()