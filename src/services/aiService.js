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
        if (!rec.description) {
          rec.description = item.columnName 
            ? `Column representing ${item.columnName.toLowerCase().replace(/_/g, ' ')}.`
            : 'Description needed for Spotter optimization.';
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
        recommendedDescription: row.recommendedDescription || (row.currentName 
          ? `Column representing ${row.currentName.toLowerCase().replace(/_/g, ' ')}. Optimized for Spotter natural language queries.`
          : 'Description needed for Spotter optimization.'),
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
      if (!normalizedRow.recommendedDescription || normalizedRow.recommendedDescription === 'None') {
        normalizedRow.recommendedDescription = normalizedRow.currentName 
          ? `Column representing ${normalizedRow.currentName.toLowerCase().replace(/_/g, ' ')}. Optimized for Spotter natural language queries to improve search accuracy and user experience.`
          : 'Description needed for Spotter optimization. Provides context for natural language query interpretation.';
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
          const recommendedDesc = `Column representing ${name.toLowerCase().replace(/_/g, ' ')}. Optimized for Spotter natural language queries.`;
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

