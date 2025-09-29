# API Documentation

Complete API reference for the AI Commerce Chatbot.

---

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: Your Vercel deployment URL

---

## Endpoints

### 1. Chat with AI Agent

**Endpoint**: `POST /api/chat`

**Description**: Main conversational endpoint for general questions and text-based product recommendations.

**Request Body**:
```json
{
  "message": "Show me laptops under $1000",
  "sessionId": "optional-session-id",
  "context": {}
}
```

**Parameters**:
- `message` (string, required): User's message or query
- `sessionId` (string, optional): Session ID for conversation history. If not provided, a new session is created
- `context` (object, optional): Additional context (reserved for future use)

**Response**:
```json
{
  "response": "Here are some great laptops under $1000...",
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
  "sessionId": "session_1234567890",
  "model": "x-ai/grok-4-fast:free"
}
```

**Success Codes**:
- `200 OK`: Request successful

**Error Codes**:
- `400 Bad Request`: Missing or invalid message
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `504 Gateway Timeout`: Request timeout

**Example (curl)**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me wireless headphones",
    "sessionId": "test_session_123"
  }'
```

**Example (JavaScript)**:
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "What's the price of the laptop?",
    sessionId: 'my-session-123'
  })
});

const data = await response.json();
console.log(data.response, data.products);
```

**Features**:
- ✅ Session-based conversation memory
- ✅ RAG-powered product search
- ✅ History-aware query reformulation
- ✅ Automatic session cleanup (1 hour timeout)

---

### 2. Image-Based Product Search

**Endpoint**: `POST /api/search/image`

**Description**: Search for products by uploading an image. Uses vision AI to analyze the image and find similar products.

**Request**: `multipart/form-data`

**Form Fields**:
- `image` (file, required): Image file (JPEG, PNG, or WebP, max 4MB)
- `useRAG` (string, optional): Set to "true" to use RAG for intelligent responses (default: false)

**Response**:
```json
{
  "success": true,
  "imageAnalysis": {
    "description": "A red cotton t-shirt",
    "features": {
      "category": "clothing",
      "color": ["red"],
      "type": "shirt",
      "style": "casual",
      "material": "cotton"
    },
    "confidence": 0.92,
    "catalogConfidence": 0.75
  },
  "searchQuery": "red shirt casual",
  "products": [
    {
      "id": "1",
      "name": "Classic White T-Shirt",
      "price": 25,
      "description": "Premium cotton classic white t-shirt",
      "image": "/white-t-shirt.png",
      "category": "clothing",
      "relevanceScore": 8
    }
  ],
  "response": "I found products similar to the red shirt in your image. Here are some matching options...",
  "confidence": 0.92,
  "isInCatalog": true,
  "suggestions": ["Other clothing items", "red products"]
}
```

**Success Codes**:
- `200 OK`: Image analyzed successfully

**Error Codes**:
- `400 Bad Request`: No image provided, invalid file type, or file too large
- `500 Internal Server Error`: Image analysis failed

**Example (curl)**:
```bash
curl -X POST http://localhost:3000/api/search/image \
  -F "image=@/path/to/product-image.jpg" \
  -F "useRAG=true"
```

**Example (JavaScript)**:
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('useRAG', 'true');

