import { HumanMessage } from "@langchain/core/messages"
import { ChatOpenAI } from "@langchain/openai"

// Lazy initialization for Grok vision model
let visionModel: ChatOpenAI | null = null

function getVisionModel(): ChatOpenAI {
  if (!visionModel) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY environment variable is required")
    }
    visionModel = new ChatOpenAI({
      model: "x-ai/grok-4-fast:free",
      temperature: 0.3,
      maxTokens: 2048,
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "AI Commerce Chatbot",
        },
      },
    })
  }
  return visionModel
}

export interface ImageAnalysisResult {
  description: string
  features: {
    category?: string
    color?: string[]
    type?: string
    style?: string
    brand?: string
    material?: string
  }
  confidence: number
  catalogConfidence?: number // Confidence that this product exists in our catalog
}

// Structured response format for Grok
interface StructuredAnalysis {
  category: "clothing" | "electronics" | "home" | "sports" | "unknown"
  type: string
  colors: string[]
  style?: string
  material?: string
  brand?: string
  confidence: number
  description: string
}

/**
 * Analyze an image and extract product features using structured JSON output
 */
export async function analyzeProductImage(imageBase64: string, mimeType: string = "image/jpeg"): Promise<ImageAnalysisResult> {
  try {
    // First attempt: Structured JSON analysis
    let structuredResult = await tryStructuredAnalysis(imageBase64, mimeType)
    
    // If structured analysis fails or confidence is low, try fallback
    if (!structuredResult || structuredResult.confidence < 0.6) {
      console.log("Low confidence or failed structured analysis, trying fallback...")
      const fallbackResult = await tryFallbackAnalysis(imageBase64, mimeType)
      
      // Use fallback if it's more confident, otherwise keep structured result
      if (fallbackResult && (!structuredResult || fallbackResult.confidence > structuredResult.confidence)) {
        structuredResult = fallbackResult
      }
    }
    
    if (!structuredResult) {
      throw new Error("Both structured and fallback analysis failed")
    }
    
    // Convert structured result to ImageAnalysisResult format
    const features = {
      category: structuredResult.category === "unknown" ? undefined : structuredResult.category,
      color: structuredResult.colors.length > 0 ? structuredResult.colors : undefined,
      type: structuredResult.type,
      style: structuredResult.style,
      brand: structuredResult.brand,
      material: structuredResult.material,
    }
    
    // Calculate catalog confidence based on how well features match our catalog
    const catalogConfidence = calculateCatalogConfidence(features)
    
    return {
      description: structuredResult.description,
      features,
      confidence: structuredResult.confidence,
      catalogConfidence,
    }
  } catch (error) {
    console.error("Error analyzing image:", error)
    throw new Error("Failed to analyze image")
  }
}

/**
 * Try structured JSON analysis first
 */
async function tryStructuredAnalysis(imageBase64: string, mimeType: string): Promise<StructuredAnalysis | null> {
  try {
    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: `Analyze this product image and respond with ONLY a valid JSON object in this exact format:
{
  "category": "clothing|electronics|home|sports|unknown",
  "type": "specific product type (e.g., shirt, laptop, lamp, yoga mat)",
  "colors": ["primary color", "secondary color if any"],
  "style": "style description if applicable",
  "material": "material if visible",
  "brand": "brand name if visible",
  "confidence": 0.85,
  "description": "Brief description for search purposes"
}

Examples:
- Red t-shirt: {"category":"clothing","type":"shirt","colors":["red"],"confidence":0.9,"description":"red cotton t-shirt"}
- iPhone: {"category":"electronics","type":"smartphone","colors":["black"],"confidence":0.95,"description":"black smartphone mobile phone"}

Be precise with categories. Use "unknown" only if truly unclear.`,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
          },
        },
      ],
    })

    const response = await getVisionModel().invoke([message])
    const content = response.content as string
    
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.log("No JSON found in structured response")
      return null
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as StructuredAnalysis
    
    // Validate required fields
    if (!parsed.category || !parsed.type || !parsed.confidence || !parsed.description) {
      console.log("Missing required fields in structured response")
      return null
    }
    
    return parsed
  } catch (error) {
    console.log("Structured analysis failed:", error)
    return null
  }
}

/**
 * Fallback analysis using multiple choice for category
 */
