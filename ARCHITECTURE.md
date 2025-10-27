# Multi-Provider AI Architecture

## Overview

The Spotter TML Optimizer now supports multiple AI providers, allowing users to choose between Claude (Anthropic), ChatGPT (OpenAI), or Gemini (Google) based on their available API keys.

## Architecture Pattern

We use the **Factory Pattern** with a base service interface to create a provider-agnostic architecture.

## File Structure

```
src/
├── config/
│   └── apiConfig.js          # Provider configurations and prompts
├── services/
│   ├── aiService.js          # Base service interface (abstract class)
│   ├── claudeService.js      # Claude/Anthropic implementation (with proxy support)
│   ├── openaiService.js      # OpenAI/ChatGPT implementation
│   ├── geminiService.js      # Google Gemini implementation
│   └── aiServiceFactory.js   # Factory to create service instances
└── App.jsx                   # Main UI with provider selection

api/
└── claude-proxy.js           # Vercel serverless function for Claude API proxy
```

## Key Components

### 1. Base Service Interface (`aiService.js`)
- Abstract base class that all provider services extend
- Defines the `analyzeTML()` contract
- Provides common `parseResponse()` method for JSON extraction
- Ensures consistent interface across all providers

### 2. Provider Services
Each provider service extends `AIService` and implements:
- Provider-specific client initialization
- Model selection
- API calls with proper formatting
- Error handling

**Claude Service** (`claudeService.js`)
- Uses `@anthropic-ai/sdk`
- Supports Claude Sonnet and Opus models
- Implements Anthropic's message API
- **Proxy Support**: Automatically uses backend proxy to avoid CORS issues
  - When deployed, requests go through `/api/claude-proxy` (serverless function)
  - Falls back to direct API calls if proxy unavailable
  - Solves CORS restrictions for organizations with custom retention settings

**OpenAI Service** (`openaiService.js`)
- Uses `openai` package
- Supports GPT-4o, GPT-4, and GPT-3.5 models
- Implements OpenAI's chat completions API

**Gemini Service** (`geminiService.js`)
- Uses `@google/generative-ai`
- Supports Gemini 2.0 and 1.5 models
- Implements Google's generative content API

### 3. Service Factory (`aiServiceFactory.js`)
- Creates appropriate service instance based on provider selection
- Validates provider and API key
- Centralizes service instantiation logic

### 4. Configuration (`apiConfig.js`)
- `AI_PROVIDERS`: Enum of supported providers
- `PROVIDER_INFO`: Metadata for each provider (models, API console URLs, etc.)
- `SYSTEM_PROMPT`: Universal prompt for all providers
- `API_CONFIG`: Provider-specific configuration (tokens, temperature)

## How It Works

### User Flow
1. User selects AI provider (Claude/OpenAI/Gemini)
2. User selects model from available options
3. User enters API key for selected provider
4. User uploads TML file
5. Factory creates appropriate service instance
6. Service analyzes TML and returns standardized results

### Code Flow
```javascript
// In App.jsx
const aiService = AIServiceFactory.createService(
  selectedProvider,  // 'claude', 'openai', or 'gemini'
  apiKey,           // User's API key
  selectedModel     // Specific model
);

const results = await aiService.analyzeTML(tmlContent);
```

## Benefits

### 1. **Flexibility**
- Users can use any provider they have access to
- Easy to switch between providers
- No vendor lock-in

### 2. **Extensibility**
- Add new providers by creating new service class
- Update provider configurations without changing core logic
- Easy to add new models as they're released

### 3. **Maintainability**
- Separation of concerns
- Single responsibility for each service
- Consistent interface across all implementations

### 4. **User Experience**
- Automatic model suggestions per provider
- Dynamic API console links
- Provider-specific placeholder text

## Adding a New Provider

To add a new AI provider:

1. **Update Configuration** (`apiConfig.js`)
```javascript
export const AI_PROVIDERS = {
  // ... existing
  NEW_PROVIDER: 'newprovider'
};

export const PROVIDER_INFO = {
  // ... existing
  [AI_PROVIDERS.NEW_PROVIDER]: {
    name: 'Provider Name',
    models: ['model-1', 'model-2'],
    defaultModel: 'model-1',
    apiKeyPrefix: 'key-',
    consoleUrl: 'https://...',
    description: 'Provider description'
  }
};

export const API_CONFIG = {
  // ... existing
  [AI_PROVIDERS.NEW_PROVIDER]: {
    maxTokens: 8192,
    temperature: 0.3
  }
};
```

2. **Create Service Class** (`newProviderService.js`)
```javascript
import { AIService } from './aiService';
import { SYSTEM_PROMPT, API_CONFIG, AI_PROVIDERS, PROVIDER_INFO } from '../config/apiConfig';

export class NewProviderService extends AIService {
  constructor(apiKey, model = null) {
    super(apiKey, model);
    // Initialize provider-specific client
    this.client = new ProviderSDK({ apiKey });
    this.model = model || PROVIDER_INFO[AI_PROVIDERS.NEW_PROVIDER].defaultModel;
    this.config = API_CONFIG[AI_PROVIDERS.NEW_PROVIDER];
  }

  async analyzeTML(tmlContent) {
    try {
      // Call provider API
      const response = await this.client.analyze({
        model: this.model,
        prompt: `${SYSTEM_PROMPT}\n\n${tmlContent}`
      });
      
      // Use base class to parse response
      return this.parseResponse(response.text);
    } catch (error) {
      throw new Error(`Provider analysis failed: ${error.message}`);
    }
  }
}
```

3. **Update Factory** (`aiServiceFactory.js`)
```javascript
import { NewProviderService } from './newProviderService';

// Add to switch statement
case AI_PROVIDERS.NEW_PROVIDER:
  return new NewProviderService(apiKey, model);
```

4. **Install SDK**
```bash
npm install provider-sdk
```

That's it! The UI will automatically show the new provider option.

## Claude CORS Issue & Proxy Solution

### The Problem
Claude's API does not support direct browser (CORS) requests when organizations have custom retention settings enabled. This results in a 401 authentication error with the message:
```
CORS requests are not allowed for this Organization because of custom retention settings
```

### The Solution
We've implemented a **serverless proxy function** that runs on the backend:

1. **Proxy Function** (`api/claude-proxy.js`)
   - Vercel serverless function that accepts API requests from the frontend
   - Makes server-side requests to Claude API (no CORS restrictions)
   - Returns results to the frontend
   - User's API key is sent with each request (not stored server-side)

2. **Automatic Proxy Detection** (`claudeService.js`)
   - Checks if proxy endpoint is available
   - Automatically uses proxy when deployed
   - Falls back to direct API calls in development or if proxy fails

3. **Fallback Options**
   - Users can switch to OpenAI or Gemini (both support browser requests)
   - Error messages guide users to alternative solutions

### Proxy Security
- API keys are **never stored** server-side
- Keys are passed through the proxy to Claude's API
- Each request includes the user's key
- Proxy is stateless and doesn't log sensitive data

## Security Notes

- API keys are stored only in browser session state (not persisted)
- Keys are only sent to the selected AI provider (or proxy)
- No server-side storage or logging of API keys
- Proxy passes keys directly to Claude API without storing
- `dangerouslyAllowBrowser` flag used for fallback client-side SDK usage

## Future Enhancements

- [ ] Add API key encryption for localStorage persistence
- [ ] Support for custom model parameters
- [ ] Token usage tracking and cost estimation
- [ ] Batch processing for multiple TML files
- [ ] Provider performance comparison
- [ ] Fallback provider if primary fails

