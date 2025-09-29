# Architecture Documentation

Detailed technical architecture and design decisions for the AI Commerce Chatbot.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Data Flow](#data-flow)
5. [AI Pipeline](#ai-pipeline)
6. [Performance Optimizations](#performance-optimizations)
7. [Design Decisions](#design-decisions)

---

## System Overview

The AI Commerce Chatbot is a full-stack Next.js application that combines:
- **Conversational AI** for natural dialogue
- **RAG (Retrieval-Augmented Generation)** for accurate product recommendations
- **Vision AI** for image-based product search
- **Vector search** for semantic product discovery

**Architecture Type**: Monolithic Next.js application with API routes

**Deployment**: Serverless (Vercel)

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React Context + Local Storage
- **Icons**: Lucide React

**Why Next.js?**
- Server-side rendering for SEO
- API routes for backend logic
- File-based routing
- Built-in optimization (Image, Font, etc.)
- Easy deployment to Vercel

**Why TypeScript?**
- Type safety reduces bugs
- Better IDE support
- Self-documenting code
- Easier refactoring

### Backend & AI
- **Runtime**: Node.js (Next.js API routes)
- **AI Framework**: LangChain 0.3
- **LLM**: Grok-4-fast via OpenRouter (free tier)
- **Embeddings**: Google Gemini text-embedding-004
- **Vector Database**: Pinecone (serverless)
- **Vision AI**: Grok vision model

**Why LangChain?**
- Abstracts AI orchestration complexity
- Built-in RAG support
- History-aware retrieval chains
- Easy model swapping
- Active community

**Why Grok via OpenRouter?**
- **Free tier** with generous limits
- 2M token context window (huge!)
- Fast inference speed
- Multimodal (text + vision)
- No credit card required for testing

**Alternative considered**: Google Gemini direct
- **Rejected**: Rate limits on free tier, less generous context

**Why Pinecone?**
- Serverless = no infrastructure management
- Free tier sufficient for project (100K vectors)
- Fast similarity search
- Built-in filtering
- Good LangChain integration

**Alternative considered**: Chroma (local)
- **Rejected**: Requires persistent storage, harder to deploy serverless

### Data & Storage
- **Product Catalog**: Static TypeScript data (32 products)
- **Session Storage**: In-memory (Map-based)
- **Vector Storage**: Pinecone cloud
- **Image Storage**: Public folder (Next.js static)

---

## Architecture Patterns

### 1. API Route Pattern

Each API endpoint follows this structure:
```
API Route → Validation → AI Agent → Response
```

**Benefits**:
- Clear separation of concerns
- Easy to test
- Consistent error handling

### 2. RAG Pattern

```
User Query → Query Reformulation → Vector Search → Context Injection → LLM Response
```

**Key Innovation**: History-aware retrieval
- Reformulates queries based on conversation history
- Example: "show me cheaper options" → "show me cheaper electronics under $100"

### 3. Caching Pattern

```
Request → Check Cache → Cache Hit? → Return Cached : Generate & Cache
```

**What we cache**:
- Vector store instances (expensive to initialize)
- Embeddings model instances
- Session histories

**Cache Invalidation**:
- Session timeout: 1 hour
- Automatic cleanup every 10 minutes
- Manual clear on errors

### 4. Streaming Pattern (Simulated)

```
Response → Split into words → Simulate streaming → Display word-by-word
```

**Why simulated?**
- Actual streaming would require server-sent events
- Added complexity for marginal UX improvement
- Current approach works well enough

---

## Data Flow

### Text-Based Product Search

```
User Message
    ↓
[Frontend: ChatInterface]
    ↓ POST /api/chat
[API Route: route.ts]
    ↓ validate & extract
[Chat Agent: chatAgent.ts]
    ↓ shouldSearchProducts?
[RAG Chain: ragChain.ts]
    ↓ reformulate query
[History-Aware Retriever]
    ↓ semantic search
[Pinecone Vector DB]
    ↓ top 4 products
[Context + History]
    ↓ generate response
[Grok AI Model]
    ↓ structured response
[Response with Products]
    ↓
[Frontend: Display]
```

### Image-Based Search

```
User Uploads Image
    ↓
[Frontend: ChatInterface]
    ↓ POST /api/search/image (FormData)
[API Route: route.ts]
    ↓ validate image
[Image Search: imageSearch.ts]
    ↓ analyze image
[Image Analyzer: imageAnalyzer.ts]
    ↓ extract features
[Grok Vision Model]
    ↓ structured JSON
{category, type, color, style, brand}
    ↓ generate search query
"red cotton t-shirt casual"
    ↓ RAG search
[RAG Chain]
    ↓ vector search
[Pinecone]
    ↓ products
[Re-rank by Visual Similarity]
    ↓ score each product
{relevanceScore: 0-10}
    ↓ sorted products
[Response to Frontend]
```

### Session Management

```
Session Creation
    ↓
User sends message with/without sessionId
    ↓
sessionId exists?
    → Yes: Retrieve history
    → No: Create new session
    ↓
[In-Memory Session Store]
Map<sessionId, SessionMetadata>
    ↓
Process message with history
    ↓
Add to history
    ↓
Truncate if > 50 messages
    ↓
Update lastAccessed timestamp
    ↓
[Automatic Cleanup]
Every 10 mins: Delete sessions older than 1 hour
```

---

## AI Pipeline

### 1. Embeddings Generation

**Process** (runs once, via script):
```typescript
products.map(product => {
  pageContent: `${product.name}. ${product.description}.
                Category: ${product.category}.
                Price: $${product.price}.
                Tags: ${getProductTags(product)}`
  metadata: { id, name, category, price, image, description }
})
  ↓
[Gemini Embeddings Model]
  ↓ 768-dimensional vectors
[Pinecone Index]
  namespace: "products"
```

**Embedding Model**: `text-embedding-004`
- Dimension: 768
- Context: 2048 tokens
- Language: English optimized

### 2. Query Processing

**Standard Query**:
```
"show me laptops"
  → LLM processes with system prompt
  → Responds conversationally
```

**Product Search Query**:
```
"show me laptops"
  ↓ detected as product search
  ↓ extract filters: {category: "electronics"}
  ↓ RAG pipeline
  ↓ retrieve relevant products
  ↓ inject into context
  ↓ LLM generates natural response
"Here are some great laptops: [products]"
```

**History-Aware Query**:
```
User: "show me headphones"
AI: "Here are wireless headphones..." [shows products]
User: "cheaper options"
  ↓ reformulate with history
"show me cheaper electronics under $100"
  ↓ RAG search with reformulated query
```

### 3. Response Generation

**System Prompt** (simplified):
```
You are a helpful shopping assistant.
- Help customers find products
- Answer questions about products
- Be friendly and concise
- Use conversation history for context

Available categories: Clothing, Electronics, Home, Sports
```

**Product Context Injection**:
```
Product Context:
- Product 1: Wireless Headphones, $150, Premium wireless headphones...
- Product 2: Bluetooth Speaker, $79, Portable Bluetooth speaker...
- Product 3: Gaming Mouse, $69, High-precision gaming mouse...

User: "I need audio equipment for under $100"
```

**LLM Response**:
```
"I found some great audio options under $100!
The Bluetooth Speaker ($79) is perfect for portability..."
```

---

## Performance Optimizations

### 1. Caching Strategy

**Retriever Caching** (`cachedRetriever.ts`):
- Vector store instance cached at module level
- Embeddings model instance reused
- Reduces initialization time from 2-3s to <100ms

**Why it works**:
- Next.js keeps modules warm in serverless containers
- Cold starts still happen but are rare

### 2. Memory Management

**Session Truncation**:
- Keep last 50 messages per session
- Pass only last 20 messages to RAG (context window management)
- Prevents memory bloat

**Session Cleanup**:
- Automatic cleanup every 10 minutes
- Delete sessions inactive for 1+ hour
- Prevents memory leaks in long-running servers

### 3. Concurrency Control

**Async Locks** (`chatAgent.ts`):
```typescript
acquireLock(sessionId)
  → process request
  → release lock
```

**Why needed**:
- Prevents race conditions in concurrent requests
- Ensures conversation order integrity
- Avoids duplicate message processing

### 4. Vector Search Optimization

**Pinecone Configuration**:
- Top-k: 4 (sweet spot for quality vs speed)
- Metric: Cosine similarity (best for embeddings)
- Filters: Applied at query time (fast)

**Query Optimization**:
- Rich product descriptions for better matching
- Category tags for semantic search
- Price metadata for filtering

---

## Design Decisions

### Why Single Agent vs Multiple Agents?

**Decision**: Single unified agent

**Alternatives Considered**:
1. Separate agents for chat, search, image
2. Router agent that delegates to specialists

**Rationale**:
- Simpler architecture
- Better conversation context
- Faster responses (no routing overhead)
- Easier to maintain
- User doesn't care about internal structure

### Why RAG vs Fine-Tuning?

**Decision**: RAG (Retrieval-Augmented Generation)

**Alternative**: Fine-tune model on product data

**Rationale**:
- No fine-tuning costs
- Easy to update product catalog
- Better factual accuracy
- Can cite sources
- Works with free-tier models

### Why In-Memory Sessions vs Database?

**Decision**: In-memory Map-based storage

**Alternative**: Redis, PostgreSQL, etc.

**Rationale**:
- Zero infrastructure complexity
- Fast access (microseconds)
- Sufficient for demo/prototype
- Serverless-friendly
- Free

**Trade-off**: Sessions lost on server restart
- Acceptable for demo/take-home
- Would use Redis/Upstash for production

### Why TypeScript Static Product Data?

**Decision**: Products as TypeScript array

**Alternative**: PostgreSQL, MongoDB, CMS

**Rationale**:
- Simple to set up
- Type-safe
- Version controlled
- Fast access (no DB queries)
- Sufficient for 32 products
- Easy to demonstrate

**When to switch**: When product count > 100 or frequent updates needed

### Why Grok over Gemini/GPT?

**Decision**: Grok-4-fast via OpenRouter

**Alternatives**:
- Google Gemini Flash
- OpenAI GPT-3.5-turbo
- Claude Haiku

**Rationale**:
- **Free tier**: No credit card required
- **2M context**: Huge conversation history
- **Fast**: < 1s response time
- **Multimodal**: Text + vision in one model
- **OpenRouter**: Single API for multiple models, easy fallback

**Trade-off**: Slightly less accurate than GPT-4, but sufficient for product recommendations

---

## Scalability Considerations

### Current Limits
- **Products**: 32 (can scale to ~10K with current setup)
- **Concurrent Users**: ~100 (limited by free-tier rate limits)
- **Sessions**: ~1000 (limited by server memory)
- **Vector Storage**: 100K vectors (Pinecone free tier)

### Scaling Strategies

**To 10K products**:
- Increase Pinecone storage
- Optimize embeddings (lower dimension)
- Add product pagination

**To 1K+ concurrent users**:
- Upgrade to paid AI tier
- Add Redis for sessions
- Implement rate limiting per user
- Add CDN for static assets

**To production**:
- Add authentication
- Implement proper session storage (Upstash Redis)
- Add monitoring (Vercel Analytics)
- Add error tracking (Sentry)
- Implement proper logging
- Add CI/CD pipeline

---

## Security Considerations

### Current State
- No authentication (demo only)
- API keys in environment variables ✅
- CORS enabled (open)
- No rate limiting per user
- No input sanitization (basic validation only)

### Production Recommendations
1. Add authentication (NextAuth.js)
2. Implement per-user rate limiting
3. Add CSRF protection
4. Sanitize user inputs
5. Add API key authentication for API access
6. Restrict CORS to known origins
7. Add request signing
8. Implement content security policy

---

## Testing Strategy

### Current Testing
- Manual testing of all features
- TypeScript for type safety
- ESLint for code quality
- Knip for unused code detection

### Recommended Testing (for production)
1. **Unit Tests**: Jest for utility functions
2. **Integration Tests**: Test API routes
3. **E2E Tests**: Playwright for user flows
4. **Load Testing**: Artillery for performance
5. **A/B Testing**: Different prompts/models

---

## Future Enhancements

### Phase 1: Core Improvements
- [ ] Add product reviews/ratings
- [ ] Implement product filtering UI
- [ ] Add shopping cart checkout
- [ ] Save conversation history to DB
- [ ] Add user accounts

### Phase 2: AI Enhancements
- [ ] Multi-turn image analysis ("show me in different colors")
- [ ] Voice input/output
- [ ] Product comparison feature
- [ ] Personalized recommendations
- [ ] Price drop alerts

### Phase 3: Scale
- [ ] Admin dashboard
- [ ] Analytics and insights
- [ ] A/B testing framework
- [ ] Multi-language support
- [ ] Mobile app

---

## References

- [LangChain Docs](https://js.langchain.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Pinecone Docs](https://docs.pinecone.io/)
- [OpenRouter Models](https://openrouter.ai/models)
- [Gemini Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)

---

## Architecture Diagrams

### High-Level System Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Chat UI     │  │ Product      │  │ Image Upload   │ │
│  │             │  │ Catalog      │  │                │ │
│  └──────┬──────┘  └──────┬───────┘  └────────┬───────┘ │
└─────────┼─────────────────┼──────────────────┼─────────┘
          │                 │                  │
          │ POST            │ GET              │ POST
          │ /api/chat       │ /api/products    │ /api/search/image
          │                 │                  │
┌─────────▼─────────────────▼──────────────────▼─────────┐
│                   Next.js API Routes                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Chat Agent (LangChain)                │ │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐ │ │
│  │  │ Session  │  │   RAG    │  │ Image Analyzer  │ │ │
│  │  │ Manager  │  │  Chain   │  │                 │ │ │
│  │  └──────────┘  └──────────┘  └─────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└──────────┬───────────────────┬───────────────────────┬──┘
           │                   │                       │
           │ Embeddings        │ Query                 │ Vision API
           │                   │                       │
┌──────────▼──────┐  ┌─────────▼──────────┐  ┌────────▼────────┐
│  Gemini API     │  │   Pinecone         │  │  OpenRouter     │
│  (Embeddings)   │  │   (Vector DB)      │  │  (Grok AI)      │
└─────────────────┘  └────────────────────┘  └─────────────────┘
```

### RAG Pipeline Flow
```
User Query: "show me laptops under $1000"
    ↓
┌─────────────────────────────────────┐
│   1. Query Reformulation            │
│   (with conversation history)       │
│   → "show me laptops under $1000"   │
└─────────┬───────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│   2. Vector Search                  │
│   Pinecone similarity search        │
│   → Top 4 relevant products         │
└─────────┬───────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│   3. Context Injection              │
│   Products + History + Query        │
│   → Prompt with full context        │
└─────────┬───────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│   4. LLM Generation                 │
│   Grok generates natural response   │
│   → "Here are some great laptops"   │
└─────────┬───────────────────────────┘
          ↓
    Response + Products
```

This architecture is designed for:
- ✅ Rapid development
- ✅ Easy deployment
- ✅ Cost efficiency (free tiers)
- ✅ Good UX (fast responses)
- ✅ Maintainability
- ✅ Scalability path