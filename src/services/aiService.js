/**
 * Base AI Service Interface
 * All provider-specific services should extend this class
 */
export class AIService {
  constructor(apiKey, model = null) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Analyze TML content using the AI provider
   * @param {string} tmlContent - The TML file content to analyze
   * @returns {Promise<Object>} - Analysis results in standardized format
   */
  async analyzeTML(tmlContent) {
    throw new Error('analyzeTML must be implemented by provider-specific service');
  }

  /**
   * Parse and extract JSON from AI response
   * @param {string} responseText - Raw response text from AI
   * @returns {Object} - Parsed JSON object
   */
  parseResponse(responseText) {
    try {
      // Try to extract JSON from response (handles markdown code blocks, etc.)
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