async function tryFallbackAnalysis(imageBase64: string, mimeType: string): Promise<StructuredAnalysis | null> {
  try {
    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: `Look at this product image and answer: Which category best describes this item?

A) CLOTHING (shirts, pants, shoes, jackets, hats, etc.)
B) ELECTRONICS (phones, laptops, headphones, speakers, etc.)  
C) HOME (lamps, furniture, kitchenware, decor, etc.)
D) SPORTS (equipment, gear, fitness items, etc.)
E) UNKNOWN (if none of the above fit well)

Respond with just the letter and category name, then describe the item briefly.
Example: "A) CLOTHING - This is a blue denim jacket with metal buttons"`,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
          },
        },
      ],
    })

    const response = await getVisionModel().invoke([message])
    const content = response.content as string
    
    // Parse the multiple choice response
    const categoryMap: Record<string, string> = {
      'A': 'clothing',
      'B': 'electronics', 
      'C': 'home',
      'D': 'sports',
      'E': 'unknown'
    }
    
    const letterMatch = content.match(/([A-E])\)/)
    if (!letterMatch) {
      return null
    }
    
    const category = categoryMap[letterMatch[1]] as StructuredAnalysis['category']
    const description = content.replace(/[A-E]\)\s*\w+\s*-\s*/, '').trim()
    
    // Extract basic features from description using enhanced string matching
    const features = extractFeaturesFromDescription(description)
    
    return {
      category,
      type: features.type || 'unknown',
      colors: features.color || [],
      style: features.style,
      material: features.material,
      brand: features.brand,
      confidence: 0.75, // Lower confidence for fallback method
      description
    }
  } catch (error) {
    console.log("Fallback analysis failed:", error)
    return null
  }
}

/**
 * Enhanced feature extraction with synonyms (for fallback analysis)
 */
function extractFeaturesFromDescription(description: string): ImageAnalysisResult["features"] {
  const lowerDesc = description.toLowerCase()
  const features: ImageAnalysisResult["features"] = {}

  // Enhanced color matching with synonyms
  const colorSynonyms = {
    "red": ["red", "crimson", "scarlet", "burgundy", "maroon", "cherry"],
    "blue": ["blue", "navy", "azure", "cobalt", "royal blue", "sky blue"],
    "green": ["green", "emerald", "forest", "olive", "lime", "mint"],
    "black": ["black", "dark", "ebony", "charcoal", "jet black"],
    "white": ["white", "cream", "ivory", "pearl", "snow white", "off-white"],
    "gray": ["gray", "grey", "silver", "slate", "ash", "gunmetal"],
    "brown": ["brown", "tan", "beige", "khaki", "chocolate", "coffee"],
    "yellow": ["yellow", "golden", "amber", "lemon", "mustard"],
    "orange": ["orange", "amber", "copper", "rust", "coral"],
    "purple": ["purple", "violet", "lavender", "plum", "magenta"],
    "pink": ["pink", "rose", "salmon", "blush", "fuchsia"]
  }
  
  const foundColors: string[] = []
  for (const [baseColor, synonyms] of Object.entries(colorSynonyms)) {
    if (synonyms.some(synonym => lowerDesc.includes(synonym))) {
      foundColors.push(baseColor)
    }
  }
  if (foundColors.length > 0) {
    features.color = foundColors
  }

  // Enhanced type matching with synonyms
  const typeSynonyms = {
    clothing: {
      "shirt": ["shirt", "tee", "t-shirt", "top", "blouse", "tshirt"],
      "pants": ["pants", "trousers", "slacks", "chinos", "joggers"],
      "jeans": ["jeans", "denim"],
      "shoes": ["shoes", "sneakers", "boots", "sandals", "loafers", "footwear"],
      "jacket": ["jacket", "blazer", "coat", "hoodie", "cardigan", "sweater"],
      "hat": ["hat", "cap", "beanie", "helmet"]
    },
    electronics: {
      "smartphone": ["phone", "smartphone", "mobile", "iphone", "android"],
      "laptop": ["laptop", "notebook", "computer", "macbook"],
      "tablet": ["tablet", "ipad"],
      "headphones": ["headphones", "earbuds", "earphones", "headset"],
      "speaker": ["speaker", "bluetooth speaker", "sound system"],
      "watch": ["watch", "smartwatch", "timepiece"],
      "mouse": ["mouse", "computer mouse", "gaming mouse"]
    },
    home: {
      "lamp": ["lamp", "light", "lighting"],
      "pillow": ["pillow", "cushion"],
      "blanket": ["blanket", "throw", "comforter"],
      "clock": ["clock", "timepiece"],
      "pot": ["pot", "planter", "vase"]
    },
    sports: {
      "mat": ["mat", "yoga mat", "exercise mat"],
      "bottle": ["bottle", "water bottle", "drink bottle"],
      "bag": ["bag", "gym bag", "sports bag", "duffel"],
      "weights": ["weights", "dumbbells", "barbells"]
    }
  }

  // Find matching type
  for (const [category, types] of Object.entries(typeSynonyms)) {
    for (const [type, synonyms] of Object.entries(types)) {
      if (synonyms.some(synonym => lowerDesc.includes(synonym))) {
        features.type = type
        features.category = category as any
        break
      }
    }
    if (features.type) break
  }

  // Extract style with synonyms
  const styleSynonyms = {
    "modern": ["modern", "contemporary", "sleek", "minimalist"],
    "classic": ["classic", "traditional", "timeless"],
    "vintage": ["vintage", "retro", "old-fashioned"],
    "casual": ["casual", "everyday", "relaxed"],
    "formal": ["formal", "dress", "business", "professional"],
    "sporty": ["sporty", "athletic", "active", "performance"]
  }
  
  for (const [style, synonyms] of Object.entries(styleSynonyms)) {
    if (synonyms.some(synonym => lowerDesc.includes(synonym))) {
      features.style = style
      break
    }
  }

  // Extract material
  const materialPatterns = ["cotton", "leather", "plastic", "metal", "wood", "fabric", "wool", "synthetic", "ceramic", "glass"]
  for (const material of materialPatterns) {
    if (lowerDesc.includes(material)) {
      features.material = material
      break
    }
  }

  return features
}

