# **AI Agent for Commerce Website**

A comprehensive AI-powered shopping assistant that provides general conversation, text-based product recommendations, and image-based product search in a single unified agent.

## **Overview**

This project implements an AI agent similar to Amazon's Rufus, designed to enhance the e-commerce experience through intelligent product discovery and conversational assistance. The agent handles three core functionalities:

1. **General Conversation** - Natural dialogue capabilities ("What's your name?", "What can you do?")
2. **Text-Based Product Recommendation** - Product suggestions based on textual queries ("Recommend me a t-shirt for sports")
3. **Image-Based Product Search** - Visual product discovery through image uploads

## **Features**

### Core Capabilities
- **Unified AI Agent**: Single agent handling all interaction types
- **Natural Language Processing**: Conversational interface for product discovery
- **Visual Search**: Image-based product identification and recommendations
- **Product Catalog Integration**: Recommendations limited to predefined inventory
- **Real-time Responses**: Fast, contextual product suggestions

### User Experience
- Clean, intuitive web interface
- Multi-modal input support (text and images)
- Responsive design for all devices
- Conversational flow with context retention

## **Technology Stack**

### Frontend
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks with local storage
- **UI Components**: Custom chat interface with real-time updates

### Backend & AI
- **Runtime**: Node.js (Next.js API routes)
- **AI Framework**: LangChain with Google Gemini
- **Vector Database**: Pinecone for product embeddings
- **AI Models**: Gemini 1.5 Flash (speed) / Pro (complex queries)

### Data & Storage
- **Product Catalog**: Mock dataset with 30-40 products across 4 categories
- **Images**: Unsplash/Pexels URLs or FakeStore API
- **Embeddings**: Vector embeddings for semantic search
- **Session Management**: Client-side state with chat history

### Deployment
- **Hosting**: Vercel
- **Environment**: Production-ready with environment variables

## **Technical Architecture**

### Data Flow
1. **User Input** (Text/Image) → API Route
2. **API Route** → LangChain Agent
3. **Agent** → Pinecone (Retrieve Context)
4. **Agent + Context** → Gemini (Generate Response)
5. **Response** → Stream to Frontend

### Key Components
- **Chat Engine**: LangChain conversational retrieval chain
- **Vector Store**: Pinecone with product embeddings
- **AI Model**: Gemini for natural language processing and multimodal capabilities
- **Frontend**: React with real-time chat updates
- **RAG Pipeline**: Retrieval-Augmented Generation for context-aware responses

### Product Data Schema
```json
{
  "id": "string",
  "name": "string",
  "category": "string",
  "description": "string",
  "price": "number",
  "image_url": "string",
  "embedding": "vector[768]",
  "metadata": {
    "color": "string",
    "size": "string",
    "brand": "string",
    "tags": "array"
  }
}
```

### Product Categories
- **Clothing**: T-shirts, shoes, jackets, apparel
- **Electronics**: Headphones, phones, laptops, accessories
- **Home**: Furniture, decor, kitchenware, appliances
- **Sports**: Equipment, athletic wear, outdoor gear

### Key Design Principles
- **Single Agent Architecture**: One AI agent handles all use cases for consistency
- **RAG Implementation**: Context retrieval for accurate product recommendations
- **Multimodal Processing**: Text and image input handling
- **Performance Focused**: Optimized for fast response times and smooth user experience

## **API Documentation**

### Agent Endpoints
*[API documentation will be added during implementation]*

### Core Routes
- `POST /api/chat` - General conversation and text-based recommendations
- `POST /api/search/image` - Image-based product search
- `GET /api/products` - Product catalog access
- `GET /api/health` - Service health check

## **Getting Started**

### Prerequisites
*[Prerequisites will be listed based on final technology choices]*

### Installation
```bash
# Clone the repository
git clone [repository-url]
cd palona-ai-test

# Install dependencies
[package manager install command]

# Environment setup
cp .env.example .env
# Configure environment variables

# Start development server
[development start command]
```

### Usage
*[Usage instructions will be added after implementation]*

## **Project Structure**

```
palona-ai-test/
├── README.md
├── [frontend directory]/
├── [backend directory]/
├── [shared utilities]/
├── [product catalog]/
└── [configuration files]
```

*[Detailed project structure will be updated as implementation progresses]*

## **Testing**

*[Testing strategy and instructions will be documented during implementation]*

## **Deployment**

*[Deployment instructions and live demo link will be added upon completion]*

## **Contributing**

This is a take-home exercise project. Implementation decisions and trade-offs are documented throughout the codebase.

## **License**

*[License information if applicable]*

---

**Note**: This README will be continuously updated throughout the development process to reflect actual implementation decisions, API specifications, and deployment details.