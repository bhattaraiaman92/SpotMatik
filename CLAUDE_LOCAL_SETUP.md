# How to Use Claude API Locally (Bypass CORS Error)

## Quick Solutions

### Option 1: Use OpenAI or Gemini (Easiest)
**This is the fastest solution** - Switch to OpenAI or Gemini provider in the app. They work directly from the browser without any proxy setup.

### Option 2: Run Local Proxy Server (For Claude)

The app now automatically tries multiple proxy URLs. To make Claude work locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local proxy server** (in a separate terminal):
   ```bash
   npm run proxy
   ```
   This starts a proxy server on `http://localhost:3001`

3. **Start your dev server** (in another terminal):
   ```bash
   npm run dev
   ```

4. **Use Claude in the app** - It will automatically detect and use the proxy at `localhost:3001`

### Option 3: Deploy to Vercel (Production)

Deploy your app to Vercel - the proxy endpoint (`/api/claude-proxy`) will work automatically without any additional setup.

## How It Works

The Claude service now:
- ✅ Tries multiple proxy URLs automatically
- ✅ Works with relative paths in production (Vercel)
- ✅ Works with local proxy server on port 3001
- ✅ Falls back gracefully with helpful error messages

## Troubleshooting

### Proxy Server Not Starting?

If you get an error about missing modules:
```bash
npm install express cors
```

### Still Getting CORS Errors?

1. Make sure the proxy server is running (`npm run proxy`)
2. Check that it's listening on port 3001
3. Try using OpenAI or Gemini instead (they work everywhere)

### Proxy Works But API Fails?

- Verify your Claude API key is correct
- Check the proxy server terminal for error messages
- Make sure your API key has the right permissions

## Code Changes Made

1. **Enhanced `claudeService.js`:**
   - Tries multiple proxy URLs in sequence
   - Better error handling and fallback logic
   - Prioritizes local proxy server (port 3001)

2. **Added `local-proxy-server.js`:**
   - Simple Express server for local development
   - Runs on port 3001
   - Handles Claude API requests server-side

3. **Updated `package.json`:**
   - Added `proxy` script to run local server
   - Added express and cors as dev dependencies

## Next Steps

1. Install dependencies: `npm install`
2. Start proxy: `npm run proxy` (Terminal 1)
3. Start app: `npm run dev` (Terminal 2)
4. Use Claude API in your app!

