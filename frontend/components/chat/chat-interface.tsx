"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, ImageIcon, Bot, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChatMessage } from "./chat-message"
import { TypingIndicator } from "./typing-indicator"
import { useChatMessages } from "@/hooks/use-chat-messages"
import { generateId } from "@/lib/utils"
import { searchProducts } from "@/lib/products"

export function ChatInterface() {
  const [input, setInput] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { messages, addMessage, addStreamingMessage, updateStreamingMessage, completeStreamingMessage } =
    useChatMessages()

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a JPEG, PNG, or WebP image")
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      alert("Image must be less than 4MB")
      return
    }

    setSelectedImage(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !selectedImage) || isLoading) return

    const userMessage = input.trim()
    const imageFile = selectedImage
    
    setInput("")
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setIsLoading(true)

    // Add user message with image indicator
    const userContent = imageFile 
      ? `${userMessage}${userMessage ? ' ' : ''}[Image uploaded]`
      : userMessage
      
    addMessage({
      id: generateId(),
      content: userContent,
      role: "user",
      timestamp: new Date(),
      image: imageFile ? URL.createObjectURL(imageFile) : undefined,
    })

    // Start AI response
    const aiMessageId = generateId()
    addStreamingMessage({
      id: aiMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isStreaming: true,
    })

    try {
      // Call appropriate API based on whether image is present
      if (imageFile) {
        await callImageSearchAPI(imageFile, userMessage, aiMessageId)
      } else {
        await callAIAPI(userMessage, aiMessageId)
      }
    } catch (error) {
      console.error("Chat error:", error)
      updateStreamingMessage(aiMessageId, "I apologize, but I encountered an error. Please try again.")
      completeStreamingMessage(aiMessageId)
    } finally {
      setIsLoading(false)
    }
  }

  const callImageSearchAPI = async (imageFile: File, userMessage: string, messageId: string) => {
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('useRAG', 'true')

      const response = await fetch('/api/search/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process image search')
      }

      const data = await response.json()
      
      // Combine image analysis with user message if provided
      let responseText = data.response || data.imageAnalysis?.description || "I've analyzed your image."
      
      if (data.products && data.products.length > 0) {
        responseText += ` I found ${data.products.length} similar products.`
      }

      // Simulate streaming effect for the response
      const words = responseText.split(" ")
      let currentContent = ""

      for (let i = 0; i < words.length; i++) {
        currentContent += (i > 0 ? " " : "") + words[i]
        updateStreamingMessage(messageId, currentContent, data.products?.map((p: any) => p.id))
        await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 50))
      }

      completeStreamingMessage(messageId)
    } catch (error) {
      console.error('Image search API error:', error)
      updateStreamingMessage(messageId, "I apologize, but I couldn't analyze the image. Please try again.")
      completeStreamingMessage(messageId)
    }
  }

  const callAIAPI = async (userMessage: string, messageId: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: `session_${Date.now()}`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI response')
      }

      const data = await response.json()
      
      // Simulate streaming effect for the response
      const words = data.response.split(" ")
      let currentContent = ""

      for (let i = 0; i < words.length; i++) {
        currentContent += (i > 0 ? " " : "") + words[i]
        updateStreamingMessage(messageId, currentContent, data.products?.map((p: any) => p.id))
        await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 50))
      }

      completeStreamingMessage(messageId)
    } catch (error) {
      console.error('AI API error:', error)
      updateStreamingMessage(messageId, "I apologize, but I'm having trouble connecting to our AI service. Please try again in a moment.")
      completeStreamingMessage(messageId)
    }
  }

  const getAIResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
      return [
        {
          type: "text" as const,
          content:
            "Hello! I'm your AI shopping assistant. I can help you find products, answer questions about our catalog, and provide personalized recommendations. What are you looking for today?",
        },
      ]
    }

    // Search-based responses
    if (lowerMessage.includes("search") || lowerMessage.includes("find") || lowerMessage.includes("looking for")) {
      const searchTerms = userMessage
        .toLowerCase()
        .replace(/search|find|looking for|i'm|i am|can you|help me/g, "")
        .trim()
      if (searchTerms) {
        const searchResults = searchProducts(searchTerms).slice(0, 4)
        if (searchResults.length > 0) {
          return [
            {
              type: "text" as const,
              content: `I found ${searchResults.length} products matching "${searchTerms}". Here are some great options:`,
            },
            {
              type: "products" as const,
              content: "Search results:",
              products: searchResults.map((p) => p.id),
            },
          ]
        }
      }
    }

    // Category-specific responses
    if (lowerMessage.includes("laptop") || lowerMessage.includes("computer") || lowerMessage.includes("macbook")) {
      return [
        {
          type: "text" as const,
          content:
            "I'd be happy to help you find a laptop! Based on our current selection, here are some great options for different needs and budgets:",
        },
        {
          type: "products" as const,
          content: "Laptop recommendations:",
          products: ["11", "14"], // Laptop and Tablet IDs
        },
      ]
    }

    if (lowerMessage.includes("headphones") || lowerMessage.includes("audio") || lowerMessage.includes("music")) {
      return [
        {
          type: "text" as const,
          content:
            "Great choice! Here are our top audio products that customers love for their quality and performance:",
        },
        {
          type: "products" as const,
          content: "Audio products:",
          products: ["9", "12"], // Wireless Headphones and Bluetooth Speaker
        },
      ]
    }

    if (lowerMessage.includes("phone") || lowerMessage.includes("smartphone") || lowerMessage.includes("mobile")) {
      return [
        {
          type: "text" as const,
          content: "Looking for a new smartphone? Here's our latest model with cutting-edge features:",
        },
        {
          type: "products" as const,
          content: "Smartphone recommendation:",
          products: ["10"], // Smartphone
        },
      ]
    }

    if (
      lowerMessage.includes("clothing") ||
      lowerMessage.includes("shirt") ||
      lowerMessage.includes("jeans") ||
      lowerMessage.includes("fashion")
    ) {
      return [
        {
          type: "text" as const,
          content: "Looking for some new clothing? Here are some popular items from our fashion collection:",
        },
        {
          type: "products" as const,
          content: "Popular clothing items:",
          products: ["1", "2", "3", "5"], // T-shirt, Jeans, Running Shoes, Hoodie
        },
      ]
    }

    if (
      lowerMessage.includes("workout") ||
      lowerMessage.includes("fitness") ||
      lowerMessage.includes("gym") ||
      lowerMessage.includes("exercise")
    ) {
      return [
        {
          type: "text" as const,
          content: "Ready to get fit? Here are some excellent fitness products to help you reach your goals:",
        },
        {
          type: "products" as const,
          content: "Fitness essentials:",
          products: ["25", "26", "29", "27"], // Yoga Mat, Dumbbell Set, Resistance Bands, Water Bottle
        },
      ]
    }

    if (
      lowerMessage.includes("home") ||
      lowerMessage.includes("kitchen") ||
      lowerMessage.includes("decor") ||
      lowerMessage.includes("house")
    ) {
      return [
        {
          type: "text" as const,
          content:
            "Looking to upgrade your home? Here are some fantastic home products that combine style and functionality:",
        },
        {
          type: "products" as const,
          content: "Home essentials:",
          products: ["17", "19", "22", "23"], // Coffee Maker, Table Lamp, Wall Art, Blanket
        },
      ]
    }

    if (lowerMessage.includes("gift") || lowerMessage.includes("present") || lowerMessage.includes("birthday")) {
      return [
        {
          type: "text" as const,
          content: "Looking for the perfect gift? Here are some popular items that make great presents for anyone:",
        },
        {
          type: "products" as const,
          content: "Gift ideas:",
          products: ["9", "13", "19", "23"], // Headphones, Smartwatch, Lamp, Blanket
        },
      ]
    }

    if (lowerMessage.includes("cheap") || lowerMessage.includes("budget") || lowerMessage.includes("affordable")) {
      return [
        {
          type: "text" as const,
          content: "Looking for great value? Here are some affordable products that don't compromise on quality:",
        },
        {
          type: "products" as const,
          content: "Budget-friendly options:",
          products: ["1", "8", "21", "29"], // T-shirt, Baseball Cap, Plant Pot, Resistance Bands
        },
      ]
    }

    if (lowerMessage.includes("expensive") || lowerMessage.includes("premium") || lowerMessage.includes("luxury")) {
      return [
        {
          type: "text" as const,
          content: "Looking for premium products? Here are our high-end items with exceptional quality and features:",
        },
        {
          type: "products" as const,
          content: "Premium products:",
          products: ["10", "11", "13", "4"], // Smartphone, Laptop, Smartwatch, Winter Jacket
        },
      ]
    }

    // Default response with popular products
    return [
      {
        type: "text" as const,
        content:
          "I'd be happy to help you find what you're looking for! You can ask me about specific products, categories like electronics or clothing, or let me know your budget and needs. Here are some of our most popular items:",
      },
      {
        type: "products" as const,
        content: "Popular products:",
        products: ["9", "1", "17", "25"], // Headphones, T-shirt, Coffee Maker, Yoga Mat
      },
    ]
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card rounded-t-lg">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-foreground">AI Shopping Assistant</h2>
          <p className="text-sm text-muted-foreground">Ask me anything about our products</p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-card">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">Welcome to AI Commerce!</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                I'm here to help you find the perfect products. Ask me about our catalog, get recommendations, or let me
                know what you're shopping for.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Show me laptops")}
                  className="bg-transparent"
                >
                  Show me laptops
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("I need workout gear")}
                  className="bg-transparent"
                >
                  I need workout gear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Looking for gifts")}
                  className="bg-transparent"
                >
                  Looking for gifts
                </Button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card rounded-b-lg">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-2 relative inline-block">
            <img 
              src={imagePreview} 
              alt="Selected" 
              className="h-20 w-20 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={removeImage}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedImage ? "Describe what you're looking for (optional)..." : "Ask me about products, get recommendations..."}
              className="pr-12 bg-background"
              disabled={isLoading}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </div>
          <Button type="submit" disabled={isLoading || (!input.trim() && !selectedImage)} className="px-4">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
