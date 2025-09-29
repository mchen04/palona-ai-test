import { GoogleGenerativeAI } from "@google/generative-ai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY environment variable is required")
}

export const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",  // This model works as confirmed by test
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
  maxOutputTokens: 2048,
  verbose: true,  // Enable verbose logging for debugging
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

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

export const modelConfig = {
  temperature: 0.7,
  maxOutputTokens: 2048,
  topP: 0.8,
  topK: 40,
}