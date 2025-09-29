import dotenv from "dotenv"

import path from "path"

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { Pinecone } from "@pinecone-database/pinecone"

async function testPinecone() {
  console.log("\n=== Testing Pinecone Connection ===\n")
  
  try {
    // 1. Test Pinecone client initialization
    console.log("1. Initializing Pinecone client...")
    const startInit = Date.now()
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    })
    console.log(`   ✓ Client initialized in ${Date.now() - startInit}ms`)
    
    // 2. List indexes
    console.log("\n2. Listing indexes...")
    const startList = Date.now()
    const indexes = await pc.listIndexes()
    console.log(`   ✓ Found ${indexes.indexes?.length || 0} indexes in ${Date.now() - startList}ms`)
    indexes.indexes?.forEach(idx => {
      console.log(`   - ${idx.name} (${idx.dimension}D, ${idx.metric})`)
    })
    
    // 3. Get specific index
    console.log("\n3. Getting 'product-embeddings' index...")
    const startIndex = Date.now()
    const index = pc.index("product-embeddings")
    console.log(`   ✓ Index reference obtained in ${Date.now() - startIndex}ms`)
    
    // 4. Describe index stats
    console.log("\n4. Getting index stats...")
    const startStats = Date.now()
    const stats = await index.namespace("products").describeIndexStats()
    console.log(`   ✓ Stats retrieved in ${Date.now() - startStats}ms`)
    console.log(`   - Total vectors: ${stats.totalRecordCount}`)
    console.log(`   - Dimension: ${stats.dimension}`)
    console.log(`   - Namespaces: ${Object.keys(stats.namespaces || {}).join(", ")}`)
    
    if (stats.totalRecordCount === 0) {
      console.log("\n⚠️  WARNING: No vectors found in index! Run 'npm run generate-embeddings' first.")
      return
    }
    
    // 5. Test embeddings generation
    console.log("\n5. Testing embeddings generation...")
    const startEmbed = Date.now()
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GOOGLE_API_KEY!,
    })
    const queryVector = await embeddings.embedQuery("laptop")
    console.log(`   ✓ Generated ${queryVector.length}D embedding in ${Date.now() - startEmbed}ms`)
    
    // 6. Test direct Pinecone query
    console.log("\n6. Testing direct Pinecone query...")
    const startQuery = Date.now()
    const queryResponse = await index.namespace("products").query({
      vector: queryVector,
      topK: 3,
      includeMetadata: true,
    })
    console.log(`   ✓ Query completed in ${Date.now() - startQuery}ms`)
    console.log(`   - Found ${queryResponse.matches.length} matches`)
    queryResponse.matches.forEach((match, i) => {
      console.log(`   ${i + 1}. ${match.metadata?.name} (score: ${match.score?.toFixed(3)})`)
    })
    
    console.log("\n✅ All Pinecone tests passed!\n")
    
  } catch (error) {
    console.error("\n❌ Error during testing:", error)
    if (error instanceof Error) {
      console.error("   Message:", error.message)
      console.error("   Stack:", error.stack)
    }
  }
}

// Run the test
testPinecone()