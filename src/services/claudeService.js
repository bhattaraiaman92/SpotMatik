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
        console.warn('Proxy failed:', proxyError);
        
        // Check if it's a network/CORS error (proxy unavailable)
        const isNetworkError = proxyError.message && (
          proxyError.message.includes('Failed to fetch') ||
          proxyError.message.includes('NetworkError') ||
          proxyError.message.includes('CORS') ||
          proxyError.message.includes('404') ||
          proxyError.message.includes('Proxy request failed')
        );
        
        // If proxy is unavailable (network error, 404, etc.), don't fall back to direct API
        // Direct API will also fail with CORS for organizations with custom retention
        if (isNetworkError) {
          throw new Error(
            `Claude proxy is unavailable. This can happen in local development or when the proxy endpoint doesn't exist.\n\n` +
            `Please try one of these solutions:\n` +
            `1. Use OpenAI or Gemini provider instead (they support browser requests)\n` +
            `2. Deploy this app to Vercel to enable the proxy server\n` +
            `3. Set up a local proxy server if running locally`
          );
        }
        
        // For other proxy errors (like API errors), we can try direct API as fallback
        console.warn('Proxy failed with non-network error, attempting direct API fallback');
      }
    }

    // Direct API call (only if proxy was disabled or proxy failed with non-network error)
    if (!this.client) {
      this.client = new Anthropic({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true
      });
    }

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
      
      // Handle CORS-specific error - check multiple possible error formats
      const errorMessage = error.message || error.toString() || '';
      const errorStatus = error.status || error.statusCode || error.response?.status;
      const isCorsError = (
        errorStatus === 401 ||
        errorMessage.includes('CORS') ||
        errorMessage.includes('custom retention settings') ||
        (error.error && error.error.message && error.error.message.includes('CORS'))
      );
      
      if (isCorsError) {
        throw new Error(
          `Claude API does not support direct browser requests due to CORS restrictions. ` +
          `This is a limitation when your organization has custom retention settings. ` +
          `\n\nPlease try one of these solutions:\n` +
          `1. Use OpenAI or Gemini provider instead (they support browser requests)\n` +
          `2. Contact your administrator about CORS settings\n` +
          `3. Deploy this app with a backend proxy server`
        );
      }
      
      throw new Error(`Claude API call failed: ${error.message || error.toString()}`);
    }
  }

  async callWithProxy(tmlContent) {
    // Determine proxy URL based on environment
    // Check if we're running locally (development) or in production
    const isLocalDev = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    );
    
    const proxyUrl = isLocalDev
      ? 'http://localhost:3000/api/claude-proxy'
      : '/api/claude-proxy';

    try {
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
        const errorMessage = errorData.error || `Proxy request failed with status ${response.status}`;
        
        // Provide more specific error messages
        if (response.status === 404) {
          throw new Error(
            `Proxy endpoint not found (404). ` +
            `The proxy server may not be available. ` +
            `If running locally, make sure the dev server is running with the proxy endpoint.`
          );
        }
        
        throw new Error(`Proxy request failed: ${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.content) {
        throw new Error('Invalid response from proxy: missing content');
      }

      // Return the response text
      return data.content[0].text;
      
    } catch (error) {
      // Wrap fetch errors with more context
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(
          `Failed to connect to proxy server at ${proxyUrl}. ` +
          `This might mean:\n` +
          `- The proxy endpoint is not available\n` +
          `- If running locally, the dev server may not be running\n` +
          `- Network connectivity issues\n\n` +
          `Consider using OpenAI or Gemini provider instead, or deploy to Vercel.`
        );
      }
      
      // Re-throw other errors with context
      throw error;
    }
  }
}

