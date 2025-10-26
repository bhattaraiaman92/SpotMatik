import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService } from './aiService';
import { SYSTEM_PROMPT, API_CONFIG, AI_PROVIDERS, PROVIDER_INFO } from '../config/apiConfig';

export class GeminiService extends AIService {
  constructor(apiKey, model = null) {
    super(apiKey, model);
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model || PROVIDER_INFO[AI_PROVIDERS.GEMINI].defaultModel;
    this.config = API_CONFIG[AI_PROVIDERS.GEMINI];
  }

  async analyzeTML(tmlContent) {
    try {
      const generativeModel = this.client.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          maxOutputTokens: this.config.maxTokens,
          temperature: this.config.temperature
        }
      });

      const prompt = `${SYSTEM_PROMPT}\n\n---\n\nNow analyze this TML file:\n\n${tmlContent}\n\nReturn ONLY valid JSON, no other text.`;
      
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Use base class method to parse response
      return this.parseResponse(responseText);

    } catch (error) {
      console.error('Error analyzing TML with Gemini:', error);
      throw new Error(`Gemini analysis failed: ${error.message}`);
    }
  }
}