const response = await fetch('/api/search/image', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.imageAnalysis, data.products);
```

**Supported Formats**:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

**Size Limit**: 4MB

**Features**:
- ✅ Multi-modal AI vision analysis
- ✅ Structured feature extraction (color, type, category, style)
- ✅ Visual similarity re-ranking
- ✅ Catalog confidence scoring
- ✅ Alternative suggestions when no exact match

---

### 3. Product Search

**Endpoint**: `POST /api/search/products`

**Description**: Direct semantic search for products using vector embeddings.

**Request Body**:
```json
{
  "query": "wireless headphones with noise cancellation",
  "filters": {
    "category": "electronics",
    "minPrice": 50,
    "maxPrice": 200
  },
  "useRAG": true
}
```

**Parameters**:
- `query` (string, required): Search query
- `filters` (object, optional):
  - `category` (string): One of "clothing", "electronics", "home", "sports"
  - `minPrice` (number): Minimum price filter
  - `maxPrice` (number): Maximum price filter
- `useRAG` (boolean, optional): Use RAG for natural language response (default: false)

**Response**:
```json
{
  "products": [
    {
      "id": "9",
      "name": "Wireless Headphones",
      "price": 150,
      "description": "Premium wireless headphones with noise cancellation",
      "image": "/wireless-headphones.png",
      "category": "electronics"
    }
  ],
  "response": "I found these great wireless headphones with noise cancellation...",
  "query": "wireless headphones with noise cancellation"
}
```

**Success Codes**:
- `200 OK`: Search completed

**Error Codes**:
- `400 Bad Request`: Missing or invalid query
- `500 Internal Server Error`: Search failed

**Example (curl)**:
```bash
curl -X POST http://localhost:3000/api/search/products \
  -H "Content-Type: application/json" \
  -d '{
    "query": "yoga mat",
    "filters": {
      "category": "sports",
      "maxPrice": 100
    },
    "useRAG": true
  }'
```

**Features**:
- ✅ Semantic vector search with Pinecone
- ✅ Price and category filtering
- ✅ Returns top 4 most relevant products
- ✅ Optional RAG for conversational responses

---

### 4. Health Check

**Endpoint**: `GET /api/health`

**Description**: Simple health check to verify the service is running.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-09-29T12:00:00.000Z",
  "service": "ai-commerce-chatbot",
  "version": "1.0.0"
}
```

**Success Codes**:
- `200 OK`: Service is healthy

**Error Codes**:
- `500 Internal Server Error`: Service unhealthy

**Example (curl)**:
```bash
curl http://localhost:3000/api/health
```

---

### 5. Initialize Embeddings

**Endpoint**: `POST /api/embeddings/init`

**Description**: Initialize the Pinecone vector database index. This should be called once during setup.

**Request**: No body required

**Response**:
```json
{
  "success": true,
  "message": "Pinecone index initialized successfully",
  "indexName": "product-embeddings"
}
```

**Success Codes**:
- `200 OK`: Index initialized

**Error Codes**:
- `500 Internal Server Error`: Initialization failed

**Example (curl)**:
```bash
curl -X POST http://localhost:3000/api/embeddings/init
```

**Note**: This endpoint is typically called during deployment setup, not by end users.

---

## Rate Limits

The API uses free-tier AI models with the following considerations:
- OpenRouter (Grok): Generous free tier with 2M context window
- Gemini embeddings: Free tier with daily quotas
- Automatic fallback handling for rate limits

If you encounter rate limits:
1. Wait a few seconds and retry
2. The API will return a `429` status code
3. Retry logic is built into the agent

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message for the user",
  "details": "Technical details (optional)"
}
```

**Common Errors**:
- `"Message is required"` - Missing message in chat request
- `"Image must be less than 4MB"` - Image file too large
- `"Service temporarily unavailable"` - Rate limit hit
- `"AI service configuration error"` - Missing API keys

---

## Authentication

Currently, the API does not require authentication. For production deployments, consider adding:
- API key authentication
- Rate limiting per IP
- CORS configuration

---

## CORS

The API includes CORS headers for cross-origin requests:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

---

## Best Practices

1. **Session Management**: Reuse the same `sessionId` for conversational context
2. **Image Optimization**: Compress images before upload to stay under 4MB
3. **Error Handling**: Always check response status and handle errors gracefully
4. **Retry Logic**: Implement exponential backoff for rate limit errors
5. **Product IDs**: Store product IDs for cart/checkout functionality

---

## SDK Examples

### Python
```python
import requests

def chat_with_ai(message, session_id=None):
    response = requests.post(
        'http://localhost:3000/api/chat',
        json={'message': message, 'sessionId': session_id}
    )
    return response.json()

result = chat_with_ai("Show me laptops")
print(result['response'])
```

### Node.js
```javascript
async function chatWithAI(message, sessionId) {
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId })
  });
  return await res.json();
}
```

---

## Support

For issues or questions:
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review [SETUP.md](./SETUP.md) for configuration help
- Open an issue in the repository