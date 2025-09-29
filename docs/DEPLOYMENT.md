# Production Deployment Guide

Technical procedures for deploying the AI Commerce Chatbot to production infrastructure.

---

## Deployment Prerequisites

Before initiating deployment, ensure the following requirements are met:

- All three API keys obtained (OpenRouter, Gemini, Pinecone)
- Pinecone index created with name `product-embeddings`
- Embeddings successfully generated and verified locally
- GitHub account configured
- Vercel account created (free tier sufficient)

---

## Deployment Options

This guide covers:
1. **Vercel** (Recommended) - One-click deployment
2. **Manual Deployment** (Alternative platforms)

---

## Option 1: Deploy to Vercel (Recommended)

### Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: AI Commerce Chatbot"

# Create GitHub repo and push
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Connect Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up or log in
3. Click **"Add New..."** → **"Project"**
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `src`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | Production, Preview, Development |
| `GEMINI_API_KEY` | `AIza...` | Production, Preview, Development |
| `PINECONE_API_KEY` | `your-key` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |

**Important**:
- Apply to all environments (Production + Preview + Development)
- Don't use quotes around values
- `NEXT_PUBLIC_APP_URL` should be your actual Vercel URL

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Vercel will provide a URL: `https://your-app.vercel.app`

### Step 5: Post-Deployment Setup

#### Generate Embeddings in Production

**Option A: Use API Endpoint (Recommended)**
```bash
curl -X POST https://your-app.vercel.app/api/embeddings/init
```

Then run the embeddings script locally but pointing to production Pinecone:
```bash
# Make sure your .env.local has production Pinecone API key
cd src
npm run generate-embeddings
```

**Option B: Deploy Script as Serverless Function**
- Add embeddings generation as a one-time function
- Call it once after deployment
- Remove after embeddings are loaded

### Step 6: Verify Deployment

1. **Test Health Check**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```
   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "service": "ai-commerce-chatbot",
     "version": "1.0.0"
   }
   ```

2. **Test Chat**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"Hello","sessionId":"test"}'
   ```

3. **Test in Browser**:
   - Visit `https://your-app.vercel.app`
   - Try chatting: "Show me laptops"
   - Upload an image
   - Verify product recommendations work

### Step 7: Set Up Custom Domain (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your custom domain (e.g., `shop.yourdomain.com`)
3. Update DNS records as instructed
4. Wait for DNS propagation (5-60 minutes)
5. Update `NEXT_PUBLIC_APP_URL` env var

---

## Continuous Deployment

With Vercel + GitHub:
- **Every push to `main`** → Deploys to production
- **Every pull request** → Creates preview deployment
- **Preview deployments** → Get unique URL for testing

No additional setup needed!

---

## Environment-Specific Configuration

### Production
- Use production Pinecone API key
- Enable Vercel Analytics (optional)
- Set up monitoring (optional)

### Preview (Staging)
- Can use same API keys as production
- Or use separate Pinecone index for testing
- Great for testing new features

### Development (Local)
- Use `.env.local` file
- Can use same API keys (free tier)

---

## Vercel Configuration Options

### next.config.mjs

Your current config:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add any custom Next.js config here
}

export default nextConfig
```

**Optional enhancements**:
```javascript
const nextConfig = {
  // Optimize images
  images: {
    domains: ['your-image-cdn.com'],
  },

  // Environment variable validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ]
      }
    ]
  },
}
```

### vercel.json (Optional)

Create `vercel.json` in project root for advanced config:
```json
{
  "buildCommand": "cd src && npm run build",
  "devCommand": "cd src && npm run dev",
  "installCommand": "cd src && npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "OPENROUTER_API_KEY": "@openrouter-api-key",
    "GEMINI_API_KEY": "@gemini-api-key",
    "PINECONE_API_KEY": "@pinecone-api-key"
  }
}
```

---

## Performance Optimization

### Enable Vercel Speed Insights
1. Install package:
   ```bash
   npm install @vercel/speed-insights
   ```

2. Add to `app/layout.tsx`:
   ```typescript
   import { SpeedInsights } from '@vercel/speed-insights/next'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <SpeedInsights />
         </body>
       </html>
     )
   }
   ```

### Enable Vercel Analytics
Already installed in your `package.json`!

Update `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Edge Functions (Advanced)

For ultra-fast responses, consider Edge deployment:

In API routes, add:
```typescript
export const runtime = 'edge'
```

**Trade-offs**:
- ✅ Faster cold starts
- ✅ Lower latency
- ❌ Some Node.js APIs not available
- ❌ May need code changes

---

## Monitoring & Logs

### View Logs
1. Go to Vercel Dashboard
2. Select your project
3. Click **"Logs"** tab
4. Filter by:
   - Runtime (what happens during requests)
   - Build (what happens during deployment)

### Set Up Alerts
1. Vercel Dashboard → Integrations
2. Add **Sentry** for error tracking (optional)
3. Add **Better Uptime** for uptime monitoring (optional)

