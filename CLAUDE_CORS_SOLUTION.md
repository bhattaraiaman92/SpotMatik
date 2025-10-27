# Claude CORS Error - Solution Guide

## The Problem

When using Claude API with certain organizational settings, you may encounter this error:

```
Error: Claude analysis failed: 401 
{"type":"error","error":{"type":"authentication_error",
"message":"CORS requests are not allowed for this Organization 
because of custom retention settings..."}}
```

This happens because Claude's API doesn't allow direct browser requests (CORS) when your organization has custom retention settings enabled.

## Solutions Implemented

### ✅ Solution 1: Backend Proxy (Recommended for Claude)

We've added a **serverless proxy function** that runs on Vercel:

**How it works:**
1. Frontend sends request to `/api/claude-proxy`
2. Proxy makes server-side request to Claude API (no CORS issues)
3. Proxy returns results to frontend

**Your API key is:**
- Sent with each request
- Never stored on the server
- Passed directly to Claude's API

**To use:**
1. Deploy the app to Vercel (recommended)
2. The proxy will automatically be available
3. Claude requests will automatically use the proxy

### ✅ Solution 2: Use OpenAI or Gemini (Immediate Fix)

The easiest solution is to switch providers:

1. Select **OpenAI** or **Gemini** in the provider dropdown
2. Enter your API key for that provider
3. Both support direct browser requests (no CORS issues)

**Get API keys:**
- OpenAI: https://platform.openai.com/api-keys
- Gemini: https://aistudio.google.com/apikey

## What Was Changed

### 1. Created Backend Proxy (`api/claude-proxy.js`)
- Serverless function for Vercel
- Handles Claude API requests server-side
- Avoids CORS restrictions

### 2. Updated Claude Service (`src/services/claudeService.js`)
- Automatically tries proxy first
- Falls back to direct API if proxy unavailable
- Improved error messages

### 3. Updated UI (`src/App.jsx`)
- Added informative notice about Claude proxy
- Improved error display with line breaks
- Guides users to alternative solutions

### 4. Updated Configuration (`vercel.json`)
- Added API route configuration
- Ensures proxy is accessible at `/api/claude-proxy`

### 5. Documentation
- Updated README.md with troubleshooting
- Updated ARCHITECTURE.md with proxy details
- Created this guide

## Testing

### Local Development
In local development, the proxy might not be available:
- Use **OpenAI** or **Gemini** for testing
- Or run a local proxy server (advanced)

### Production (Vercel)
1. Push your code to GitHub
2. Deploy to Vercel
3. Proxy will automatically work
4. Claude API will function correctly

## Verification

To verify the solution is working:

1. **Check Build**: ✅ Passed - build completes successfully
2. **Deploy to Vercel**: Push to GitHub and deploy
3. **Test Claude**: Upload a TML file with Claude selected
4. **Monitor**: Check browser console for proxy usage

## Fallback Strategy

The app has a smart fallback strategy:

```
Try Proxy → If fails → Try Direct API → If fails → Show Error with Solutions
```

Users are always guided to working alternatives.

## Quick Reference

| Provider | Browser Support | Notes |
|----------|----------------|-------|
| Claude   | ⚠️ Via Proxy   | Uses proxy when deployed |
| OpenAI   | ✅ Direct      | Works everywhere |
| Gemini   | ✅ Direct      | Works everywhere |

## Support

If users still encounter issues:
1. Verify deployment on Vercel
2. Check browser console for errors
3. Try OpenAI or Gemini as alternative
4. Ensure API key is valid and has correct permissions

