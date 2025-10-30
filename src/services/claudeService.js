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
    // Try multiple proxy URLs in order of preference
    // This ensures it works in both local dev and production
    const proxyUrls = [];
    
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = window.location.port;
      const protocol = window.location.protocol;
      
      // Add relative URL first (works in production/Vercel)
      proxyUrls.push('/api/claude-proxy');
      
      // Add absolute URL based on current host (works in local dev with same origin)
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Try common dev server ports - prioritize 3001 (local proxy server)
        const ports = ['3001', port || '3000', '5173', '8080'];
        ports.forEach(p => {
          proxyUrls.push(`${protocol}//${hostname}:${p}/api/claude-proxy`);
        });
      } else {
        // For production, also try absolute URL
        proxyUrls.push(`${protocol}//${hostname}${port ? ':' + port : ''}/api/claude-proxy`);
      }
    } else {
      // Fallback if window is not available
      proxyUrls.push('/api/claude-proxy');
    }

    let lastError = null;
    
    // Try each proxy URL
    for (const proxyUrl of proxyUrls) {
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
          
          // If it's a 404, try next URL
          if (response.status === 404) {
            lastError = new Error(`Proxy endpoint not found at ${proxyUrl}`);
            continue; // Try next URL
          }
          
          // For other errors, throw immediately
          throw new Error(`Proxy request failed: ${errorMessage}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.content) {
          throw new Error('Invalid response from proxy: missing content');
        }

        // Success! Return the response text
        return data.content[0].text;
        
      } catch (error) {
        // If it's a network error (proxy unavailable), try next URL
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          lastError = new Error(`Failed to connect to proxy server at ${proxyUrl}`);
          continue; // Try next URL
        }
        
        // For other errors, throw immediately (don't retry)
        throw error;
      }
    }
    
    // If we've tried all URLs and none worked, throw the last error with helpful message
    throw new Error(
      `Claude proxy is unavailable. Tried ${proxyUrls.length} proxy URL(s) but none are accessible.\n\n` +
      `This typically means:\n` +
      `- You're running locally and the dev server doesn't support API routes\n` +
      `- The proxy endpoint isn't deployed\n\n` +
      `Quick solutions:\n` +
      `1. Use OpenAI or Gemini provider instead (they work everywhere)\n` +
      `2. Deploy this app to Vercel (proxy will work automatically)\n` +
      `3. Run with a dev server that supports API routes (like Vite with a plugin)\n\n` +
      `Last attempted URL: ${proxyUrls[proxyUrls.length - 1]}`
    );
  }
}

