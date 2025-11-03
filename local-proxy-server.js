/**
 * Simple local proxy server for Claude API
 * 
 * Run this alongside your Vite dev server to enable Claude API in local development:
 * 
 * Terminal 1: npm run dev
 * Terminal 2: node local-proxy-server.js
 * 
 * Then use Claude API in your app - it will automatically use this proxy at http://localhost:3001/api/claude-proxy
 */

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Claude proxy endpoint
app.post('/api/claude-proxy', async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`🚀 Claude Proxy Server running on http://localhost:${PORT}`);
  console.log(`   Proxy endpoint: http://localhost:${PORT}/api/claude-proxy`);
  console.log(`\n✅ Now you can use Claude API in your app!`);
  console.log(`   Keep this server running while developing.\n`);
});

