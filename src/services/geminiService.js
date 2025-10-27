import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService } from './aiService';
import { SYSTEM_PROMPT, AI_PROVIDERS, getModelConfig } from '../config/apiConfig';

export class GeminiService extends AIService {
  constructor(apiKey, mode = 'standard') {
    super(apiKey, mode);
    
    // Get model configuration for the selected mode
    this.config = getModelConfig(AI_PROVIDERS.GEMINI, mode);
    
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async callProviderAPI(tmlContent) {
    try {
      const generativeModel = this.client.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: this.config.maxTokens,
          temperature: this.config.temperature,
          topP: this.config.topP,
          responseMimeType: this.config.responseMimeType
        }
      });

      const prompt = `${SYSTEM_PROMPT}\n\n---\n\nNow analyze this TML file:\n\n${tmlContent}\n\nReturn ONLY valid JSON, no other text.`;
      
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      
      // Return the response text
      return response.text();

    } catch (error) {
      console.error('Error with Gemini API:', error);
      throw new Error(`Gemini API call failed: ${error.message}`);
    }
  }
}

