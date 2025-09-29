import { ChatOpenAI } from "@langchain/openai"

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY environment variable is required")
}

// Grok 4 Fast - Free model with 2M context window
export const grokModel = new ChatOpenAI({
  model: "x-ai/grok-4-fast:free",
  temperature: 0.3,
  maxTokens: 2048,
  streaming: true,
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "AI Commerce Chatbot",
    },
  },
})

// Export for backward compatibility
export const geminiModel = grokModel

// Model configuration
export const modelConfig = {
  temperature: 0.7,
  maxOutputTokens: 2048,
  topP: 0.8,
  topK: 40,
}

// Get current model name (for logging/debugging)
export function getCurrentModel() {
  return "x-ai/grok-4-fast:free"
}