# Installation and Configuration Guide

Complete technical guide for setting up and running the AI Commerce Chatbot in a local development environment.

---

## System Requirements

### Minimum Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (included with Node.js)
- **Operating System**: macOS, Linux, or Windows
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB free disk space
- **Network**: Internet connection for API access

### Recommended Development Environment

- **Code Editor**: Visual Studio Code with TypeScript extensions
- **Terminal**: Modern shell (bash, zsh, or PowerShell)
- **Browser**: Chrome, Firefox, or Safari (latest version)
- **Git**: Version control system installed and configured

---

## Installation Procedure

### Step 1: Repository Clone

Clone the repository to your local development environment:

```bash
git clone <repository-url>
cd palona-ai-test
```

### Step 2: Dependency Installation

Navigate to the source directory and install all required packages:

```bash
cd src
npm install
```

This command installs all production and development dependencies specified in `package.json`, including:

**Core Dependencies**:
- Next.js 14 (React framework)
- React 18 (UI library)
- TypeScript 5 (type system)
- LangChain 0.3 (AI orchestration)
- Pinecone client (vector database)
- Tailwind CSS 4 (styling framework)

**Development Tools**:
- ESLint (code linting)
- Knip (dead code detection)
- TypeScript ESLint (type-aware linting)

Installation typically completes in 2-3 minutes depending on network speed.

---

## API Key Configuration

The application requires three API keys from third-party services. All services provide free tiers suitable for development and demonstration.

### OpenRouter API Key

**Purpose**: Provides access to Grok-4-fast language model for conversational AI and vision capabilities.

