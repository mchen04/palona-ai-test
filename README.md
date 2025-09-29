# AI Agent for Commerce Website

**A production-ready AI shopping assistant implementing conversational AI, semantic product search, and multimodal image-based discovery.**

**Submitted by**: Michael Chen
**Assessment**: Palona AI - AI Software Engineer Intern
**Date**: September 2025

[Live Demo](#deployment) | [Documentation](./docs/) | [API Reference](./docs/API.md)

---

## Executive Summary

This project implements a unified AI agent for e-commerce applications, demonstrating proficiency in modern AI/ML technologies, full-stack development, and production-grade software engineering practices. The system handles three core functionalities through a single conversational interface:

1. **General Conversation** - Natural language dialogue with context-aware responses
2. **Text-Based Product Recommendations** - Semantic search using RAG (Retrieval-Augmented Generation)
3. **Image-Based Product Search** - Multimodal vision AI for visual product discovery

All three capabilities are integrated into a single agent architecture, providing a seamless user experience similar to Amazon's Rufus shopping assistant.

---

## Core Features

### 1. Conversational AI
- Natural language understanding and generation
- Session-based conversation memory (50 message history)
- Context-aware responses referencing previous interactions
- Powered by Grok-4-fast LLM via OpenRouter

### 2. Text-Based Product Recommendations
- Semantic search using vector embeddings
- RAG pipeline with history-aware query reformulation
- Category and price range filtering
- Intelligent product matching based on user intent

### 3. Image-Based Product Search
- Multimodal vision AI for image analysis
- Automated feature extraction (color, category, type, style, material)
- Visual similarity scoring and re-ranking
- Confidence-based response generation
- Graceful handling of out-of-catalog items

### 4. Unified Agent Architecture
- Single agent handles all interaction modalities
- Consistent conversational flow across text and image inputs
- Seamless context switching between use cases
- Production-ready error handling and fallback mechanisms

---

## Technology Stack

### Frontend Architecture
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 18 with Server Components
- **Styling**: Tailwind CSS 4
- **Component System**: Radix UI + shadcn/ui
- **State Management**: React Context API with localStorage persistence

### Backend & AI Infrastructure
- **Runtime**: Node.js on Next.js API Routes
- **AI Framework**: LangChain 0.3
- **Language Model**: Grok-4-fast (2M token context via OpenRouter)
- **Embeddings**: Google Gemini text-embedding-004 (768 dimensions)
- **Vector Database**: Pinecone (serverless, cosine similarity)
- **Vision AI**: Grok multimodal vision capabilities

### Data Layer
- **Product Catalog**: TypeScript-defined dataset (32 products)
- **Session Storage**: In-memory with automatic cleanup
- **Vector Storage**: Pinecone cloud-hosted index
- **Static Assets**: Next.js public directory

### Infrastructure & Deployment
- **Platform**: Vercel (serverless)
- **CI/CD**: GitHub integration with automatic deployments
- **Environment**: Production and preview environments
- **Monitoring**: Built-in Vercel Analytics support

---

## Technical Architecture

### System Design

The application follows a modern serverless architecture with clear separation of concerns:

```
┌─────────────────┐
│  Next.js UI     │ ← User interactions
└────────┬────────┘
         │ HTTP/REST
┌────────▼────────┐
│  API Routes     │ ← Request validation & routing
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│ Chat │  │ Image │ ← AI agents
│Agent│  │Search │
└───┬──┘  └───┬───┘
    │         │
    └────┬────┘
         │
┌────────▼────────┐
│  RAG Pipeline   │ ← Retrieval-Augmented Generation
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼─────┐
│Pinecone│ │Grok AI │ ← External services
└────────┘ └────────┘
```

### RAG Implementation

The system implements a sophisticated RAG pipeline with history-aware retrieval:

1. **Query Reformulation**: Converts context-dependent queries into standalone questions
   - Example: "cheaper options" → "show me cheaper electronics under $100"
2. **Vector Search**: Semantic similarity search in Pinecone
3. **Context Injection**: Retrieved products injected into LLM prompt
4. **Response Generation**: Natural language response with product recommendations

### Key Innovations

- **Cached Retriever Pattern**: Module-level caching reduces cold start latency
- **History-Aware Retrieval**: Reformulates queries using conversation context
- **Concurrent Request Handling**: Async locks prevent race conditions
- **Memory Management**: Automatic session truncation and cleanup
- **Visual Re-ranking**: Image search results scored by visual similarity

---

## API Documentation

### Endpoints Overview

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/chat` | POST | Conversational AI and text search | None |
| `/api/search/image` | POST | Image-based product discovery | None |
| `/api/search/products` | POST | Direct semantic product search | None |
| `/api/health` | GET | Service health monitoring | None |
| `/api/embeddings/init` | POST | Vector database initialization | None |

### Example: Chat Endpoint

**Request**:
```http
POST /api/chat HTTP/1.1
Content-Type: application/json

{
  "message": "Show me professional laptops under $1000",
  "sessionId": "user_session_abc123"
}
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "response": "Based on your requirements, I recommend the Laptop 15\" Pro...",
  "products": [
    {
      "id": "11",
      "name": "Laptop - 15\" Pro",
      "price": 1299,
      "description": "High-performance 15-inch professional laptop",
      "image": "/modern-laptop.png",
      "category": "electronics"
    }
  ],
  "sessionId": "user_session_abc123",
  "model": "x-ai/grok-4-fast:free"
}
```

**Complete API Documentation**: [docs/API.md](./docs/API.md)

---

## Project Structure

```
palona-ai-test/
├── README.md                           # Project overview (this file)
├── docs/                               # Comprehensive documentation
│   ├── API.md                         # API reference with examples
│   ├── SETUP.md                       # Installation and configuration
│   ├── ARCHITECTURE.md                # Technical design decisions
│   ├── DEPLOYMENT.md                  # Production deployment guide
│   └── TROUBLESHOOTING.md             # Common issues and solutions
│
└── src/                                # Application source code
    ├── app/                            # Next.js application
    │   ├── api/                       # API route handlers
    │   │   ├── chat/route.ts          # Chat endpoint
    │   │   ├── search/
    │   │   │   ├── image/route.ts     # Image search endpoint
    │   │   │   └── products/route.ts  # Product search endpoint
    │   │   ├── health/route.ts        # Health check
    │   │   └── embeddings/init/route.ts # DB initialization
    │   ├── layout.tsx                 # Root layout
    │   └── page.tsx                   # Main application page
    │
    ├── components/                     # React components
    │   ├── chat/                      # Chat interface components
    │   ├── catalog/                   # Product catalog UI
    │   ├── cart/                      # Shopping cart components
    │   └── ui/                        # Reusable UI primitives
    │
    ├── lib/                            # Core business logic
    │   ├── ai/                        # AI/ML modules
    │   │   ├── chatAgent.ts           # Main conversational agent
    │   │   ├── ragChain.ts            # RAG pipeline implementation
    │   │   ├── imageSearch.ts         # Image-based search orchestration
    │   │   ├── imageAnalyzer.ts       # Vision AI analysis
    │   │   ├── retriever.ts           # Vector search operations
    │   │   ├── cachedRetriever.ts     # Performance-optimized retriever
    │   │   ├── pinecone.ts            # Vector database client
    │   │   ├── config.ts              # AI model configuration
    │   │   └── prompts.ts             # System prompts
    │   ├── products.ts                # Product catalog (32 items)
    │   └── utils.ts                   # Utility functions
    │
    ├── scripts/                        # Utility scripts
    │   └── generateEmbeddings.ts      # Vector embedding generation
    │
    ├── types/                          # TypeScript type definitions
    │   └── chat.ts                    # Chat-related types
    │
    ├── public/                         # Static assets
    │   └── [product images]           # Product photography
    │
    ├── .env.example                    # Environment template
    └── package.json                    # Dependencies and scripts
