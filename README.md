# Spotter TML Optimizer

AI-powered optimization tool for ThoughtSpot TML files.

## Quick Start

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open http://localhost:5173 in your browser

## How to Use

1. **Select Your AI Provider**: Choose between Claude, ChatGPT, or Gemini based on which API key you have
2. **Choose a Model**: Select the specific model version you want to use
3. **Enter API Key**: Paste your API key from the provider's console
4. **Upload TML File**: Drag and drop or click to browse for your TML file
5. **Analyze**: Click "Analyze with AI" and wait for the results
6. **Review Recommendations**: Get detailed, priority-ranked optimization suggestions
7. **Download Report**: Export your results as a markdown file

> **Note**: Your API key is stored only in your browser session and is never sent to any server other than the selected AI provider.

## Features

- **Multi-Provider AI Support**: Choose between Claude (Anthropic), ChatGPT (OpenAI), Azure OpenAI, or Gemini (Google)
- **Model Selection**: Select from multiple models within each provider
  - Standard models for fast, cost-effective analysis
  - Advanced models for deeper insights
  - Reasoning models (Azure OpenAI only: o1-mini, o3-mini) for complex reasoning tasks
- Upload TML files
- AI-powered analysis
- Industry-specific recommendations
- Priority-based suggestions
- Downloadable reports (Markdown and Word)

## Supported AI Providers

### Claude (Anthropic)
- Models: `claude-sonnet-4-20250514`, `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`
- Get API key: [console.anthropic.com](https://console.anthropic.com/)

⚠️ **Important Note about Claude**: 
If your organization has custom retention settings, Claude's API may block direct browser requests due to CORS restrictions. This app includes a backend proxy to work around this limitation. When deployed on Vercel, the proxy is automatically available. If you encounter CORS errors with Claude, please use **OpenAI**, **Azure OpenAI** or **Gemini** instead, or ensure the app is deployed with the proxy enabled.

### ChatGPT (OpenAI)
- Models: `gpt-4o`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`
- Get API key: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- ✅ Fully supports browser-based requests

### Azure OpenAI
- Standard Models: `gpt-4o`, `gpt-4o-mini`
- Reasoning Models: `o1-mini`, `o3-mini`
- Get API key: [portal.azure.com](https://portal.azure.com/)
- ✅ Enterprise-grade with reasoning models support
- 📋 Requires: Azure endpoint URL and deployment name

### Gemini (Google)
- Models: `gemini-2.0-flash-exp`, `gemini-1.5-pro`, `gemini-1.5-flash`
- Get API key: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- ✅ Fully supports browser-based requests

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide React Icons
- Anthropic SDK
- OpenAI SDK (supports both OpenAI and Azure OpenAI)
- Google Generative AI SDK

## Development

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build

## Deployment

### Deploy to Vercel (Recommended)

This app is optimized for Vercel deployment and includes a serverless proxy for Claude API:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy - the proxy will be automatically available at `/api/claude-proxy`

The proxy solves CORS issues with Claude's API by making requests server-side.

### Other Platforms

If deploying to other platforms, you may need to set up a similar backend proxy for Claude API support, or use OpenAI/Gemini which support direct browser requests.

## Using Azure OpenAI

Azure OpenAI requires three pieces of information:

1. **API Key**: Found in Azure Portal under your OpenAI resource → Keys and Endpoint
2. **Endpoint URL**: Your resource endpoint (e.g., `https://your-resource.openai.azure.com`)
3. **Deployment Name**: The name you gave your model deployment in Azure OpenAI Studio

### Setting up Azure OpenAI Deployments

1. Go to [Azure OpenAI Studio](https://oai.azure.com/)
2. Navigate to **Deployments**
3. Create a deployment with one of these models:
   - `gpt-4o` or `gpt-4o-mini` for standard/advanced modes
   - `o1-mini` or `o3-mini` for reasoning modes
4. Note the deployment name (you'll need this in the app)

### Reasoning Models (o1, o3)

Azure OpenAI's reasoning models are optimized for complex reasoning tasks:
- **o1-mini**: Faster reasoning model, good for most tasks
- **o3-mini**: Advanced reasoning with deeper analysis

These models work differently than standard models:
- They use more "thinking time" before responding
- No temperature control (they self-regulate)
- System messages are merged into user messages
- Ideal for complex semantic modeling analysis

## Troubleshooting

### JSON Parsing Errors

If you encounter a JSON parsing error like:
```
Error analyzing TML file: Failed to parse AI response: Expected ',' or ']' after array element
```

**Quick Fixes:**
1. **Switch to Advanced Mode**: Use "Advanced" instead of "Standard" for better JSON generation
2. **Try Different Provider**: OpenAI generally handles large outputs most reliably
3. **Check TML Size**: Files with 200+ columns may need to be split into smaller sections
4. **See Detailed Guide**: Check [TROUBLESHOOTING_JSON_ERRORS.md](./TROUBLESHOOTING_JSON_ERRORS.md) for comprehensive solutions

**What We've Done:**
- ✅ Enhanced JSON parser with automatic repair capabilities
- ✅ Increased token limits by 25-33% across all providers
- ✅ Added 5 fallback strategies for handling malformed JSON
- ✅ Improved error messages with actionable suggestions
- ✅ Enhanced description quality - no more generic placeholders
- ✅ LLM now generates meaningful, contextual descriptions for ALL columns
- ✅ Optimized output to reduce token usage by ~1,500-2,500 tokens
- ✅ Removed non-essential sections to focus on core column optimization
- ✅ Simplified priority sections to compact tables (saves 15,000-24,000+ tokens)
- ✅ Focused display on comprehensive comparison table with full details

See [JSON_PARSING_FIX.md](./JSON_PARSING_FIX.md), [DESCRIPTION_QUALITY_FIX.md](./DESCRIPTION_QUALITY_FIX.md), [TOKEN_OPTIMIZATION.md](./TOKEN_OPTIMIZATION.md), and [OUTPUT_SIMPLIFICATION.md](./OUTPUT_SIMPLIFICATION.md) for technical details.

### Claude CORS Error

If you see this error:
```
CORS requests are not allowed for this Organization because of custom retention settings
```

**Solutions:**
1. **Recommended**: Use OpenAI or Gemini instead - they fully support browser requests
2. Deploy the app on Vercel (proxy is automatically enabled)
3. Set up a backend proxy server manually

The app will automatically attempt to use the proxy when available, falling back to direct API calls if needed.
