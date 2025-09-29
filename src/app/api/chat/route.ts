import { type NextRequest, NextResponse } from "next/server"

import { processChatMessage } from "@/lib/ai/chatAgent"
import { getCurrentModel } from "@/lib/ai/config"
import type { ChatRequest, ChatResponse } from "@/types/chat"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Simple validation
    if (!body || !body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      )
    }

    const { message, sessionId, context: _context }: ChatRequest = body

    // Validate message content
    if (message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      )
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Message too long (max 1000 characters)" },
        { status: 400 }
      )
    }

    // Process the message through our AI agent
    const response: ChatResponse = await processChatMessage(
      message.trim(),
      sessionId || `session_${Date.now()}`
    )

    // Add model info to response
    const finalResponse = {
      ...response,
      model: getCurrentModel()
    }
    
    return NextResponse.json(finalResponse)

  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      console.error("Chat API error:", error.message)
      
      if (error.message.includes("timeout") || error.message.includes("Timeout")) {
        return NextResponse.json(
          { error: "Request timed out. Please try again." },
          { status: 504 }
        )
      }
      
      if (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY")) {
        return NextResponse.json(
          { error: "AI service configuration error" },
          { status: 500 }
        )
      }
      
      if (error.message.includes("rate limit") || error.message.includes("quota")) {
        return NextResponse.json(
          { error: "Service temporarily unavailable. Please try again later." },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}