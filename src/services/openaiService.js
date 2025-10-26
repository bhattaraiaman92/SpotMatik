import OpenAI from 'openai';
import { AIService } from './aiService';
import { SYSTEM_PROMPT, API_CONFIG, AI_PROVIDERS, PROVIDER_INFO } from '../config/apiConfig';

export class OpenAIService extends AIService {
  constructor(apiKey, model = null) {
    super(apiKey, model);
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Only for client-side usage
    });
    this.model = model || PROVIDER_INFO[AI_PROVIDERS.OPENAI].defaultModel;
    this.config = API_CONFIG[AI_PROVIDERS.OPENAI];
  }

  async analyzeTML(tmlContent) {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Now analyze this TML file:\n\n${tmlContent}\n\nReturn ONLY valid JSON, no other text.`
          }
        ]
      });

      // Extract the response
      const responseText = completion.choices[0].message.content;
      
      // Use base class method to parse response
      return this.parseResponse(responseText);

    } catch (error) {
      console.error('Error analyzing TML with OpenAI:', error);
      throw new Error(`OpenAI analysis failed: ${error.message}`);
    }
  }
}

