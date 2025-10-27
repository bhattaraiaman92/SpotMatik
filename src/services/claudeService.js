import Anthropic from '@anthropic-ai/sdk';
import { AIService } from './aiService';
import { SYSTEM_PROMPT, AI_PROVIDERS, getModelConfig } from '../config/apiConfig';

export class ClaudeService extends AIService {
  constructor(apiKey, mode = 'standard', useProxy = true) {
    super(apiKey, mode);
    this.useProxy = useProxy;
    
    // Get model configuration for the selected mode
    this.config = getModelConfig(AI_PROVIDERS.CLAUDE, mode);
    
    // Only initialize direct client if not using proxy
    if (!useProxy) {
      this.client = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Only for client-side usage
      });
    }
  }

  async callProviderAPI(tmlContent) {
    // Try proxy first if enabled
    if (this.useProxy) {
      try {
        return await this.callWithProxy(tmlContent);
      } catch (proxyError) {
        console.warn('Proxy failed, falling back to direct API:', proxyError);
        // Initialize client for fallback if not already done
        if (!this.client) {
          this.client = new Anthropic({
            apiKey: this.apiKey,
            dangerouslyAllowBrowser: true
          });
        }
      }
    }

    // Direct API call
    try {
      const message = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: `${SYSTEM_PROMPT}\n\n---\n\nNow analyze this TML file:\n\n${tmlContent}\n\nReturn ONLY valid JSON, no other text.`
          }
        ]
      });

      // Return the response text
      return message.content[0].text;

    } catch (error) {
      console.error('Error with Claude direct API:', error);
      
      // Handle CORS-specific error
      if (error.status === 401 && error.message && error.message.includes('CORS')) {
        throw new Error(
          `Claude API does not support direct browser requests due to CORS restrictions. ` +
          `This is a limitation when your organization has custom retention settings. ` +
          `\n\nPlease try one of these solutions:\n` +
          `1. Use OpenAI or Gemini provider instead (they support browser requests)\n` +
          `2. Contact your administrator about CORS settings\n` +
          `3. Deploy this app with a backend proxy server`
        );
      }
      
      throw new Error(`Claude API call failed: ${error.message}`);
    }
  }

  async callWithProxy(tmlContent) {
    // Determine proxy URL based on environment
    const proxyUrl = import.meta.env.PROD 
      ? '/api/claude-proxy'
      : 'http://localhost:3000/api/claude-proxy';

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: this.apiKey,
        model: this.config.model,
        tmlContent: tmlContent,
        systemPrompt: SYSTEM_PROMPT
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Proxy request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.content) {
      throw new Error('Invalid response from proxy');
    }

    // Return the response text
    return data.content[0].text;
  }
}

