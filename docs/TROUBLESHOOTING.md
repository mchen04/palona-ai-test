# Troubleshooting and Issue Resolution Guide

Technical reference for diagnosing and resolving common issues in the AI Commerce Chatbot system.

---

## Environment and Configuration Issues

### Error: "OPENROUTER_API_KEY environment variable is required"

**Symptoms**:
- Server fails to start
- Error in terminal when running `npm run dev`

**Solutions**:
1. **Check `.env.local` exists**:
   ```bash
   ls -la src/.env.local
   ```
   If missing, copy from template:
   ```bash
   cp src/.env.example src/.env.local
   ```

2. **Verify API key is set**:
   ```bash
   cat src/.env.local | grep OPENROUTER_API_KEY
   ```
   Should show: `OPENROUTER_API_KEY=sk-or-v1-...`

3. **No spaces or quotes**:
   ```bash
   # Incorrect format
   OPENROUTER_API_KEY = "sk-or-v1-xxx"

   # Correct format
   OPENROUTER_API_KEY=sk-or-v1-xxx
   ```

4. **Restart the dev server**:
   ```bash
   # Kill the server (Ctrl+C)
   npm run dev
   ```

---

### Error: "GEMINI_API_KEY is not configured"

**Symptoms**:
- Embeddings generation fails
- Vector search doesn't work
- Error when running `npm run generate-embeddings`

