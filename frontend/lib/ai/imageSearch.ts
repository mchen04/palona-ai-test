import { analyzeProductImage, generateSearchQueryFromAnalysis, type ImageAnalysisResult } from "./imageAnalyzer"
import { searchProducts as vectorSearchProducts, type ProductFilter } from "./retriever"
import { searchWithRAG } from "./ragChain"
import type { Product } from "@/lib/products"

export interface ImageSearchResult {
  imageAnalysis: ImageAnalysisResult
  searchQuery: string
  products: Product[]
  response?: string
  confidence: number
}

/**
 * Search for products based on an uploaded image
 */
export async function searchProductsByImage(
  imageBase64: string,
  mimeType: string = "image/jpeg",
  useRAG: boolean = true
): Promise<ImageSearchResult> {
  try {
    // Step 1: Analyze the image
    console.log("Analyzing image with Gemini vision...")
    const imageAnalysis = await analyzeProductImage(imageBase64, mimeType)
    console.log("Image analysis complete:", imageAnalysis)

    // Step 2: Generate search query from analysis
    const searchQuery = generateSearchQueryFromAnalysis(imageAnalysis)
    console.log("Generated search query:", searchQuery)

    // Step 3: Build filters from extracted features
    const filter: ProductFilter = {}
    if (imageAnalysis.features.category) {
      filter.category = imageAnalysis.features.category
    }

    // Step 4: Perform vector search
    let products: Product[] = []
    let response: string | undefined

    if (useRAG) {
      // Use RAG for more intelligent matching
      const ragResult = await searchWithRAG(
        searchQuery,
        [],
        filter
      )
      products = ragResult.productDetails || []
      response = generateImageSearchResponse(imageAnalysis, ragResult.response)
    } else {
      // Direct vector search
      products = await vectorSearchProducts(searchQuery, filter)
    }

    // Step 5: Re-rank products based on visual similarity
    const rankedProducts = rerankByVisualSimilarity(products, imageAnalysis)

    return {
      imageAnalysis,
      searchQuery,
      products: rankedProducts,
      response,
      confidence: imageAnalysis.confidence
    }
  } catch (error) {
    console.error("Error in image search:", error)
    throw new Error("Failed to search products by image")
  }
}

/**
 * Re-rank products based on visual similarity to the analyzed image
 */
function rerankByVisualSimilarity(products: Product[], analysis: ImageAnalysisResult): Product[] {
  return products.map(product => {
    let score = 0
    const productDesc = product.description.toLowerCase()
    const productName = product.name.toLowerCase()

    // Check category match
    if (analysis.features.category === product.category) {
      score += 3
    }

    // Check color matches
    if (analysis.features.color) {
      for (const color of analysis.features.color) {
        if (productDesc.includes(color) || productName.includes(color)) {
          score += 2
        }
      }
    }

    // Check type match
    if (analysis.features.type) {
      if (productDesc.includes(analysis.features.type) || productName.includes(analysis.features.type)) {
        score += 2
      }
    }

    // Check style match
    if (analysis.features.style) {
      if (productDesc.includes(analysis.features.style)) {
        score += 1
      }
    }

    // Check material match
    if (analysis.features.material) {
      if (productDesc.includes(analysis.features.material)) {
        score += 1
      }
    }

    return {
      ...product,
      relevanceScore: score
    }
  }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
}

/**
 * Generate a user-friendly response for image search results
 */
function generateImageSearchResponse(analysis: ImageAnalysisResult, ragResponse?: string): string {
  const features = []
  
  if (analysis.features.color && analysis.features.color.length > 0) {
    features.push(`${analysis.features.color.join('/')} colored`)
  }
  
  if (analysis.features.type) {
    features.push(analysis.features.type)
  }
  
  if (analysis.features.style) {
    features.push(`${analysis.features.style} style`)
  }

  const intro = features.length > 0
    ? `I found products similar to the ${features.join(' ')} item in your image.`
    : "I've analyzed your image and found some matching products."

  if (ragResponse) {
    return `${intro} ${ragResponse}`
  }

  return intro
}

/**
 * Validate image before processing
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  const maxSize = 4 * 1024 * 1024 // 4MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Please upload a JPEG, PNG, or WebP image"
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Image must be less than 4MB"
    }
  }

  return { valid: true }
}

/**
 * Convert File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  // For Node.js environment (API route), use Buffer
  if (typeof window === 'undefined') {
    const buffer = Buffer.from(await file.arrayBuffer())
    return buffer.toString('base64')
  }
  
  // For browser environment, use FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}