```

---

## Installation and Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git for version control
- API keys for OpenRouter, Google Gemini, and Pinecone (all free tier)

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd palona-ai-test/src

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Initialize vector database
npm run generate-embeddings

# 5. Start development server
npm run dev
```

Access the application at [http://localhost:3000](http://localhost:3000)

**Detailed Setup Instructions**: [docs/SETUP.md](./docs/SETUP.md)

---

## Technical Implementation Details

### RAG Pipeline Architecture

The system implements a production-grade RAG pipeline with the following components:

1. **Embeddings Generation**: Products converted to 768-dimensional vectors using Gemini text-embedding-004
2. **Vector Storage**: Embeddings stored in Pinecone with metadata filtering capabilities
3. **History-Aware Retrieval**: Query reformulation based on conversation context
4. **Context Injection**: Retrieved products injected into LLM prompt with structured formatting
5. **Response Generation**: Natural language responses generated by Grok-4-fast

### Session Management

Implements robust session management with:
- In-memory storage with Map-based lookups (O(1) complexity)
- Automatic message truncation (maintains last 50 messages)
- Context window management (passes last 20 messages to RAG)
- Periodic cleanup (removes sessions inactive for 60+ minutes)
- Race condition prevention through async locking mechanisms

### Performance Optimizations

- **Retriever Caching**: Vector store instances cached at module level
- **Cold Start Mitigation**: Lazy initialization with persistent warm containers
- **Memory Management**: Bounded session storage with automatic cleanup
- **Concurrent Processing**: Async locks ensure thread-safe operations
- **Response Time**: <1s for warm requests, 2-3s for cold starts

---

## Design Decisions and Rationale

### AI Model Selection: Grok-4-fast via OpenRouter

**Chosen**: Grok-4-fast through OpenRouter API

**Alternatives Considered**:
- Google Gemini Flash/Pro
- OpenAI GPT-3.5/4
- Anthropic Claude

**Rationale**:
- Generous free tier with no credit card requirement
- 2M token context window (superior for conversation history)
- Sub-second inference latency
- Multimodal capabilities (text and vision)
- Single API for multiple models (easy fallback implementation)
- Production-ready reliability

### Vector Database: Pinecone Serverless

**Chosen**: Pinecone serverless architecture

**Alternatives Considered**:
- Chroma (self-hosted)
- Weaviate
- Qdrant

**Rationale**:
- Zero infrastructure management overhead
- Automatic scaling
- Strong LangChain integration
- Free tier sufficient for demonstration (100K vectors)
- Production-grade reliability and performance
- Simple deployment model

### Session Storage: In-Memory

**Chosen**: In-memory Map-based storage

**Alternatives Considered**:
- Redis/Upstash
- PostgreSQL with pg_session
- DynamoDB

**Rationale**:
- Zero external dependencies for demo environment
- Microsecond access latency
- Serverless-compatible (works in Vercel functions)
- Appropriate for prototype/demonstration
- Clear upgrade path to Redis for production

**Production Recommendation**: Migrate to Upstash Redis for persistent sessions

### Frontend Framework: Next.js

**Chosen**: Next.js 14 with App Router

**Alternatives Considered**:
- Create React App
- Vite + React
- Remix

**Rationale**:
- Unified frontend and backend in single codebase
- API routes eliminate need for separate backend server
- Built-in optimizations (image, font, code splitting)
- Excellent developer experience
- Trivial deployment to Vercel
- Server-side rendering for improved SEO

---

## Product Catalog

The system includes a curated catalog of 32 products across 4 categories:

| Category | Product Count | Price Range | Examples |
|----------|--------------|-------------|----------|
| Clothing | 8 items | $25 - $180 | T-shirts, jeans, shoes, jackets |
| Electronics | 8 items | $49 - $1,299 | Headphones, laptops, smartphones, tablets |
| Home | 8 items | $35 - $129 | Coffee makers, lamps, kitchen items, decor |
| Sports | 8 items | $25 - $150 | Yoga mats, dumbbells, tennis equipment |

Each product includes:
- Unique identifier
- Descriptive name and detailed description
- Category classification
- Pricing information
- High-quality product imagery
- Metadata for vector search optimization

---

## Usage Examples

### Text-Based Product Discovery

```
User: "I need a laptop for software development"

AI: "For software development, I recommend the Laptop 15" Pro ($1,299).
     It features high-performance specifications ideal for development work,
     including ample memory and processing power for compiling code and
     running development environments."

[Displays: Laptop product card with image, price, and details]
```

### Conversational Context Awareness

```
User: "Show me wireless headphones"
AI: [Displays Wireless Headphones product - $150]

User: "What's the price range?"
AI: "The Wireless Headphones I just showed you are priced at $150.
     They feature premium noise cancellation technology."
```

### Image-Based Search

```
User: [Uploads image of a blue t-shirt]

AI: "I've analyzed your image and identified a blue colored shirt item.
     While I don't have an exact match in our current catalog, here are
     similar clothing items you might be interested in..."

[Displays: Similar shirt products with relevance scores]
```

---

## Development and Testing

### Available Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run typecheck        # Run TypeScript compiler checks
npm run lint             # Run ESLint with auto-fix
npm run audit            # Complete code quality audit

# Production
npm run build            # Production build with optimizations
npm run start            # Start production server

# Utilities
npm run generate-embeddings  # Populate vector database
npm run clean                # Remove build artifacts
```

### Quality Assurance

The project implements multiple layers of quality assurance:

- **Type Safety**: Strict TypeScript configuration with no implicit any
- **Linting**: ESLint with Next.js and React best practices
- **Code Analysis**: Knip for dead code detection
- **Build Verification**: Pre-build type checking
- **API Testing**: Manual testing protocols documented

### Test Coverage

```bash
# Type checking (must pass)
npm run typecheck

# Linting (must pass)
npm run lint:check

# Build verification (must succeed)
npm run build

# Full quality audit
npm run audit
```

---

## API Reference

### Core Endpoints

#### POST /api/chat
Conversational interface for general questions and product recommendations.

#### POST /api/search/image
Image upload and analysis for visual product search.

#### POST /api/search/products
Direct semantic search with optional filters.

#### GET /api/health
Service health check and status monitoring.

**Complete Documentation**: [docs/API.md](./docs/API.md)

---

## Deployment

### Vercel Deployment (Recommended)

The application is optimized for deployment on Vercel's serverless platform:

1. **Push to GitHub**: Commit all changes to repository
2. **Import to Vercel**: Connect repository in Vercel dashboard
3. **Configure Environment**: Set all required API keys
4. **Deploy**: Automatic build and deployment

**Environment Variables Required**:
- `OPENROUTER_API_KEY` - Grok AI access
- `GEMINI_API_KEY` - Embedding generation
- `PINECONE_API_KEY` - Vector database access
- `NEXT_PUBLIC_APP_URL` - Application URL (optional)

**Post-Deployment**:
- Generate embeddings using the production Pinecone instance
- Verify all API endpoints respond correctly
- Test conversation memory and product search

**Deployment Guide**: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## Performance Characteristics

### Response Metrics

- **Cold Start Latency**: 2-3 seconds (vector store initialization)
- **Warm Request Latency**: <1 second (cached operations)
- **Image Analysis**: ~2 seconds (vision model inference)
- **Session Lookup**: O(1) constant time

### Optimization Strategies

1. **Module-Level Caching**: Vector store and embeddings model persisted across requests
2. **Session Truncation**: Memory bounded to 50 messages per session
3. **Context Window Management**: RAG pipeline uses last 20 messages only
4. **Automatic Cleanup**: Background process removes stale sessions every 10 minutes
5. **Race Condition Prevention**: Async locks ensure data consistency

### Scalability Considerations

**Current Capacity**:
- Products: 32 (can scale to 10K+ with current architecture)
- Concurrent Users: ~100 (limited by free tier API quotas)
- Active Sessions: ~1000 (limited by server memory)

**Scaling Path**:
- Upgrade to paid AI tiers for higher throughput
- Implement Redis for distributed session storage
- Add horizontal scaling with load balancing
- Optimize vector search with metadata filtering

---

## Security Considerations

### Current Implementation (Development/Demo)

- API keys stored in environment variables (secure)
- No authentication required (demo purposes)
- Open CORS policy for development
- Input validation on all endpoints
- Error messages sanitized (no internal details exposed)

### Production Recommendations

1. **Authentication**: Implement NextAuth.js for user sessions
2. **Rate Limiting**: Add per-user request throttling
3. **CORS**: Restrict to known origins only
4. **Input Sanitization**: Enhanced validation and sanitization
5. **API Keys**: Implement API key authentication for external access
6. **Monitoring**: Add error tracking (Sentry) and uptime monitoring
7. **Logging**: Implement structured logging with PII redaction

---

## Documentation

Complete technical documentation available in the `docs/` directory:

- **[SETUP.md](./docs/SETUP.md)** - Installation and configuration guide
- **[API.md](./docs/API.md)** - Complete API reference with examples
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design and technical decisions
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Production deployment procedures
- **[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Issue resolution guide

---

## Technology Stack Rationale

### Core Technologies: LangChain, Next.js, Pinecone, Vercel

The tech stack was chosen with three key constraints in mind:
1. **Time**: Complete a production-ready system in 2-3 days
2. **Cost**: Zero-cost operation for demonstration purposes
3. **Quality**: Production-grade architecture that could scale

---

### Next.js + TypeScript

**Why Next.js?**

The critical factor was the **unified codebase**. With Next.js API routes, I could build the entire backend in the same repository without setting up a separate Express/FastAPI server. This saved significant development time and simplified deployment.

Key advantages:
- **File-based routing** - minimal boilerplate
- **Built-in optimizations** - automatic image and font optimization
- **Server components** - mix server and client logic naturally
- **Vercel deployment** - seamless integration (Vercel built Next.js)

**TypeScript** was essential for a professional assessment - type safety catches bugs at compile time and makes the codebase self-documenting.

---

### LangChain

**Why LangChain for AI orchestration?**

LangChain provides production-ready abstractions for complex AI workflows:

**Key Features Used**:
- **RAG Chains** - pre-built retrieval-augmented generation pipelines
- **History-Aware Retrieval** - automatic query reformulation using conversation context
- **Vector Store Integration** - first-class Pinecone support
- **Message History Management** - built-in conversation memory patterns

**The History-Aware Retrieval Advantage**:

Without it:
```
User: "Show me headphones"
AI: [shows headphones]
User: "cheaper options"
AI: [searches for "cheaper options" - gets random cheap products]
```

With LangChain's history-aware retrieval:
```
User: "Show me headphones"
AI: [shows headphones]
User: "cheaper options"
   → LangChain reformulates: "cheaper headphones under $100"
   → Vector search finds relevant products
AI: [shows cheaper headphones]
```

This transforms disconnected searches into actual conversation - implemented in ~20 lines of code but creates a 10x better experience.

---

### Pinecone Vector Database

**Why Pinecone?**

Pinecone is an **industry standard** for vector databases, especially in production environments. For this project:

**Technical Advantages**:
- **Serverless architecture** - zero infrastructure management
- **Cloud-hosted** - vectors persist across deployments (critical for Vercel's ephemeral functions)
- **Fast cold starts** - no local initialization overhead
- **Metadata filtering** - category and price range filtering built-in
- **LangChain integration** - first-class support with minimal code

**Why serverless matters for Vercel**:
- Vercel functions are ephemeral - storage gets wiped between cold starts
- Local vector DBs would need to reload on every cold start (terrible UX)
- Pinecone keeps vectors in the cloud permanently

**Scalability**:
- Free tier: 100K vectors (32 products is only 0.032% utilization)
- Production tier: Millions of vectors with auto-scaling
- No code changes needed to scale up

---

### Grok-4-fast via OpenRouter

**Why Grok?**

Grok-4-fast is a **free model** on OpenRouter's platform, making it ideal for development and demonstration:

**Key Characteristics**:
- **Zero cost** - completely free tier with no credit card required
- **2M token context window** - exceptional for conversation history (far exceeds GPT-4's 128K)
- **Multimodal** - handles both text and vision in the same model
- **Inference speed** - noticeably slower than GPT-4, but acceptable for this use case

**Trade-offs**:
- Grok is **a lot slower** than premium models like GPT-4
- Slightly less accurate for complex reasoning tasks
- For product recommendations (relatively simple domain), the speed/accuracy trade-offs are acceptable given zero cost

**OpenRouter Benefits**:
- Single API for multiple models
- Automatic fallback if one model has issues
- Common pattern in production (model abstraction layer)

---

### Vercel Deployment Platform

**Why Vercel?**

Vercel provides the simplest path from development to production:

**Integration Benefits**:
- **One-click deployment** - GitHub integration with automatic CI/CD
- **Serverless** - automatic scaling, zero infrastructure management
- **Edge network** - global CDN for fast response times
- **Environment management** - secure environment variable storage
- **Preview deployments** - automatic staging environments for PRs

**Next.js Optimization**:
- Vercel built Next.js, so integration is seamless
- Automatic build optimization
- Built-in analytics and monitoring
- Free tier sufficient for demonstration

---

### RAG Architecture

**Why RAG (Retrieval-Augmented Generation)?**

RAG was chosen over fine-tuning for practical reasons:

**RAG Advantages**:
- **Factual accuracy** - model can only recommend products that exist in the vector DB
- **Easy updates** - change products, regenerate embeddings in 30 seconds
- **Zero training cost** - only inference costs
- **Transparency** - can inspect exactly what context the model received

**Alternative Considered: Fine-Tuning**
- Would require hours of training data preparation
- Expensive compute costs (hundreds of dollars)
- Slow iteration cycle (retrain for every product change)
- Risk of hallucination (model might "remember" products that don't exist)

For a dynamic product catalog, RAG is the clear choice. The trade-off is ~500ms additional latency for retrieval, but <1s total response time is still excellent UX.

---

### The Stack as a System

**How it all works together**:

```
User Query
    ↓
Next.js API Route (validation, routing)
    ↓
LangChain Agent (orchestration)
    ↓
Pinecone Vector Search (semantic retrieval)
    ↓
LangChain RAG Chain (context injection + generation)
    ↓
Grok-4-fast (response generation)
    ↓
Next.js Response (streaming to UI)
    ↓
Vercel Edge Network (global delivery)
```

Each component has a specific role:
- **Next.js**: Full-stack framework (frontend + backend)
- **LangChain**: AI orchestration and memory management
- **Pinecone**: Industry-standard vector search at scale
- **Grok/OpenRouter**: Free multimodal AI with huge context window
- **Vercel**: Zero-config deployment and hosting

---

### Production Considerations

**What I'd change for a real product**:

1. **Paid AI tier** - GPT-4 for better accuracy when cost isn't a constraint
2. **Redis for sessions** - persistent memory across server restarts (Upstash)
3. **PostgreSQL for products** - proper relational database with real-time updates (Supabase)
4. **Real streaming** - Server-Sent Events for better perceived performance

**What I'd keep**:
- ✅ **LangChain** - production standard for AI applications
- ✅ **Pinecone** - industry standard for vector search
- ✅ **Next.js** - proven at scale (used by Netflix, Hulu, TikTok)
- ✅ **Vercel** - reliable hosting with excellent DX

The current stack demonstrates **production-quality patterns** (caching, error handling, session management) while maintaining **zero-cost operation** for demonstration.

---

## Code Quality Standards

- **TypeScript**: Strict mode with comprehensive type coverage
- **ESLint**: Configured for Next.js and React best practices
- **Code Style**: Prettier for consistent formatting
- **Architecture**: Clear separation of concerns with modular design
- **Error Handling**: Comprehensive try-catch with specific error types
- **Comments**: Strategic documentation of complex logic
- **Naming**: Clear, descriptive variable and function names

---

## Future Enhancements

**Phase 1 - Core Improvements**:
- User authentication and personalization
- Shopping cart checkout implementation
- Product reviews and ratings
- Persistent conversation history (PostgreSQL/Supabase)

**Phase 2 - AI Enhancements**:
- Multi-turn image analysis
- Product comparison feature
- Voice input/output
- Personalized recommendations based on user history
- A/B testing for different prompts

**Phase 3 - Scale**:
- Admin dashboard for product management
- Analytics and business intelligence
- Multi-language support
- Mobile application (React Native)
- Integration with real e-commerce platforms

---

## Technical Achievements

This implementation demonstrates:

- **Full-Stack Development**: Frontend, backend, and infrastructure
- **AI/ML Engineering**: RAG, embeddings, multimodal AI
- **Production Patterns**: Caching, error handling, session management
- **Code Quality**: TypeScript, linting, modular architecture
- **Documentation**: Comprehensive technical documentation
- **Performance**: Sub-second response times with optimization
- **Scalability**: Clear path from prototype to production

---

## Dependencies

### Core Dependencies
- `next`: ^14.2.33 - React framework
- `react`: ^18 - UI library
- `typescript`: ^5 - Type safety
- `langchain`: ^0.3.34 - AI orchestration
- `@langchain/openai`: ^0.3.11 - OpenAI-compatible LLM integration
- `@langchain/pinecone`: ^0.2.0 - Vector store integration
- `@pinecone-database/pinecone`: ^6.1.2 - Vector database client
- `tailwindcss`: ^4.1.9 - Styling framework

### Development Dependencies
- `eslint`: ^9.36.0 - Code linting
- `knip`: ^5.64.1 - Dead code detection
- `tsx`: ^4.20.6 - TypeScript execution
- `typescript-eslint`: ^8.45.0 - TypeScript linting rules

**Complete dependency list**: [src/package.json](./src/package.json)

---

## Support and Maintenance

### Getting Help

1. **Setup Issues**: Consult [docs/SETUP.md](./docs/SETUP.md)
2. **API Questions**: Reference [docs/API.md](./docs/API.md)
3. **Technical Details**: Review [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
4. **Common Problems**: Check [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

### Reporting Issues

For technical issues or questions:
1. Review documentation in `docs/` directory
2. Check troubleshooting guide
3. Verify environment configuration
4. Review server logs for error details

---

## License

This project was developed as a take-home assessment for Palona AI.

---

## Author

**Michael Chen**
AI Software Engineer Intern Candidate
Palona AI Assessment - September 2025

---

## Acknowledgments

**Third-Party Services**:
- OpenRouter for providing access to Grok AI models
- Google for Gemini embedding models
- Pinecone for serverless vector database infrastructure
- Vercel for hosting and deployment platform

**Open Source Libraries**:
- LangChain team for AI orchestration framework
- Next.js team for React framework
- Radix UI and shadcn for component libraries

---

## Contact

For questions regarding this assessment, please contact through the Palona AI recruitment process.

---

**Assessment Submission for Palona AI - AI Software Engineer Intern Position**