**Solutions**:
1. **Get a Gemini API key**:
   - Visit [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Create API key
   - Copy it (starts with `AIza...`)

2. **Add to `.env.local`**:
   ```bash
   GEMINI_API_KEY=AIzaYourKeyHere
   ```

3. **Verify it's loaded**:
   ```bash
   node -e "require('dotenv').config({path:'src/.env.local'}); console.log(process.env.GEMINI_API_KEY)"
   ```

---

### Error: "Failed to initialize Pinecone index"

**Symptoms**:
- Embeddings generation fails
- "Index not found" errors
- Vector search returns no results

**Solutions**:
1. **Check Pinecone API key**:
   ```bash
   cat src/.env.local | grep PINECONE_API_KEY
   ```

2. **Verify index exists**:
   - Go to [Pinecone Console](https://app.pinecone.io)
   - Check if `product-embeddings` index exists
   - If not, create it manually (see SETUP.md)

3. **Check index configuration**:
   - Name: `product-embeddings`
   - Dimensions: `768`
   - Metric: `cosine`
   - Region: `us-east-1`

4. **Wait for index to be ready**:
   - New indexes take 30-60 seconds to initialize
   - Check Pinecone console for "Ready" status

5. **Re-run embeddings**:
   ```bash
   npm run generate-embeddings
   ```

---

## API and Request Issues

### Error: Chat API returns "Failed to get AI response"

**Symptoms**:
- Messages don't get responses
- Timeout errors
- 500 Internal Server Error

**Solutions**:
1. **Check API key validity**:
   ```bash
   curl https://openrouter.ai/api/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```
   Should return list of models

2. **Check rate limits**:
   - OpenRouter free tier has limits
   - Wait a few seconds and retry
   - Check [OpenRouter Dashboard](https://openrouter.ai/activity)

3. **Check server logs**:
   ```bash
   # Look for error messages in terminal
   ```

4. **Try a simpler query**:
   - "Hello" should always work
   - If complex queries fail, might be context window issue

---

### Error: "Failed to search products" / No products shown

**Symptoms**:
- Search returns no products
- Product recommendations are empty
- Chat works but doesn't show product cards

**Root Cause**: Embeddings not generated or Pinecone empty

**Solutions**:
1. **Verify embeddings were generated**:
   - Go to [Pinecone Console](https://app.pinecone.io)
   - Select `product-embeddings` index
   - Check "Total vectors" should be 32

2. **Re-generate embeddings**:
   ```bash
   cd src
   npm run generate-embeddings
   ```

3. **Verify output**:
   ```
   Successfully generated and stored embeddings for all products!
      - Products embedded: 32
   ```

4. **Verify products exist**:
   ```bash
   # Should show 32 products
   node -e "console.log(require('./lib/products').products.length)"
   ```

5. **Clear and regenerate** (nuclear option):
   - Delete index in Pinecone console
   - Recreate index with same settings
   - Re-run `npm run generate-embeddings`

---

### Error: Image upload not working

**Symptoms**:
- Image upload button doesn't work
- "Please upload a valid image" error
- Images don't display after upload

**Solutions**:
1. **Check file size**:
   - Max size: 4MB
   - Compress large images
   ```bash
   # Check image size
   ls -lh path/to/image.jpg
   ```

2. **Check file format**:
   - Supported: JPEG (.jpg, .jpeg), PNG (.png), WebP (.webp)
   - Not supported: GIF, SVG, BMP, TIFF
   ```bash
   file path/to/image.jpg
   # Should show: JPEG image data
   ```

3. **Convert unsupported formats**:
   ```bash
   # Using ImageMagick
   convert image.gif image.jpg
   ```

4. **Check browser console**:
   - Open Developer Tools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

5. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

---

## Session and Memory Issues

### Error: Agent doesn't maintain conversation context

**Symptoms**:
- Asking "how much are they?" doesn't reference previous products
- Each message seems like a new conversation
- History lost between messages

**Solutions**:
1. **Check sessionId is consistent**:
   - Frontend should send same sessionId for entire conversation
   - Open browser dev tools → Network tab
   - Check POST /api/chat requests
   - Verify `sessionId` is the same across requests

2. **Server restart clears memory**:
   - In-memory sessions lost on server restart
   - This is expected behavior
   - For persistent history, would need database

3. **Session timeout**:
   - Sessions expire after 1 hour of inactivity
   - Start a new conversation if too old

---

### Error: "Session has too many messages"

**Symptoms**:
- Long conversations start failing
- Timeout errors after many messages

**Solutions**:
- This shouldn't happen (sessions auto-truncate at 50 messages)
- If it does, clear history by refreshing the page
- Check `chatAgent.ts` for `MAX_MESSAGES_PER_SESSION`

---

## Performance Issues

### Issue: First request has high latency (5-10 seconds)

**Cause**: Cold start - initializing vector store and embeddings model

**Solutions**:
- This is normal on first request
- Subsequent requests should be fast (<1s)
- In production, use Vercel's "always warm" feature
- Caching is implemented (`cachedRetriever.ts`)

---

### Issue: Consistent high latency across all requests

**Symptoms**:
- Every message takes 3-5+ seconds
- Consistent slowness

**Solutions**:
1. **Check network latency**:
   ```bash
   curl -w "@-" -o /dev/null -s https://openrouter.ai/api/v1/models
   ```

2. **Check Pinecone region**:
   - Should be `us-east-1` for best performance
   - Verify in Pinecone console

3. **Check rate limiting**:
   - Free tier has rate limits
   - Wait a bit between requests

4. **Reduce context**:
   - Shorter messages = faster responses
   - Clear conversation history (refresh page)

---

## Build and Deployment Issues

### Error: Production build fails

**Symptoms**:
- TypeScript errors
- Build fails with errors
- Can't deploy to Vercel

**Solutions**:
1. **Check TypeScript errors**:
   ```bash
   npm run typecheck
   ```

2. **Fix linting errors**:
   ```bash
   npm run lint
   ```

3. **Clear cache and rebuild**:
   ```bash
   npm run clean
   npm run build
   ```

4. **Check for unused dependencies**:
   ```bash
   npm run knip
   ```

5. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

### Error: Port 3000 already in use

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions**:
1. **Kill process on port 3000**:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Use different port**:
   ```bash
   PORT=3001 npm run dev
   ```

---

## Rate Limiting and API Errors

### Error: "Service temporarily unavailable" (HTTP 429)

**Symptoms**:
- Requests fail with 429 status
- "Rate limit exceeded" messages
- Works then stops working

**Solutions**:
1. **Wait and retry**:
   - Free tiers have rate limits
   - Wait 30-60 seconds
   - Automatic fallback is implemented

2. **Check OpenRouter activity**:
   - Visit [OpenRouter Activity](https://openrouter.ai/activity)
   - Check remaining credits/requests

3. **Upgrade to paid tier** (if needed):
   - OpenRouter has affordable paid tiers
   - Or use different model

---

### Error: "Invalid API key" authentication failures

**Symptoms**:
- 401 Unauthorized errors
- "API key invalid" messages

**Solutions**:
1. **Regenerate API keys**:
   - OpenRouter: [https://openrouter.ai/keys](https://openrouter.ai/keys)
   - Gemini: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Pinecone: [Pinecone Console](https://app.pinecone.io)

2. **Update `.env.local`** with new keys

3. **Restart server**:
   ```bash
   npm run dev
   ```

---

## Data Issues

### Error: Products display placeholder images

**Symptoms**:
- Gray boxes instead of product images
- 404 errors for images

**Solutions**:
1. **Check public folder**:
   ```bash
   ls src/public/*.png | wc -l
   # Should show ~32 files
   ```

2. **Verify image paths in products.ts**:
   ```typescript
   image: "/white-t-shirt.png"  // Correct: Leading slash required
   image: "white-t-shirt.png"   // Incorrect: Missing leading slash
   ```

3. **Clear Next.js cache**:
   ```bash
   rm -rf src/.next
   npm run dev
   ```

---

### Issue: Suboptimal product recommendations

**Symptoms**:
- AI suggests products that don't match query
- Irrelevant products shown
- Quality of recommendations is poor

**Solutions**:
1. **Check embeddings are generated**:
   - Verify 32 vectors in Pinecone

2. **Improve product descriptions**:
   - Edit `src/lib/products.ts`
   - Add more detailed descriptions
   - Re-run embeddings

3. **Try different queries**:
   - Be more specific: "wireless over-ear headphones"
   - Include use case: "headphones for gym"
   - Mention price: "headphones under $100"

4. **Check RAG prompt** (`ragChain.ts`):
   - System prompt guides AI behavior
   - Can be tuned for better recommendations

---

## Browser Issues

### Error: Chat interface fails to load

**Symptoms**:
- Blank page
- "Loading..." forever
- JavaScript errors in console

**Solutions**:
1. **Check browser console** (F12):
   - Look for error messages
   - Check Network tab for failed requests

2. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R or Cmd+Shift+R

3. **Try different browser**:
   - Test in Chrome, Firefox, Safari
   - Check if browser-specific issue

4. **Disable browser extensions**:
   - Ad blockers can interfere
   - Try in incognito/private mode

---

## Debugging Tips

### Enable Verbose Logging

Add to your terminal before starting:
```bash
DEBUG=langchain* npm run dev
```

### Check API Health

```bash
# Health check
curl http://localhost:3000/api/health

# Test chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","sessionId":"debug"}'
```

### Monitor Network Requests

1. Open browser dev tools (F12)
2. Go to Network tab
3. Interact with the app
4. Check for failed requests (red)
5. Click on failed requests to see details

### Check Server Logs

The terminal running `npm run dev` shows:
- API request logs
- Error stack traces
- AI model responses (in verbose mode)
- Session management logs

---

## Advanced Troubleshooting

If issues persist after attempting standard resolution procedures:

1. **Review setup documentation**: [SETUP.md](./SETUP.md)
2. **Consult API documentation**: [API.md](./API.md)
3. **Study system architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
4. **Perform clean reinstallation**:
   ```bash
   # Clean everything
   rm -rf src/.next src/node_modules
   rm src/.env.local

   # Start over
   npm install
   cp src/.env.example src/.env.local
   # Add your API keys
   npm run generate-embeddings
   npm run dev
   ```

---

## Common Error Messages Reference

| Error | Meaning | Solution |
|-------|---------|----------|
| `EADDRINUSE` | Port already in use | Kill process or use different port |
| `404 Not Found` | API route doesn't exist | Check URL spelling |
| `429 Too Many Requests` | Rate limit hit | Wait and retry |
| `500 Internal Server Error` | Server error | Check logs for details |
| `ECONNREFUSED` | Can't connect to service | Check service is running |
| `Invalid API Key` | Wrong or expired key | Regenerate API key |
| `Timeout` | Request took too long | Retry or check network |

---

## Best Practices for Issue Prevention

- Verify environment variables before application startup
- Generate embeddings prior to first use
- Begin testing with simple queries to verify basic functionality
- Maintain API key security (never commit to version control)
- Monitor API usage on provider dashboards
- Restart server after environment configuration changes
- Clear cache and rebuild when experiencing unexpected behavior
- Monitor browser console for client-side errors
- Execute TypeScript checks regularly (`npm run typecheck`)
- Run linting before commits (`npm run lint`)

---

**Troubleshooting Guide - AI Commerce Chatbot**
**Palona AI Assessment - Michael Chen - September 2025**