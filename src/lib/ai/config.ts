import { GoogleGenerativeAI } from "@google/generative-ai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY environment variable is required")
}

// Model hierarchy for fallback (from fastest/cheapest to most capable)
const modelHierarchy = [
  "gemini-2.5-flash-lite",  // 15 RPM free tier, fastest
  "gemini-2.5-flash",       // 10 RPM free tier
  "gemini-2.0-flash",       // 15 RPM free tier, 1M TPM
  "gemini-2.5-pro",         // 5 RPM free tier, most capable
]

let currentModelIndex = 0

function createGeminiModel(modelName: string) {
  return new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.3,
    maxOutputTokens: 2048,
    verbose: false,
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT" as any,
        threshold: "BLOCK_MEDIUM_AND_ABOVE" as any,
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH" as any,
        threshold: "BLOCK_MEDIUM_AND_ABOVE" as any,
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
        threshold: "BLOCK_MEDIUM_AND_ABOVE" as any,
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
        threshold: "BLOCK_MEDIUM_AND_ABOVE" as any,
      },
    ],
  })
}

// Start with the first model in hierarchy
export let geminiModel = createGeminiModel(modelHierarchy[currentModelIndex])

// Function to switch to next model in hierarchy
export function switchToNextModel(): boolean {
  if (currentModelIndex < modelHierarchy.length - 1) {
    currentModelIndex++
    const nextModel = modelHierarchy[currentModelIndex]
    console.warn(`Switching to fallback model: ${nextModel}`)
    geminiModel = createGeminiModel(nextModel)
    return true
  }
  return false
}

// Function to reset to primary model (for scheduled resets)
export function resetToPrimaryModel() {
  if (currentModelIndex !== 0) {
    currentModelIndex = 0
    geminiModel = createGeminiModel(modelHierarchy[0])
    console.log("Reset to primary model: gemini-2.5-flash-lite")
  }
}

// Get current model name
export function getCurrentModel() {
  return modelHierarchy[currentModelIndex]
}

// Auto-reset to primary model every 5 minutes
let resetTimer: NodeJS.Timeout | null = null

export function startAutoReset() {
  if (resetTimer) clearInterval(resetTimer)
  
  resetTimer = setInterval(() => {
    resetToPrimaryModel()
  }, 5 * 60 * 1000) // 5 minutes
}

export function stopAutoReset() {
  if (resetTimer) {
    clearInterval(resetTimer)
    resetTimer = null
  }
}

// Start auto-reset on module load
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  startAutoReset()
}

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

export const modelConfig = {
  temperature: 0.7,
  maxOutputTokens: 2048,
  topP: 0.8,
  topK: 40,
}