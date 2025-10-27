import { parseJSONSafely } from '../config/apiConfig';

/**
 * Base AI Service Interface
 * All provider-specific services should extend this class
 */
export class AIService {
  constructor(apiKey, mode = 'standard', maxRetries = 2) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.mode = mode;
    this.maxRetries = maxRetries;
  }

  /**
   * Analyze TML content using the AI provider with retry logic
   * @param {string} tmlContent - The TML file content to analyze
   * @returns {Promise<Object>} - Analysis results in standardized format
   */
  async analyzeTML(tmlContent) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[${this.constructor.name}] Attempt ${attempt}/${this.maxRetries} with mode: ${this.mode}`);
        
        const response = await this.callProviderAPI(tmlContent);
        const json = this.parseResponse(response);
        
        if (json) {
          console.log(`[${this.constructor.name}] Successfully parsed response on attempt ${attempt}`);
          return json;
        }
        
        throw new Error('Invalid JSON output');
      } catch (error) {
        console.warn(`[${this.constructor.name}] Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Provider-specific API call - must be implemented by subclasses
   * @param {string} tmlContent - The TML file content to analyze
   * @returns {Promise<string>} - Raw response text from provider
   */
  async callProviderAPI(tmlContent) {
    throw new Error('callProviderAPI must be implemented by provider-specific service');
  }

  /**
   * Parse and extract JSON from AI response
   * @param {string} responseText - Raw response text from AI
   * @returns {Object} - Parsed JSON object
   */
  parseResponse(responseText) {
    try {
      // First try the safe JSON parser
      const parsed = parseJSONSafely(responseText);
      if (parsed) return parsed;

      // Fallback to regex extraction
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  /**
   * Validate the provider name
   * @param {string} provider - Provider name to validate
   * @returns {boolean}
   */
  static isValidProvider(provider) {
    const validProviders = ['claude', 'openai', 'gemini'];
    return validProviders.includes(provider.toLowerCase());
  }
}