### Check Analytics
1. Vercel Dashboard → Analytics
2. See:
   - Page views
   - Unique visitors
   - Performance metrics
   - Error rates

---

## Cost Considerations

### Vercel Free Tier Features:
- Unlimited deployments
- 100GB bandwidth per month
- Serverless function executions
- Preview deployments for pull requests
- Custom domain support
- Automatic SSL certificates

### Commercial Tier Requirements:
- Large-scale commercial applications
- Bandwidth usage exceeding 100GB per month
- Enterprise support and features

**Assessment Note**: Free tier provides adequate resources for demonstration purposes.

### AI API Costs:
- **OpenRouter** (Grok): Generous free tier
- **Gemini Embeddings**: 1500 requests/day free
- **Pinecone**: 100K vectors free

**Estimate**: Free for development/demo, ~$10-20/mo for production with moderate traffic

---

## Security Best Practices

### Environment Variables
- Utilize Vercel's encrypted environment variable storage
- Never commit `.env.local` to version control
- Implement periodic API key rotation
- Maintain separate keys for production and development environments

### API Security
- Consider adding authentication for production
- Implement rate limiting per user
- Add CSRF protection
- Validate all inputs

### CORS Configuration
Current setup allows all origins (`*`). For production:
```typescript
// In API routes
const allowedOrigins = ['https://your-domain.com']
const origin = request.headers.get('origin')

if (allowedOrigins.includes(origin)) {
  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': origin,
    }
  })
}
```

---

## Rollback & Version Control

### Rollback to Previous Deployment
1. Vercel Dashboard → Deployments
2. Find working deployment
3. Click **"..."** → **"Promote to Production"**

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, commit
git add .
git commit -m "Add new feature"

# Push to GitHub (creates preview deployment)
git push origin feature/new-feature

# Create PR, test preview URL
# Merge to main (deploys to production)
```

---

## Troubleshooting Deployment Issues

### Build Fails

**Check build logs**:
1. Vercel Dashboard → Deployments
2. Click on failed deployment
3. View build logs

**Common issues**:
- TypeScript errors: Run `npm run typecheck` locally
- Missing dependencies: Check `package.json`
- Environment variables missing: Verify in Vercel settings

### Runtime Errors

**Check function logs**:
1. Vercel Dashboard → Logs
2. Filter by "Runtime"
3. Look for error stack traces

**Common issues**:
- API key not set: Check environment variables
- Pinecone connection fails: Verify API key and index name
- Timeout errors: Increase function timeout (Vercel Pro)

### Embeddings Not Working in Production

1. **Verify Pinecone index exists**:
   - Go to Pinecone console
   - Check `product-embeddings` index
   - Verify 32 vectors present

2. **Run embeddings locally with production keys**:
   ```bash
   # Temporarily use production Pinecone key
   PINECONE_API_KEY=prod-key npm run generate-embeddings
   ```

---

## Alternative Deployment Platforms

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and init
railway login
railway init

# Add environment variables
railway variables set OPENROUTER_API_KEY=xxx
railway variables set GEMINI_API_KEY=xxx
railway variables set PINECONE_API_KEY=xxx

# Deploy
railway up
```

### Netlify
- Similar to Vercel
- Connect GitHub repo
- Add environment variables
- Deploy

### Self-Hosted (Docker)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY src/package*.json ./
RUN npm ci
COPY src .
RUN npm run build
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t ai-commerce .
docker run -p 3000:3000 --env-file .env.local ai-commerce
```

---

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Embeddings generated in Pinecone
- [ ] Health check passes
- [ ] Chat functionality works
- [ ] Image upload works
- [ ] Product search returns results
- [ ] Custom domain configured (if applicable)
- [ ] Analytics enabled (optional)
- [ ] Error monitoring set up (optional)
- [ ] Logs checked for errors
- [ ] Performance tested
- [ ] Security headers configured
- [ ] CORS configured for your domain

---

## Maintenance

### Regular Tasks
- Monitor API usage and costs
- Check for security updates
- Update dependencies monthly
- Review error logs weekly
- Rotate API keys periodically

### Updates
```bash
# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Rebuild and deploy
git add .
git commit -m "Update dependencies"
git push
```

---

## External Resources

- **Vercel Documentation**: [https://vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Community Support**: [https://github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

## Deployment Verification

Upon successful deployment, the application will be accessible at the assigned Vercel URL.

### Deployment Artifacts:
- Production URL: `https://your-app.vercel.app`
- GitHub Repository: Project source code location
- Demo Materials: Optional video demonstration of functionality

### Post-Deployment Recommendations:
- Expand product catalog with additional items
- Implement user authentication system
- Integrate shopping cart checkout functionality
- Establish user feedback collection mechanisms
- Implement iterative improvements based on usage analytics

---

**Production Deployment Guide - AI Commerce Chatbot**
**Palona AI Assessment - Michael Chen - September 2025**