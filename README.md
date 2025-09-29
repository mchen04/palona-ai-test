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
- **Framework**: [To be selected - React/Next.js/Vue/etc.]
- **Styling**: [To be selected - Tailwind/CSS Modules/Styled Components]
- **State Management**: [To be selected based on complexity]

### Backend
- **Runtime**: [To be selected - Node.js/Python/etc.]
- **Framework**: [To be selected - Express/FastAPI/etc.]
- **AI/ML**: [To be selected - OpenAI API/Local models/etc.]

### Database & Storage
- **Product Catalog**: [To be selected - JSON/SQLite/PostgreSQL/etc.]
- **Session Management**: [To be selected based on requirements]

### Deployment
- **Hosting**: [To be selected - Vercel/Railway/AWS/etc.]
- **CI/CD**: [To be selected based on platform]

## **Architecture Decisions**

*[Technology choices and architectural decisions will be documented here as implementation progresses]*

### Key Design Principles
- **Single Agent Architecture**: One AI agent handles all use cases for consistency
- **Modular Design**: Separate modules for different interaction types while maintaining unified interface
- **Scalable Foundation**: Architecture designed to support future feature additions
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