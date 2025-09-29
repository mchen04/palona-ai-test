import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage } from "@langchain/core/messages"

// Lazy initialization for Gemini vision model
let visionModel: ChatGoogleGenerativeAI | null = null

function getVisionModel(): ChatGoogleGenerativeAI {
  if (!visionModel) {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY environment variable is required")
    }
    visionModel = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey: process.env.GOOGLE_API_KEY,
      maxOutputTokens: 2048,
      temperature: 0.3, // Lower temperature for more consistent descriptions
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
}

/**
 * Analyze an image and extract product features
 */
export async function analyzeProductImage(imageBase64: string, mimeType: string = "image/jpeg"): Promise<ImageAnalysisResult> {
  try {
    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: `Analyze this product image and provide a detailed description. 
                 Extract the following information if visible:
                 - Product category (clothing, electronics, home, sports, etc.)
                 - Main colors
                 - Product type (specific item type)
                 - Style or design features
                 - Brand if visible
                 - Material if identifiable
                 
                 Format your response as a structured description that would help find similar products.
                 Be specific and accurate, focusing on visual features that would help match this to similar items.`,
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
    const description = response.content as string

    // Extract features from the description
    const features = extractFeaturesFromDescription(description)

    return {
      description,
      features,
      confidence: calculateConfidence(features),
    }
  } catch (error) {
    console.error("Error analyzing image:", error)
    throw new Error("Failed to analyze image")
  }
}

/**
 * Extract structured features from image description
 */
function extractFeaturesFromDescription(description: string): ImageAnalysisResult["features"] {
  const lowerDesc = description.toLowerCase()
  const features: ImageAnalysisResult["features"] = {}

  // Extract category
  const categories = ["clothing", "electronics", "home", "sports"]
  for (const category of categories) {
    if (lowerDesc.includes(category)) {
      features.category = category
      break
    }
  }

  // Extract colors
  const colorPatterns = [
    "black", "white", "red", "blue", "green", "yellow", "orange", "purple",
    "pink", "brown", "gray", "grey", "navy", "beige", "silver", "gold"
  ]
  const foundColors = colorPatterns.filter(color => lowerDesc.includes(color))
  if (foundColors.length > 0) {
    features.color = foundColors
  }

  // Extract product type based on keywords
  const typeKeywords = {
    clothing: ["shirt", "pants", "jacket", "dress", "shoes", "hat", "jeans", "sweater", "coat"],
    electronics: ["phone", "laptop", "tablet", "headphones", "speaker", "watch", "camera", "mouse"],
    home: ["lamp", "chair", "table", "sofa", "bed", "rug", "pillow", "blanket", "clock"],
    sports: ["ball", "racket", "weights", "mat", "bottle", "bag", "helmet", "gloves"]
  }

  for (const [, keywords] of Object.entries(typeKeywords)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        features.type = keyword
        break
      }
    }
    if (features.type) break
  }

  // Extract style
  const stylePatterns = ["modern", "classic", "vintage", "casual", "formal", "sporty", "minimalist"]
  for (const style of stylePatterns) {
    if (lowerDesc.includes(style)) {
      features.style = style
      break
    }
  }

  // Extract material
  const materialPatterns = ["cotton", "leather", "plastic", "metal", "wood", "fabric", "wool", "synthetic"]
  for (const material of materialPatterns) {
    if (lowerDesc.includes(material)) {
      features.material = material
      break
    }
  }

  return features
}

/**
 * Calculate confidence score based on extracted features
 */
function calculateConfidence(features: ImageAnalysisResult["features"]): number {
  let score = 0.5 // Base confidence
  
  if (features.category) score += 0.15
  if (features.type) score += 0.15
  if (features.color && features.color.length > 0) score += 0.1
  if (features.style) score += 0.05
  if (features.material) score += 0.05

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