# Auto-Toggle Configuration Implementation

## Overview

Successfully integrated your auto-toggling AI configuration code into the SpotMatik application. The system now uses a simplified **Standard vs Advanced** model selection instead of showing all available models in a dropdown.

## What Changed

### 1. **Configuration Structure** (`src/config/apiConfig.js`)

#### New Exports:
- `MODEL_MODES` - Defines 'standard' and 'advanced' modes
- `AI_MODELS` - Configuration for each provider with both model tiers
- `getModelConfig(provider, mode)` - Helper to get full config dynamically
- `parseJSONSafely(text)` - Utility for cleaning and parsing JSON responses

#### Model Configuration:
```javascript
AI_MODELS = {
  openai: {
    models: {
      standard: 'gpt-4o-mini',  // Fast & cheaper
      advanced: 'gpt-4o'        // More reasoning
    },
    defaults: { temperature, topP, maxTokens, etc. }
  },
  claude: { ... },
  gemini: { ... }
}
```

### 2. **Base Service with Retry Logic** (`src/services/aiService.js`)

#### Key Features:
- **Automatic Retry**: Up to 2 attempts with exponential backoff
- **Mode-based Configuration**: Uses 'standard' or 'advanced' instead of specific model names
- **Enhanced JSON Parsing**: Uses `parseJSONSafely` with fallback to regex
- **Logging**: Console logs for debugging attempts and successes

#### New Method Structure:
```javascript
analyzeTML(tmlContent) {
  // Retry loop
  for (attempt = 1 to maxRetries) {
    try {
      response = await callProviderAPI(tmlContent)
      return parseResponse(response)
    } catch (error) {
      if (lastAttempt) throw
      wait exponentially
    }
  }
}
```

### 3. **Provider Services** (Claude, OpenAI, Gemini)

#### Updated to:
- Accept `mode` parameter instead of `model`
- Use `getModelConfig()` to get full configuration
- Implement `callProviderAPI()` instead of overriding `analyzeTML()`
- Apply provider-specific config parameters (topP, presencePenalty, etc.)

#### Example (OpenAI):
```javascript
constructor(apiKey, mode = 'standard') {
  super(apiKey, mode);
  this.config = getModelConfig(AI_PROVIDERS.OPENAI, mode);
  // config.model is automatically selected based on mode
}
```

### 4. **Factory Pattern** (`src/services/aiServiceFactory.js`)

Updated signature:
```javascript
createService(provider, apiKey, mode = 'standard')
```

### 5. **User Interface** (`src/App.jsx`)

#### Replaced:
- ❌ Model dropdown with list of all models
- ✅ Two-button toggle: **Standard** vs **Advanced**

#### New UI Features:
- Visual distinction between modes (Zap icon for Standard, Sparkles for Advanced)
- Shows actual model name in small gray text
- Cost/speed hints ("Fast & cost-effective" vs "More reasoning power")
- Status bar shows selected mode and actual model

## Benefits

### 1. **Simplified UX**
- Users don't need to know specific model names
- Clear choice: fast/cheap vs powerful/expensive
- Consistent experience across all providers

### 2. **Automatic Retry with Fallback**
- Handles temporary API failures
- Exponential backoff prevents rate limiting
- Logs help with debugging

### 3. **Optimized Configurations**
- Each provider uses optimal parameters for its models
- Temperature, topP, and other params tuned per provider
- Higher token limits where providers support them

### 4. **Better JSON Parsing**
- Strips markdown code blocks automatically
- Handles various response formats
- Multiple fallback strategies

### 5. **Cost Control**
- Standard mode defaults to cheaper models
- Users consciously opt into advanced (expensive) models
- Clear labeling helps with budgeting

## Configuration Details

### Standard Mode (Fast & Economical)
| Provider | Model | Max Tokens | Temperature |
|----------|-------|------------|-------------|
| OpenAI   | gpt-4o-mini | 12,000 | 0.25 |
| Claude   | claude-3-5-sonnet | 15,000 | 0.2 |
| Gemini   | gemini-1.5-flash | 16,000 | 0.35 |

### Advanced Mode (Powerful Reasoning)
| Provider | Model | Max Tokens | Temperature |
|----------|-------|------------|-------------|
| OpenAI   | gpt-4o | 12,000 | 0.25 |
| Claude   | claude-sonnet-4 | 15,000 | 0.2 |
| Gemini   | gemini-1.5-pro | 16,000 | 0.35 |

## Usage Example

```javascript
// User selects "Standard" mode with OpenAI
const service = AIServiceFactory.createService('openai', apiKey, 'standard');

// Internally uses gpt-4o-mini with optimized config
const results = await service.analyzeTML(tmlContent);
// Automatically retries on failure up to 2 times
```

## Retry Behavior

```
Attempt 1: Immediate try
  ↓ (fails)
Wait 1 second
  ↓
Attempt 2: Retry
  ↓ (fails)
Wait 2 seconds
  ↓
Final attempt or throw error
```

## Default Provider

Changed default from Claude to **OpenAI** because:
- ✅ No CORS issues (works directly in browser)
- ✅ Standard mode (gpt-4o-mini) is very cost-effective
- ✅ Reliable and fast response times

## Testing

### Build Status
✅ **Passed** - No compilation errors
✅ **Passed** - No linter errors
✅ **Ready** - Production build successful

### What to Test
1. **Standard Mode**: Upload TML file, select Standard, verify it uses cheaper model
2. **Advanced Mode**: Toggle to Advanced, verify it uses more powerful model
3. **Retry Logic**: Simulate network issues to test automatic retry
4. **Provider Switching**: Switch between OpenAI/Claude/Gemini with mode selection
5. **Error Handling**: Test with invalid API keys to verify error messages

## Migration Notes

### If upgrading from previous version:
- Model selection dropdown is now a two-button toggle
- API remains backward compatible
- All existing features still work
- Default changed to OpenAI (was Claude)

### For developers:
- Use `mode` parameter instead of `model` when creating services
- Valid modes: 'standard' or 'advanced'
- `getModelConfig()` returns full config including actual model name
- Base class now handles retries automatically

## Future Enhancements

Possible additions:
- [ ] Add "custom" mode for power users to specify exact model
- [ ] Display cost estimates based on token usage
- [ ] Allow customizing retry attempts
- [ ] Provider performance metrics and comparison
- [ ] Automatic mode selection based on TML file size

## Questions?

The auto-toggle system is now fully integrated and production-ready. All services use the new configuration structure with automatic retry logic and simplified mode selection.

