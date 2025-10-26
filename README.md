# Spotter TML Optimizer

AI-powered optimization tool for ThoughtSpot TML files.

## Quick Start

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open http://localhost:5173 in your browser

## How to Use

1. **Select Your AI Provider**: Choose between Claude, ChatGPT, or Gemini based on which API key you have
2. **Choose a Model**: Select the specific model version you want to use
3. **Enter API Key**: Paste your API key from the provider's console
4. **Upload TML File**: Drag and drop or click to browse for your TML file
5. **Analyze**: Click "Analyze with AI" and wait for the results
6. **Review Recommendations**: Get detailed, priority-ranked optimization suggestions
7. **Download Report**: Export your results as a markdown file

> **Note**: Your API key is stored only in your browser session and is never sent to any server other than the selected AI provider.

## Features

- **Multi-Provider AI Support**: Choose between Claude (Anthropic), ChatGPT (OpenAI), or Gemini (Google)
- **Model Selection**: Select from multiple models within each provider
- Upload TML files
- AI-powered analysis
- Industry-specific recommendations
- Priority-based suggestions
- Downloadable reports

## Supported AI Providers

### Claude (Anthropic)
- Models: `claude-sonnet-4-20250514`, `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`
- Get API key: [console.anthropic.com](https://console.anthropic.com/)

### ChatGPT (OpenAI)
- Models: `gpt-4o`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`
- Get API key: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Gemini (Google)
- Models: `gemini-2.0-flash-exp`, `gemini-1.5-pro`, `gemini-1.5-flash`
- Get API key: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide React Icons
- Anthropic SDK
- OpenAI SDK
- Google Generative AI SDK

## Development

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
