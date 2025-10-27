// Supported AI Providers
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  CLAUDE: 'claude',
  GEMINI: 'gemini'
};

// Model modes
export const MODEL_MODES = {
  STANDARD: 'standard',
  ADVANCED: 'advanced'
};

// Base configuration for each provider with toggleable models
export const AI_MODELS = {
  [AI_PROVIDERS.OPENAI]: {
    models: {
      standard: 'gpt-4o-mini',  // fast, cheaper
      advanced: 'gpt-4o'        // slower, more reasoning power
    },
    defaults: {
      temperature: 0.25,
      topP: 0.9,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      responseFormat: 'json',
      maxTokens: 12000
    }
  },
  [AI_PROVIDERS.CLAUDE]: {
    models: {
      standard: 'claude-3-5-sonnet-20241022',
      advanced: 'claude-sonnet-4-20250514'
    },
    defaults: {
      temperature: 0.2,
      topP: 0.9,
      responseFormat: 'json',
      maxTokens: 15000
    }
  },
  [AI_PROVIDERS.GEMINI]: {
    models: {
      standard: 'gemini-1.5-flash', // fast and cheap
      advanced: 'gemini-1.5-pro'    // richer reasoning
    },
    defaults: {
      temperature: 0.35,
      topP: 0.9,
      responseMimeType: 'application/json',
      maxTokens: 16000
    }
  }
};

// Provider display information
export const PROVIDER_INFO = {
  [AI_PROVIDERS.CLAUDE]: {
    name: 'Claude (Anthropic)',
    apiKeyPrefix: 'sk-ant-',
    consoleUrl: 'https://console.anthropic.com/',
    description: 'Anthropic Claude - Advanced reasoning and analysis',
    standardModel: AI_MODELS[AI_PROVIDERS.CLAUDE].models.standard,
    advancedModel: AI_MODELS[AI_PROVIDERS.CLAUDE].models.advanced
  },
  [AI_PROVIDERS.OPENAI]: {
    name: 'ChatGPT (OpenAI)',
    apiKeyPrefix: 'sk-',
    consoleUrl: 'https://platform.openai.com/api-keys',
    description: 'OpenAI ChatGPT - Versatile and powerful',
    standardModel: AI_MODELS[AI_PROVIDERS.OPENAI].models.standard,
    advancedModel: AI_MODELS[AI_PROVIDERS.OPENAI].models.advanced
  },
  [AI_PROVIDERS.GEMINI]: {
    name: 'Gemini (Google)',
    apiKeyPrefix: 'AI',
    consoleUrl: 'https://aistudio.google.com/apikey',
    description: 'Google Gemini - Fast and efficient',
    standardModel: AI_MODELS[AI_PROVIDERS.GEMINI].models.standard,
    advancedModel: AI_MODELS[AI_PROVIDERS.GEMINI].models.advanced
  }
};

// Helper to get full config dynamically
export function getModelConfig(provider, mode = MODEL_MODES.STANDARD) {
  const base = AI_MODELS[provider];
  if (!base) throw new Error(`Unsupported provider: ${provider}`);

  const model = base.models[mode] || base.models.standard;
  return { ...base.defaults, model };
}

// Simple JSON cleaner
export function parseJSONSafely(text) {
  try {
    const clean = text.replace(/```(json)?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

export const SYSTEM_PROMPT = `You are an expert ThoughtSpot data modeling consultant specializing in optimizing semantic models for Spotter (natural language search). 
Analyze ThoughtSpot Modeling Language (TML) files and produce an optimization report aligned with Spotter best practices.

=== TASK ===
1. Parse the uploaded TML (tables, columns, joins, metadata).
2. Identify the model's industry, business function, and key metrics.
3. Evaluate model and columns per Spotter best practices.
4. Provide: 
   - Overview & context
   - Model-level description and instructions
   - Column-level naming, description, and synonym recommendations
   - Priority categorization (Critical / Important / Nice to Have)
   - Comparison table showing current vs recommended states.

=== ANALYSIS FRAMEWORK ===

[1] INDUSTRY & CONTEXT
- Detect industry (Retail, Finance, SaaS, etc.)
- Detect business function (Sales, Marketing, Ops, etc.)
- Infer likely business questions users would ask.
- Research standard KPIs and terminology if uncertain.

[2] MODEL-LEVEL ANALYSIS
- Review and rewrite model description (2–3 sentences max)
- Suggest 3–5 model-level Spotter rules (filters, preferred columns, date defaults, exclusions)

[3] COLUMN-LEVEL ANALYSIS
For each column:
- Check name quality (clarity, abbreviations, jargon)
- Check description (presence, clarity, <200 chars, business meaning)
- Check synonyms (include 3–5 relevant, industry-aligned terms)
Output a rationale for each improvement.

[4] PRIORITY ASSIGNMENT
- 🔴 CRITICAL: impacts Spotter accuracy (missing descriptions, ambiguous names)
- 🟡 IMPORTANT: improves usability (unclear names, missing synonyms)
- 🟢 NICE TO HAVE: consistency or cosmetic updates

[5] GUIDELINES
- Use concise, business-friendly names.
- Descriptions must be under 200 characters and meaningful to non-technical users.
- Provide 3–5 relevant synonyms per column.
- Focus on Spotter discoverability and natural language understanding.
- Include rationale for each recommendation when needed.
- Prioritize accuracy, clarity, and searchability.

=== OUTPUT FORMAT ===

Return ONLY valid JSON in this EXACT format (no markdown, no code blocks, just JSON):

{
  "industry": "string - detected industry",
  "businessFunction": "string - department/function",
  "modelPurpose": "string - what this model does",
  "totalColumns": number,
  "columnsNeedingAttention": number,
  "modelDescription": {
    "current": "string - existing description or 'None'",
    "recommended": "string - your 2-3 sentence recommendation"
  },
  "modelInstructions": [
    "string - instruction 1 (e.g., default filters, exclusions)",
    "string - instruction 2",
    "string - instruction 3",
    "string - instruction 4",
    "string - instruction 5"
  ],
  "columnRecommendations": {
    "critical": [
      {
        "columnName": "string - current column name",
        "issue": "string - what's wrong",
        "recommendations": {
          "name": "string - new name if needed",
          "description": "string - under 200 chars",
          "synonyms": ["string", "string", "string"],
          "rationale": "string - why these changes help"
        }
      }
    ],
    "important": [],
    "niceToHave": []
  },
  "comparisonTable": [
    {
      "currentName": "string - current column name",
      "recommendedName": "string - recommended name",
      "currentDescription": "string - current description or 'None'",
      "recommendedDescription": "string - recommended description",
      "currentSynonyms": ["string"] or "None",
      "recommendedSynonyms": ["string", "string", "string"],
      "priority": "Critical|Important|Nice to Have"
    }
  ],
  "statistics": {
    "missingDescriptions": number,
    "abbreviatedNames": number,
    "needingSynonyms": number,
    "impactLevel": "High|Medium|Low"
  },
  "quickWins": [
    "string - actionable quick win 1 (high-impact change)",
    "string - actionable quick win 2",
    "string - actionable quick win 3",
    "string - actionable quick win 4",
    "string - actionable quick win 5"
  ],
  "industryContext": "string - relevant industry insights and key KPIs"
}

CRITICAL: Return ONLY the JSON object, no other text, no markdown formatting, no code blocks.`;
