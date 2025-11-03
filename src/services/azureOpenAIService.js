import OpenAI from 'openai';
import { AIService } from './aiService';
import { SYSTEM_PROMPT, AI_PROVIDERS, getModelConfig, isReasoningMode } from '../config/apiConfig';

export class AzureOpenAIService extends AIService {
  constructor(apiKey, mode = 'standard', azureEndpoint = null, deploymentName = null) {
    super(apiKey, mode);
    
    if (!azureEndpoint) {
      throw new Error('Azure OpenAI endpoint is required (e.g., https://your-resource.openai.azure.com)');
    }
    
    if (!deploymentName) {
      throw new Error('Azure OpenAI deployment name is required');
    }
    
    this.azureEndpoint = azureEndpoint;
    this.deploymentName = deploymentName;
    this.isReasoning = isReasoningMode(mode);
    
    // Get model configuration for the selected mode
    this.config = getModelConfig(AI_PROVIDERS.AZURE_OPENAI, mode);
    
    // Initialize Azure OpenAI client using OpenAI SDK
    // For Azure, we configure it with Azure-specific parameters
    // Increased timeout for large TML files and comprehensive analysis
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: `${azureEndpoint}/openai/deployments/${deploymentName}`,
      defaultQuery: { 'api-version': this.config.apiVersion },
      defaultHeaders: { 'api-key': apiKey },
      timeout: 300000, // 5 minutes timeout for large files and reasoning models
      maxRetries: 2, // Retry on network errors
      dangerouslyAllowBrowser: true // Only for client-side usage
    });
  }

  async callProviderAPI(tmlContent) {
    try {
      // Reasoning models (o1, o3) require different parameters
      if (this.isReasoning) {
        return await this.callReasoningModel(tmlContent);
      } else {
        return await this.callStandardModel(tmlContent);
      }
    } catch (error) {
      console.error('Error with Azure OpenAI API:', error);
      throw new Error(`Azure OpenAI API call failed: ${error.message}`);
    }
  }

  async callStandardModel(tmlContent) {
    console.log(`[Azure OpenAI] Starting analysis with ${this.deploymentName}`);
    console.log(`[Azure OpenAI] Max output tokens: ${this.config.maxTokens}`);
    
    const completion = await this.client.chat.completions.create({
      // Azure OpenAI uses deployment in the URL, but we still need to pass model
      model: this.deploymentName,
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
          content: `Now analyze this TML file:\n\n${tmlContent}\n\nReturn ONLY valid JSON, no other text.`
        }
      ],
      stream: false // Disable streaming for better timeout handling
    });

    console.log(`[Azure OpenAI] Analysis complete. Tokens used: ${completion.usage?.total_tokens || 'N/A'}`);
    return completion.choices[0].message.content;
  }

  async callReasoningModel(tmlContent) {
    // Reasoning models (o1, o3, o1-mini, o3-mini) have special requirements:
    // - NO system messages (merge into user message instead)
    // - NO temperature parameter
    // - NO top_p parameter
    // - NO presence_penalty parameter
    // - NO frequency_penalty parameter
    // - Use max_completion_tokens instead of max_tokens
    
    console.log(`[Azure OpenAI Reasoning] Starting deep analysis with ${this.deploymentName}`);
    console.log(`[Azure OpenAI Reasoning] Max completion tokens: ${this.config.maxCompletionTokens}`);
    console.log(`[Azure OpenAI Reasoning] Note: Reasoning models take longer due to extended "thinking" time`);
    
    const completion = await this.client.chat.completions.create({
      model: this.deploymentName,
      max_completion_tokens: this.config.maxCompletionTokens,
      messages: [
        {
          role: 'user',
          content: `${SYSTEM_PROMPT}\n\n---\n\nNow analyze this TML file:\n\n${tmlContent}\n\nReturn ONLY valid JSON, no other text.`
        }
      ],
      stream: false // Disable streaming for better timeout handling
    });

    console.log(`[Azure OpenAI Reasoning] Analysis complete. Tokens used: ${completion.usage?.total_tokens || 'N/A'}`);
    console.log(`[Azure OpenAI Reasoning] Reasoning tokens: ${completion.usage?.completion_tokens_details?.reasoning_tokens || 'N/A'}`);
    return completion.choices[0].message.content;
  }
}
