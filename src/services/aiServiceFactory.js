import { ClaudeService } from './claudeService';
import { OpenAIService } from './openaiService';
import { AzureOpenAIService } from './azureOpenAIService';
import { GeminiService } from './geminiService';
import { AI_PROVIDERS } from '../config/apiConfig';

/**
 * Factory class to create appropriate AI service based on provider
 */
export class AIServiceFactory {
  /**
   * Create an AI service instance based on provider
   * @param {string} provider - The AI provider ('claude', 'openai', 'azure-openai', or 'gemini')
   * @param {string} apiKey - The API key for the provider
   * @param {string} mode - Model mode ('standard', 'advanced', 'reasoning', or 'advancedReasoning')
   * @param {Object} options - Additional options (azureEndpoint, deploymentName for Azure OpenAI)
   * @returns {AIService} - Instance of the appropriate service
   */
  static createService(provider, apiKey, mode = 'standard', options = {}) {
    if (!provider) {
      throw new Error('Provider is required');
    }

    if (!apiKey) {
      throw new Error('API key is required');
    }

    const normalizedProvider = provider.toLowerCase();

    switch (normalizedProvider) {
      case AI_PROVIDERS.CLAUDE:
        return new ClaudeService(apiKey, mode);
      
      case AI_PROVIDERS.OPENAI:
        return new OpenAIService(apiKey, mode);
      
      case AI_PROVIDERS.AZURE_OPENAI:
        return new AzureOpenAIService(
          apiKey, 
          mode, 
          options.azureEndpoint, 
          options.deploymentName
        );
      
      case AI_PROVIDERS.GEMINI:
        return new GeminiService(apiKey, mode);
      
      default:
        throw new Error(`Unsupported AI provider: ${provider}. Supported providers are: ${Object.values(AI_PROVIDERS).join(', ')}`);
    }
  }

  /**
   * Get list of supported providers
   * @returns {Array<string>} - Array of provider names
   */
  static getSupportedProviders() {
    return Object.values(AI_PROVIDERS);
  }

  /**
   * Check if a provider is supported
   * @param {string} provider - Provider name to check
   * @returns {boolean}
   */
  static isProviderSupported(provider) {
    return Object.values(AI_PROVIDERS).includes(provider.toLowerCase());
  }
}

