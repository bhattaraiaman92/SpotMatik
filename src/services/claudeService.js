import Anthropic from '@anthropic-ai/sdk';
import { AIService } from './aiService';
import { SYSTEM_PROMPT, API_CONFIG, AI_PROVIDERS, PROVIDER_INFO } from '../config/apiConfig';

export class ClaudeService extends AIService {
  constructor(apiKey, model = null) {
    super(apiKey, model);
    this.client = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Only for client-side usage
    });
    this.model = model || PROVIDER_INFO[AI_PROVIDERS.CLAUDE].defaultModel;
    this.config = API_CONFIG[AI_PROVIDERS.CLAUDE];
  }

  async analyzeTML(tmlContent) {
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: `${SYSTEM_PROMPT}\n\n---\n\nNow analyze this TML file:\n\n${tmlContent}\n\nReturn ONLY valid JSON, no other text.`
          }
        ]
      });

      // Extract the response
      const responseText = message.content[0].text;
      
      // Use base class method to parse response
      return this.parseResponse(responseText);

    } catch (error) {
      console.error('Error analyzing TML with Claude:', error);
      throw new Error(`Claude analysis failed: ${error.message}`);
    }
  }
}

