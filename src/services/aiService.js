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
   * Validate and normalize the parsed JSON response
   * Ensures all required fields are present and recommendations are complete
   * @param {Object} json - Parsed JSON object
   * @param {Object|null} tmlParsedData - Optional parsed TML data with columns and formulas arrays
   * @returns {Object} - Validated and normalized JSON object
   */
  validateAndNormalizeResponse(json, tmlParsedData = null) {
    if (!json) {
      throw new Error('Empty response from AI');
    }

    // Ensure columnRecommendations structure exists
    if (!json.columnRecommendations) {
      json.columnRecommendations = { critical: [], important: [], niceToHave: [] };
    }

    // Normalize each priority level
    ['critical', 'important', 'niceToHave'].forEach(priority => {
      if (!json.columnRecommendations[priority]) {
        json.columnRecommendations[priority] = [];
      }

      // Ensure every item has complete recommendations
      json.columnRecommendations[priority] = json.columnRecommendations[priority].map(item => {
        // Ensure recommendations object exists
        if (!item.recommendations) {
          item.recommendations = {};
        }

        // Ensure all recommendation fields are present
        const rec = item.recommendations;
        
        // name: use columnName if missing
        if (!rec.name && item.columnName) {
          rec.name = item.columnName;
        }

        // description: always provide, even if empty
        // Note: This is a FALLBACK only. The LLM should always provide meaningful descriptions.
        if (!rec.description) {
          console.warn(
            `[${this.constructor.name}] Missing description in recommendations for column: ${item.columnName}. ` +
            `The LLM should have provided this.`
          );
          
          const columnName = item.columnName || 'Unknown';
          const readableName = columnName.toLowerCase().replace(/_/g, ' ');
          
          // Generate slightly more contextual fallback
          let contextHint = '';
          if (columnName.match(/date|time|timestamp/i)) {
            contextHint = ' temporal field for time-based analysis';
          } else if (columnName.match(/id|key/i)) {
            contextHint = ' identifier for data relationships';
          } else if (columnName.match(/amount|revenue|cost|price/i)) {
            contextHint = ' financial metric for calculations';
          } else if (columnName.match(/count|quantity|number/i)) {
            contextHint = ' numeric value for aggregations';
          } else if (columnName.match(/status|state|flag/i)) {
            contextHint = ' status field for filtering';
          }
          
          rec.description = `${readableName.charAt(0).toUpperCase() + readableName.slice(1)}${contextHint ? ' -' + contextHint : ''}. Requires review for specific business context.`;
        }

        // synonyms: always provide array with at least columnName variations
        if (!rec.synonyms || !Array.isArray(rec.synonyms) || rec.synonyms.length === 0) {
          rec.synonyms = [];
          if (item.columnName) {
            // Generate basic synonyms from column name
            const nameVariations = item.columnName.toLowerCase().replace(/_/g, ' ').split(' ');
            rec.synonyms.push(item.columnName.toLowerCase().replace(/_/g, ' '));
            if (nameVariations.length > 1) {
              rec.synonyms.push(nameVariations.join(' '));
            }
          }
          // Ensure at least 3 synonyms
          while (rec.synonyms.length < 3) {
            rec.synonyms.push(`synonym ${rec.synonyms.length + 1}`);
          }
        }

        // rationale: always provide explanation
        if (!rec.rationale) {
          rec.rationale = item.issue 
            ? `Addressing this issue will improve Spotter's ability to understand and respond to queries related to ${item.columnName || 'this column'}.`
            : `This recommendation improves Spotter's natural language understanding for better query accuracy.`;
        }

        return item;
      });
    });

    // Ensure comparisonTable exists and normalize all entries
    if (!json.comparisonTable || !Array.isArray(json.comparisonTable)) {
      json.comparisonTable = [];
    }

    // Normalize each comparison table entry to ensure all fields are present
    json.comparisonTable = json.comparisonTable.map(row => {
      // Ensure all required fields exist
      const normalizedRow = {
        currentName: row.currentName || 'Unknown Column',
        recommendedName: row.recommendedName || row.currentName || 'Unknown Column',
        currentDescription: row.currentDescription || 'None',
        recommendedDescription: row.recommendedDescription || null, // Will be set later with better logic
        currentSynonyms: row.currentSynonyms === 'None' || !row.currentSynonyms 
          ? 'None' 
          : (Array.isArray(row.currentSynonyms) ? row.currentSynonyms : []),
        recommendedSynonyms: Array.isArray(row.recommendedSynonyms) && row.recommendedSynonyms.length > 0
          ? row.recommendedSynonyms
          : (row.currentName 
            ? [
                row.currentName.toLowerCase().replace(/_/g, ' '),
                ...row.currentName.toLowerCase().replace(/_/g, ' ').split(' ').filter(w => w.length > 2)
              ].slice(0, 5)
            : ['synonym 1', 'synonym 2', 'synonym 3']),
        priority: row.priority || 'No Change Needed',
        descriptionCharCount: row.descriptionCharCount || (row.recommendedDescription || '').length
      };

      // Ensure recommendedSynonyms is always an array with at least 3 items
      if (!Array.isArray(normalizedRow.recommendedSynonyms) || normalizedRow.recommendedSynonyms.length < 3) {
        const baseSynonyms = normalizedRow.recommendedSynonyms || [];
        const columnName = normalizedRow.currentName.toLowerCase().replace(/_/g, ' ');
        
        // Generate synonyms from column name
        const nameParts = columnName.split(' ').filter(w => w.length > 2);
        const synonyms = [...new Set([
          ...baseSynonyms,
          columnName,
          ...nameParts,
          ...nameParts.map((_, i) => nameParts.slice(i).join(' '))
        ])].slice(0, 5);

        // Fill up to at least 3 synonyms
        while (synonyms.length < 3) {
          synonyms.push(`${columnName} synonym ${synonyms.length + 1}`);
        }

        normalizedRow.recommendedSynonyms = synonyms.slice(0, 5);
      }

      // Ensure recommendedDescription is always provided and not empty
      // Note: This is a FALLBACK only. The LLM should always provide meaningful descriptions.
      if (!normalizedRow.recommendedDescription || normalizedRow.recommendedDescription === 'None') {
        console.warn(
          `[${this.constructor.name}] Missing recommendedDescription for column: ${normalizedRow.currentName}. ` +
          `Using fallback description. The LLM should have provided this.`
        );
        
        // Generate a more contextual fallback based on column name patterns
        const columnName = normalizedRow.currentName || 'Unknown';
        const readableName = columnName.toLowerCase().replace(/_/g, ' ');
        
        // Try to infer type/purpose from column name
        let contextHint = '';
        if (columnName.match(/date|time|timestamp|created|updated|modified/i)) {
          contextHint = ' Used for temporal analysis and time-based filtering.';
        } else if (columnName.match(/id|key|code/i)) {
          contextHint = ' Unique identifier used for joining and referencing related data.';
        } else if (columnName.match(/name|title|description/i)) {
          contextHint = ' Descriptive text field used for display and search.';
        } else if (columnName.match(/amount|revenue|cost|price|value|total|sum/i)) {
          contextHint = ' Numeric value used for calculations and aggregations in financial analysis.';
        } else if (columnName.match(/count|quantity|number|num/i)) {
          contextHint = ' Numeric count used for aggregation and metrics.';
        } else if (columnName.match(/status|state|flag|is_|has_/i)) {
          contextHint = ' Status indicator used for filtering and categorization.';
        } else if (columnName.match(/percent|rate|ratio/i)) {
          contextHint = ' Percentage or ratio metric used for comparative analysis.';
        }
        
        normalizedRow.recommendedDescription = 
          `${readableName.charAt(0).toUpperCase() + readableName.slice(1)} field in this data model.${contextHint} ` +
          `Review TML file for specific business context and usage patterns.`;
      }

      // Ensure descriptionCharCount is set
      normalizedRow.descriptionCharCount = normalizedRow.recommendedDescription.length;

      return normalizedRow;
    });

    // Warn if comparisonTable seems incomplete (has fewer entries than totalColumns)
    if (json.totalColumns && json.comparisonTable.length < json.totalColumns) {
      console.warn(
        `[${this.constructor.name}] Comparison table appears incomplete: ` +
        `${json.comparisonTable.length} entries found but ${json.totalColumns} total columns expected. ` +
        `The LLM should include ALL columns from the TML file.`
      );
    }

    // Validate against parsed TML data if available
    if (tmlParsedData && tmlParsedData.allNames && tmlParsedData.allNames.length > 0) {
      const comparisonTableNames = new Set(json.comparisonTable.map(row => row.currentName));
      const missingNames = tmlParsedData.allNames.filter(name => !comparisonTableNames.has(name));
      
      if (missingNames.length > 0) {
        console.warn(
          `[${this.constructor.name}] Missing columns/formulas in comparison table:`,
          missingNames
        );
        
        // Add missing entries to comparison table
        missingNames.forEach(name => {
          const readableName = name.toLowerCase().replace(/_/g, ' ');
          
          // Generate contextual description based on column name patterns
          let contextHint = '';
          if (name.match(/date|time|timestamp|created|updated|modified/i)) {
            contextHint = ' Used for temporal analysis and time-based filtering.';
          } else if (name.match(/id|key|code/i)) {
            contextHint = ' Unique identifier used for joining and referencing related data.';
          } else if (name.match(/name|title|description/i)) {
            contextHint = ' Descriptive text field used for display and search.';
          } else if (name.match(/amount|revenue|cost|price|value|total|sum/i)) {
            contextHint = ' Numeric value used for calculations and aggregations in financial analysis.';
          } else if (name.match(/count|quantity|number|num/i)) {
            contextHint = ' Numeric count used for aggregation and metrics.';
          } else if (name.match(/status|state|flag|is_|has_/i)) {
            contextHint = ' Status indicator used for filtering and categorization.';
          } else if (name.match(/percent|rate|ratio/i)) {
            contextHint = ' Percentage or ratio metric used for comparative analysis.';
          }
          
          const recommendedDesc = `${readableName.charAt(0).toUpperCase() + readableName.slice(1)} field in this data model.${contextHint} Review TML file for specific business context and usage patterns.`;
          
          json.comparisonTable.push({
            currentName: name,
            recommendedName: name,
            currentDescription: 'None',
            recommendedDescription: recommendedDesc,
            currentSynonyms: 'None',
            recommendedSynonyms: [
              name.toLowerCase().replace(/_/g, ' '),
              ...name.toLowerCase().replace(/_/g, ' ').split(' ').filter(w => w.length > 2)
            ].slice(0, 5),
            priority: 'No Change Needed',
            descriptionCharCount: recommendedDesc.length
          });
        });
        
        console.log(
          `[${this.constructor.name}] Added ${missingNames.length} missing entries to comparison table`
        );
      }
      
      // Update totalColumns to match parsed count
      if (json.totalColumns !== tmlParsedData.totalColumns + tmlParsedData.totalFormulas) {
        console.log(
          `[${this.constructor.name}] Updating totalColumns from ${json.totalColumns} to ${tmlParsedData.totalColumns + tmlParsedData.totalFormulas}`
        );
        json.totalColumns = tmlParsedData.totalColumns + tmlParsedData.totalFormulas;
      }
    }

    return json;
  }

  /**
   * Analyze TML content using the AI provider with retry logic
   * @param {string} tmlContent - The TML file content to analyze
   * @param {string|null} businessQuestions - Optional business questions file content
   * @param {Object|null} tmlParsedData - Optional parsed TML data for validation
   * @returns {Promise<Object>} - Analysis results in standardized format
   */
  async analyzeTML(tmlContent, businessQuestions = null, tmlParsedData = null) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[${this.constructor.name}] Attempt ${attempt}/${this.maxRetries} with mode: ${this.mode}`);
        
        const response = await this.callProviderAPI(tmlContent, businessQuestions);
        const json = this.parseResponse(response);
        
        if (json) {
          console.log(`[${this.constructor.name}] Successfully parsed response on attempt ${attempt}`);
          
          // Validate and normalize the response to ensure recommendations are complete
          const normalized = this.validateAndNormalizeResponse(json, tmlParsedData);
          
          console.log(`[${this.constructor.name}] Response validated and normalized`);
          return normalized;
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
   * @param {string|null} businessQuestions - Optional business questions file content
   * @returns {Promise<string>} - Raw response text from provider
   */
  async callProviderAPI(tmlContent, businessQuestions = null) {
    throw new Error('callProviderAPI must be implemented by provider-specific service');
  }

  /**
   * Parse and extract JSON from AI response
   * @param {string} responseText - Raw response text from AI
   * @returns {Object} - Parsed JSON object
   */
  parseResponse(responseText) {
    try {
      // Log response info for debugging
      console.log(`[${this.constructor.name}] Response length: ${responseText.length} characters`);
      
      // First try the safe JSON parser
      const parsed = parseJSONSafely(responseText);
      if (parsed) {
        console.log(`[${this.constructor.name}] Successfully parsed JSON response`);
        return parsed;
      }

      // Fallback to regex extraction
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`[${this.constructor.name}] No JSON object found in response`);
        console.error('Response preview:', responseText.substring(0, 500));
        throw new Error('No valid JSON found in response. The AI may have returned plain text instead of JSON.');
      }
      
      const parsedFromRegex = JSON.parse(jsonMatch[0]);
      console.log(`[${this.constructor.name}] Successfully parsed JSON using regex extraction`);
      return parsedFromRegex;
      
    } catch (error) {
      console.error(`[${this.constructor.name}] JSON parsing failed:`, error);
      
      // Provide helpful error message based on the error type
      let helpfulMessage = error.message;
      
      if (error.message.includes('position') && error.message.includes('JSON')) {
        helpfulMessage = `${error.message}\n\nThis usually means:\n` +
          `1. The response was truncated due to token limits\n` +
          `2. The AI generated malformed JSON\n\n` +
          `Try using the 'Advanced' model mode for larger TML files, or break your TML into smaller sections.`;
      }
      
      // Log a snippet of the response for debugging
      if (responseText && responseText.length > 0) {
        const snippet = responseText.substring(Math.max(0, responseText.length - 500));
        console.error('Response tail (last 500 chars):', snippet);
      }
      
      throw new Error(`Failed to parse AI response: ${helpfulMessage}`);
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

