import { searchProducts } from '../lib/ai/retriever'

async function testVectorSearch() {
  console.log('🔍 Testing vector search performance...')
  const startTime = Date.now()
  
  try {
    console.log('⏰ Starting search at:', new Date().toISOString())
    
    // Test with timeout
    const searchPromise = searchProducts('laptop computer')
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Search timeout after 30 seconds')), 30000)
    )
    
    const results = await Promise.race([searchPromise, timeoutPromise]) as any[]
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log('✅ Search completed successfully!')
    console.log(`⏱️  Duration: ${duration}ms (${(duration/1000).toFixed(1)}s)`)
    console.log(`📊 Results count: ${results.length}`)
    console.log('📋 Results:', results.map(r => ({ id: r.id, name: r.name, score: r.relevanceScore })))
    
  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.error('❌ Search failed!')
    console.error(`⏱️  Duration before failure: ${duration}ms (${(duration/1000).toFixed(1)}s)`)
    console.error('🔥 Error:', error instanceof Error ? error.message : error)
    
    if (error instanceof Error && error.stack) {
      console.error('📍 Stack trace:', error.stack)
    }
  }
}

testVectorSearch()