/**
 * Calculate confidence that this product exists in our catalog
 */
function calculateCatalogConfidence(features: ImageAnalysisResult["features"]): number {
  let score = 0.3 // Base confidence
  
  // Higher confidence if we have a clear category match
  if (features.category && ["clothing", "electronics", "home", "sports"].includes(features.category)) {
    score += 0.3
  }
  
  // Check if type matches our product types
  const catalogTypes = [
    "shirt", "jeans", "shoes", "jacket", "hoodie", "pants", "hat", // clothing
    "headphones", "smartphone", "laptop", "speaker", "smartwatch", "tablet", "mouse", // electronics
    "lamp", "pillow", "blanket", "clock", "pot", "knife", "blanket", // home
    "mat", "weights", "bottle", "bag", "ball", "racket", "helmet" // sports
  ]
  
  if (features.type && catalogTypes.includes(features.type)) {
    score += 0.25
  }
  
  // Bonus for having color information (helps with matching)
  if (features.color && features.color.length > 0) {
    score += 0.1
  }
  
  // Small bonus for additional details
  if (features.style) score += 0.025
  if (features.material) score += 0.025
  
  return Math.min(score, 1.0)
}

/**
 * Generate a search query from image analysis
 */
export function generateSearchQueryFromAnalysis(analysis: ImageAnalysisResult): string {
  const parts = []
  
  if (analysis.features.color && analysis.features.color.length > 0) {
    parts.push(analysis.features.color[0])
  }
  
  if (analysis.features.type) {
    parts.push(analysis.features.type)
  } else if (analysis.features.category) {
    parts.push(analysis.features.category)
  }
  
  if (analysis.features.style) {
    parts.push(analysis.features.style)
  }
  
  if (analysis.features.material) {
    parts.push(`made of ${analysis.features.material}`)
  }

  // If we have very few features, use part of the description
  if (parts.length < 2) {
    const shortDesc = analysis.description.split('.')[0].toLowerCase()
    return shortDesc.length > 100 ? shortDesc.substring(0, 100) : shortDesc
  }

  return parts.join(' ')
}

/**
 * Get similar product suggestions when no exact matches are found
 */
export function getSimilarProductSuggestions(analysis: ImageAnalysisResult): string[] {
  const suggestions: string[] = []
  
  // Suggest based on category
  if (analysis.features.category) {
    suggestions.push(`Other ${analysis.features.category} items`)
  }
  
  // Suggest based on color
  if (analysis.features.color && analysis.features.color.length > 0) {
    suggestions.push(`${analysis.features.color[0]} products`)
  }
  
  // Suggest based on type if available
  if (analysis.features.type) {
    suggestions.push(`Similar ${analysis.features.type} products`)
  }
  
  return suggestions.slice(0, 3) // Return top 3 suggestions
}