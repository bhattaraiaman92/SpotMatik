import OpenAI from 'openai';
import { AIService } from './aiService';
import { SYSTEM_PROMPT, AI_PROVIDERS, getModelConfig } from '../config/apiConfig';

export class OpenAIService extends AIService {
  constructor(apiKey, mode = 'standard', azureEndpoint = null) {
    super(apiKey, mode);
    
    // Get model configuration for the selected mode
    this.config = getModelConfig(AI_PROVIDERS.OPENAI, mode);
    
    // Configure client - support both OpenAI and Azure OpenAI
    const clientConfig = {
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Only for client-side usage
    };
    
    // If Azure endpoint is provided, use it for Azure OpenAI
    if (azureEndpoint) {
      // Ensure endpoint ends with /openai/v1/
      const baseURL = azureEndpoint.endsWith('/openai/v1/') 
        ? azureEndpoint 
        : azureEndpoint.endsWith('/') 
          ? `${azureEndpoint}openai/v1/`
          : `${azureEndpoint}/openai/v1/`;
      
      clientConfig.baseURL = baseURL;
    }
    
    this.client = new OpenAI(clientConfig);
  }

  async callProviderAPI(tmlContent, businessQuestions = null) {
    try {
      const businessQuestionsSection = businessQuestions 
        ? `\n\n---\n\nBusiness Questions File:\n\n${businessQuestions}\n\n---\n\n`
        : '';
      
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: this.config.topP,
        presence_penalty: this.config.presencePenalty,
        frequency_penalty: this.config.frequencyPenalty,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Now analyze this TML file:\n\n${tmlContent}${businessQuestionsSection}Return ONLY valid JSON, no other text.`
          }
        ]
      });

      // Return the response text
      return completion.choices[0].message.content;

    } catch (error) {
      console.error('Error with OpenAI API:', error);
      throw new Error(`OpenAI API call failed: ${error.message}`);
    }
  }
}

