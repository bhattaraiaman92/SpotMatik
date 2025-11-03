import OpenAI from 'openai';
import { AIService } from './aiService';
import { SYSTEM_PROMPT, AI_PROVIDERS, getModelConfig, MODEL_MODES } from '../config/apiConfig';

export class OpenAIService extends AIService {
  constructor(apiKey, mode = 'standard', azureConfig = null) {
    super(apiKey, mode);
    
    // Get model configuration for the selected mode
    this.config = getModelConfig(AI_PROVIDERS.OPENAI, mode);
    
    // Configure client - support both OpenAI and Azure OpenAI
    const clientConfig = {
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Only for client-side usage
    };
    
    // Store Azure configuration
    this.azureConfig = azureConfig;
    
    // If Azure config is provided, use it for Azure OpenAI
    if (azureConfig && azureConfig.endpoint) {
      // Ensure endpoint ends with /openai/v1/
      const baseURL = azureConfig.endpoint.endsWith('/openai/v1/') 
        ? azureConfig.endpoint 
        : azureConfig.endpoint.endsWith('/') 
          ? `${azureConfig.endpoint}openai/v1/`
          : `${azureConfig.endpoint}/openai/v1/`;
      
      clientConfig.baseURL = baseURL;
      
      // Override model with deployment name if provided
      const deployments = azureConfig.deployments || {};
      const deploymentName = deployments[mode];
      
      if (deploymentName) {
        this.config.model = deploymentName;
      }
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

