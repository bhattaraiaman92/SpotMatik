import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, model, tmlContent, businessQuestions, systemPrompt } = req.body;

    if (!apiKey || !model || !tmlContent || !systemPrompt) {
      return res.status(400).json({ 
        error: 'Missing required fields: apiKey, model, tmlContent, systemPrompt' 
      });
    }

    // Create Anthropic client with the user's API key
    const client = new Anthropic({
      apiKey: apiKey
    });

    const businessQuestionsSection = businessQuestions 
      ? `\n\n---\n\nBusiness Questions File:\n\n${businessQuestions}\n\n---\n\n`
      : '';

    // Make the API call
    const message = await client.messages.create({
      model: model,
      max_tokens: 8000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n---\n\nNow analyze this TML file:\n\n${tmlContent}${businessQuestionsSection}Return ONLY valid JSON, no other text.`
        }
      ]
    });

    // Return the response
    return res.status(200).json({
      success: true,
      content: message.content
    });

  } catch (error) {
    console.error('Error in Claude proxy:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to process request',
      details: error.toString()
    });
  }
}