**Acquisition Steps**:
1. Navigate to [https://openrouter.ai](https://openrouter.ai)
2. Create an account (email verification required)
3. Access the API keys section: [https://openrouter.ai/keys](https://openrouter.ai/keys)
4. Generate a new API key
5. Copy the key (format: `sk-or-v1-...`)

**Service Details**:
- Provider: OpenRouter
- Model Access: Grok-4-fast with 2M token context window
- Free Tier: Generous allocation sufficient for development
- Cost: Zero cost for Grok-4-fast model usage

### Google Gemini API Key

**Purpose**: Generates vector embeddings for semantic product search functionality.

**Acquisition Steps**:
1. Navigate to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Authenticate with Google account
3. Select "Create API Key"
4. Choose existing project or create new project
5. Copy the generated key (format: `AIza...`)

**Service Details**:
- Provider: Google AI Studio
- Model: text-embedding-004 (768 dimensions)
- Free Tier: 1,500 requests per day
- Cost: Zero cost within free tier limits

### Pinecone API Key

**Purpose**: Provides vector database infrastructure for embedding storage and similarity search.

**Acquisition Steps**:
1. Navigate to [https://www.pinecone.io](https://www.pinecone.io)
2. Create an account
3. Access API keys: [https://app.pinecone.io/organizations/-/projects/-/keys](https://app.pinecone.io/organizations/-/projects/-/keys)
4. Copy the default project API key

**Service Details**:
- Provider: Pinecone
- Plan: Serverless (free tier)
- Capacity: 100K vectors, 1GB storage
- Cost: Zero cost within free tier limits

---

## Environment Configuration

### Step 1: Create Environment File

Copy the template environment file:

```bash
cp .env.example .env.local
```

### Step 2: Configure Variables

Edit `.env.local` with your API keys:

```bash
# OpenRouter API Key (Required)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Gemini API Key (Required)
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Pinecone API Key (Required)
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Application URL (Optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Security Considerations

- The `.env.local` file is excluded from version control via `.gitignore`
- Never commit API keys to the repository
- Use different keys for development and production environments
- Rotate keys periodically for security best practices
- Monitor API usage on provider dashboards

---

## Vector Database Initialization

### Pinecone Index Creation

#### Method 1: Manual Creation (Recommended)

1. Access [Pinecone Console](https://app.pinecone.io)
2. Navigate to Indexes section
3. Click "Create Index"
4. Configure index parameters:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Name | `product-embeddings` | Index identifier (must match code) |
| Dimensions | `768` | Vector dimensionality (Gemini embedding size) |
| Metric | `cosine` | Similarity measurement algorithm |
| Cloud Provider | `AWS` | Infrastructure provider |
| Region | `us-east-1` | Data center location |
| Type | `Serverless` | Deployment model (free tier) |

5. Confirm creation
6. Wait for index status to show "Ready" (30-60 seconds)

#### Method 2: Programmatic Creation

After starting the development server:

```bash
curl -X POST http://localhost:3000/api/embeddings/init
```

This endpoint will create the index with the correct configuration if it doesn't exist.

### Embeddings Generation

Execute the embeddings generation script to populate the vector database:

```bash
npm run generate-embeddings
```

**Process Overview**:
1. Loads product catalog (32 products)
2. Generates embeddings using Gemini text-embedding-004
3. Uploads vectors to Pinecone with metadata
4. Verifies successful storage

**Expected Console Output**:
```
Starting embedding generation...
Initializing Pinecone index...
Pinecone index ready
Initializing Gemini embeddings model...
Prepared 32 products for embedding...
Generating embeddings and storing in Pinecone...
Successfully generated and stored embeddings for all products!
   - Products embedded: 32
   - Index: product-embeddings
   - Namespace: products

Your vector database is ready! You can now run the app.
```

**Verification**:
- Access Pinecone Console
- Select `product-embeddings` index
- Verify "Total Vectors" shows 32
- Check namespace shows "products"

---

## Development Server Startup

### Start the Server

Execute the development command:

```bash
npm run dev
```

**Expected Output**:
```
  Next.js 14.2.33
  - Local:        http://localhost:3000
  - Environments: .env.local

 Ready in 2.1s
```

### Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

The application should display the AI Commerce Chatbot interface with two tabs:
- AI Assistant (chat interface)
- Shop Catalog (product grid)

---

## Functional Testing

### Test Suite 1: General Conversation

**Test Case**: Verify conversational AI responds appropriately to general queries.

```
Input: "Hello, what can you do?"
Expected: AI introduces capabilities and provides guidance
```

### Test Suite 2: Text-Based Product Search

**Test Case**: Verify semantic search returns relevant products.

```
Input: "Show me laptops for development"
Expected: Displays laptop products with descriptions and prices
```

### Test Suite 3: Image-Based Search

**Test Case**: Verify vision AI analyzes images and finds similar products.

**Procedure**:
1. Click image upload icon in chat input field
2. Select product image (JPEG, PNG, or WebP format, max 4MB)
3. Submit image

**Expected Result**:
- AI analyzes image
- Extracts features (color, type, category)
- Returns similar products from catalog

### Test Suite 4: Conversation Memory

**Test Case**: Verify session maintains conversation context.

```
Step 1: "Show me wireless headphones"
Step 2: "What's the price?"

Expected: AI references the headphones from Step 1 in Step 2 response
```

---

## Configuration Verification

### Pre-Deployment Checks

Execute the following commands to verify configuration:

```bash
# TypeScript compilation check
npm run typecheck

# Code quality verification
npm run lint:check

# Production build test
npm run build

# Complete audit
npm run audit
```

All commands should complete without errors.

---

## Troubleshooting

### API Key Errors

**Symptom**: "OPENROUTER_API_KEY environment variable is required"

**Resolution**:
1. Verify `.env.local` exists in `src/` directory
2. Confirm no whitespace in API key values
3. Ensure file uses correct naming convention
4. Restart development server after changes

### Embedding Generation Failures

**Symptom**: "GEMINI_API_KEY is not configured" or connection errors

**Resolution**:
1. Verify all three API keys in `.env.local`
2. Confirm Pinecone index exists with correct name
3. Check index dimensions match 768
4. Verify network connectivity to all services

### Product Search Returns Empty

**Symptom**: Search queries return no products

**Resolution**:
1. Execute `npm run generate-embeddings`
2. Verify Pinecone console shows 32 vectors
3. Confirm index name matches `product-embeddings`
4. Check namespace is set to `products`

### Port Conflicts

**Symptom**: "EADDRINUSE: address already in use :::3000"

**Resolution**:
```bash
# Terminate process on port 3000
lsof -ti:3000 | xargs kill -9

# Or specify alternative port
PORT=3001 npm run dev
```

For additional troubleshooting, consult [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Development Workflow

### Available NPM Scripts

| Command | Purpose | Usage |
|---------|---------|-------|
| `npm run dev` | Start development server | Development |
| `npm run build` | Production build | Pre-deployment |
| `npm run start` | Start production server | Production |
| `npm run typecheck` | TypeScript validation | CI/CD |
| `npm run lint` | Code linting with auto-fix | Development |
| `npm run lint:check` | Lint without fixes | CI/CD |
| `npm run audit` | Complete quality check | Pre-commit |
| `npm run clean` | Remove build artifacts | Troubleshooting |
| `npm run generate-embeddings` | Populate vector DB | Initial setup |

### Recommended Development Process

1. **Feature Development**: Make code changes with `npm run dev` running
2. **Type Checking**: Execute `npm run typecheck` periodically
3. **Linting**: Run `npm run lint` before commits
4. **Build Verification**: Test `npm run build` before deployment
5. **Quality Audit**: Execute `npm run audit` before pull requests

---

## Next Steps

After successful setup, proceed with:

1. **API Exploration**: Review [API.md](./API.md) for endpoint documentation
2. **Architecture Understanding**: Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. **Deployment Preparation**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
4. **Issue Resolution**: Reference [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) as needed

---

## Additional Resources

### Documentation
- [API Reference](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [LangChain JS Documentation](https://js.langchain.com/)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [OpenRouter API](https://openrouter.ai/docs)

---

## Support

For technical assistance:
1. Consult documentation in `docs/` directory
2. Review troubleshooting guide for common issues
3. Verify environment configuration
4. Check server logs for detailed error information

---

**Installation Guide - AI Commerce Chatbot**
**Palona AI Assessment - Michael Chen - September 2025**