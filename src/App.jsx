import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download, Sparkles, Key, Zap, FileDown } from 'lucide-react';
import { AIServiceFactory } from './services/aiServiceFactory';
import { AI_PROVIDERS, PROVIDER_INFO, MODEL_MODES } from './config/apiConfig';
import { exportToDocx } from './utils/exportToDocx';

const SpotterTMLOptimizer = () => {
  const [tmlFile, setTmlFile] = useState(null);
  const [questionsFile, setQuestionsFile] = useState(null);
  const [tmlContent, setTmlContent] = useState('');
  const [questionsContent, setQuestionsContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [azureEndpoint, setAzureEndpoint] = useState('');
  const [azureDeployments, setAzureDeployments] = useState({
    standard: '',
    advanced: '',
    reasoning: '',
    advancedReasoning: ''
  });
  const [selectedProvider, setSelectedProvider] = useState(AI_PROVIDERS.OPENAI);
  const [selectedMode, setSelectedMode] = useState(MODEL_MODES.STANDARD);
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);

  const handleTmlFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setTmlFile(uploadedFile);
      setError('');
      setResults(null);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setTmlContent(event.target.result);
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleQuestionsFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setQuestionsFile(uploadedFile);
      setError('');
      setResults(null);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setQuestionsContent(event.target.result);
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    setApiKey(''); // Clear API key when changing providers
    setAzureEndpoint(''); // Clear Azure endpoint when changing providers
    setAzureDeployments({ // Clear Azure deployment names when changing providers
      standard: '',
      advanced: '',
      reasoning: '',
      advancedReasoning: ''
    });
    setShowApiKeyInput(true);
  };

  const handleAzureDeploymentChange = (mode, value) => {
    setAzureDeployments(prev => ({
      ...prev,
      [mode]: value
    }));
  };

  const analyzeTML = async () => {
    if (!tmlContent) {
      setError('Please upload a TML file first');
      return;
    }

    if (!apiKey) {
      setError(`Please enter your ${PROVIDER_INFO[selectedProvider].name} API key`);
      setShowApiKeyInput(true);
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      let azureConfig = null;
      if (selectedProvider === AI_PROVIDERS.OPENAI && azureEndpoint) {
        azureConfig = {
          endpoint: azureEndpoint,
          deployments: azureDeployments
        };
      }
      const aiService = AIServiceFactory.createService(selectedProvider, apiKey, selectedMode, azureConfig);
      const results = await aiService.analyzeTML(tmlContent, questionsContent || null);
      setResults(results);
    } catch (err) {
      setError(`Error analyzing TML file: ${err.message}`);
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadReport = () => {
    if (!results) return;
    const report = `# Spotter Model Optimization Report\nGenerated: ${new Date().toLocaleString()}\n\n## Overview\n- Industry: ${results.industry}\n- Total Columns: ${results.totalColumns}\n`;
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spotter-optimization-report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToWord = async () => {
    if (!results) return;
    try {
      await exportToDocx(results, 'spotter-optimization-report.docx');
    } catch (error) {
      setError(`Error exporting to Word: ${error.message}`);
      console.error('Export error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with ThoughtSpot branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-ts-orange-500 p-1 rounded-full shadow-lg shadow-ts-orange-500/20 w-12 h-12 flex items-center justify-center">
              <img 
                src="/spotmatik-logo.png" 
                alt="SpotMatik Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-white">SpotMatik | Semantic Model Optimizer</h1>
          </div>
          <p className="text-lg text-gray-300">
            Upload your ThoughtSpot Semantic Model (TML) file and optionally a business questions (TXT) file to get AI-powered optimization recommendations
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-sm text-gray-400 font-semibold">Built with 💛 by ThoughtSpot CS</span>
          </div>
        </div>

        {/* API Key Input Section */}
        {showApiKeyInput && (
          <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-8 mb-6">
            <div className="flex items-start gap-4">
              <div className="bg-ts-orange-500/20 p-2 rounded-lg">
                <Key className="w-6 h-6 text-white flex-shrink-0" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Configure AI Provider</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Choose your preferred AI provider and enter your API key. Your key is stored only in your browser session.
                </p>

                {/* Provider Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Select Provider</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.values(AI_PROVIDERS)
                      .filter(provider => provider !== AI_PROVIDERS.AZURE_OPENAI) // Azure handled through OpenAI provider
                      .map((provider) => (
                      <button
                        key={provider}
                        onClick={() => handleProviderChange(provider)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedProvider === provider
                            ? 'border-ts-orange-500 bg-ts-orange-500/10 shadow-md shadow-ts-orange-500/20'
                            : 'border-gray-700 hover:border-ts-orange-400 hover:bg-gray-800'
                        }`}
                      >
                        <div className="font-semibold text-white">{PROVIDER_INFO[provider].name}</div>
                        <div className="text-xs text-gray-400 mt-1">{PROVIDER_INFO[provider].description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Mode Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Model Mode</label>
                  <div className={`grid gap-3 ${
                    selectedProvider === AI_PROVIDERS.OPENAI && azureEndpoint 
                      ? 'grid-cols-2 md:grid-cols-4' 
                      : 'grid-cols-2'
                  }`}>
                    <button
                      onClick={() => setSelectedMode(MODEL_MODES.STANDARD)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedMode === MODEL_MODES.STANDARD
                          ? 'border-ts-orange-500 bg-ts-orange-500/10 shadow-md shadow-ts-orange-500/20'
                          : 'border-gray-700 hover:border-ts-orange-400 hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-5 h-5 text-ts-orange-500" />
                        <span className="font-semibold text-white">Standard</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Fast & cost-effective
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        {selectedProvider === AI_PROVIDERS.OPENAI && azureEndpoint && azureDeployments.standard
                          ? azureDeployments.standard
                          : PROVIDER_INFO[selectedProvider].standardModel}
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedMode(MODEL_MODES.ADVANCED)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedMode === MODEL_MODES.ADVANCED
                          ? 'border-ts-orange-500 bg-ts-orange-500/10 shadow-md shadow-ts-orange-500/20'
                          : 'border-gray-700 hover:border-ts-orange-400 hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <span className="font-semibold text-white">Advanced</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        More reasoning power
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        {selectedProvider === AI_PROVIDERS.OPENAI && azureEndpoint && azureDeployments.advanced
                          ? azureDeployments.advanced
                          : PROVIDER_INFO[selectedProvider].advancedModel}
                      </div>
                    </button>
                    {selectedProvider === AI_PROVIDERS.OPENAI && azureEndpoint && (
                      <>
                        <button
                          onClick={() => setSelectedMode(MODEL_MODES.REASONING)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedMode === MODEL_MODES.REASONING
                              ? 'border-ts-orange-500 bg-ts-orange-500/10 shadow-md shadow-ts-orange-500/20'
                              : 'border-gray-700 hover:border-ts-orange-400 hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-5 h-5 text-blue-500" />
                            <span className="font-semibold text-white">Reasoning</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            O1 reasoning model
                          </div>
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            {azureDeployments.reasoning || 'Not configured'}
                          </div>
                        </button>
                        <button
                          onClick={() => setSelectedMode(MODEL_MODES.ADVANCED_REASONING)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedMode === MODEL_MODES.ADVANCED_REASONING
                              ? 'border-ts-orange-500 bg-ts-orange-500/10 shadow-md shadow-ts-orange-500/20'
                              : 'border-gray-700 hover:border-ts-orange-400 hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            <span className="font-semibold text-white">Advanced Reasoning</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            O3 reasoning model
                          </div>
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            {azureDeployments.advancedReasoning || 'Not configured'}
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* API Key Input */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    API Key for {PROVIDER_INFO[selectedProvider].name}
                  </label>
                  
                  {/* Claude CORS Warning */}
                  {selectedProvider === AI_PROVIDERS.CLAUDE && (
                    <div className="mb-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <p className="text-xs text-blue-300">
                        ℹ️ <strong>Note:</strong> This app uses a backend proxy for Claude API to avoid CORS issues. 
                        If you encounter errors in local development, please use <strong>OpenAI</strong> or <strong>Gemini</strong>, or deploy to Vercel.
                      </p>
                    </div>
                  )}
                  
                  {/* Azure OpenAI Info */}
                  {selectedProvider === AI_PROVIDERS.OPENAI && (
                    <div className="mb-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <p className="text-xs text-blue-300">
                        💡 <strong>Azure OpenAI:</strong> Configure Azure OpenAI settings below, or leave blank for standard OpenAI.
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400 mb-2">
                    Get your API key from{' '}
                    <a 
                      href={PROVIDER_INFO[selectedProvider].consoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ts-orange-500 hover:text-ts-orange-400 font-medium hover:underline"
                    >
                      {PROVIDER_INFO[selectedProvider].consoleUrl}
                    </a>
                  </p>
                  
                  {/* API Key Input */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-1 font-semibold">API Key</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`${PROVIDER_INFO[selectedProvider].apiKeyPrefix}...`}
                      className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-700 text-white rounded-lg focus:border-ts-orange-500 focus:outline-none focus:ring-2 focus:ring-ts-orange-500/20 transition-all placeholder-gray-500"
                    />
                  </div>

                  {/* Azure Configuration Section (only for OpenAI) */}
                  {selectedProvider === AI_PROVIDERS.OPENAI && (
                    <div className="mb-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3">Azure OpenAI Configuration (Optional)</h3>
                      
                      {/* Azure Endpoint */}
                      <div className="mb-3">
                        <label className="block text-xs text-gray-400 mb-1">
                          Endpoint URL
                        </label>
                        <input
                          type="text"
                          value={azureEndpoint}
                          onChange={(e) => setAzureEndpoint(e.target.value)}
                          placeholder="https://YOUR-RESOURCE-NAME.openai.azure.com"
                          className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-700 text-white rounded-lg focus:border-ts-orange-500 focus:outline-none focus:ring-2 focus:ring-ts-orange-500/20 transition-all placeholder-gray-500 text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Your Azure OpenAI resource endpoint URL
                        </p>
                      </div>

                      {/* Azure Deployment Names - Multiple Model Options */}
                      <div className="mb-3">
                        <label className="block text-xs text-gray-400 mb-2 font-semibold">
                          Model Deployment Names
                        </label>
                        <div className="space-y-2">
                          {/* Standard Model */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Standard Model (e.g., gpt-4o-mini)
                            </label>
                            <input
                              type="text"
                              value={azureDeployments.standard}
                              onChange={(e) => handleAzureDeploymentChange('standard', e.target.value)}
                              placeholder="gpt-4o-mini-deployment"
                              className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-700 text-white rounded-lg focus:border-ts-orange-500 focus:outline-none focus:ring-2 focus:ring-ts-orange-500/20 transition-all placeholder-gray-500 text-sm"
                            />
                          </div>

                          {/* Advanced Model */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Advanced Model (e.g., gpt-4o)
                            </label>
                            <input
                              type="text"
                              value={azureDeployments.advanced}
                              onChange={(e) => handleAzureDeploymentChange('advanced', e.target.value)}
                              placeholder="gpt-4o-deployment"
                              className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-700 text-white rounded-lg focus:border-ts-orange-500 focus:outline-none focus:ring-2 focus:ring-ts-orange-500/20 transition-all placeholder-gray-500 text-sm"
                            />
                          </div>

                          {/* Reasoning Model */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Reasoning Model (e.g., o1-mini)
                            </label>
                            <input
                              type="text"
                              value={azureDeployments.reasoning}
                              onChange={(e) => handleAzureDeploymentChange('reasoning', e.target.value)}
                              placeholder="o1-mini-deployment"
                              className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-700 text-white rounded-lg focus:border-ts-orange-500 focus:outline-none focus:ring-2 focus:ring-ts-orange-500/20 transition-all placeholder-gray-500 text-sm"
                            />
                          </div>

                          {/* Advanced Reasoning Model */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Advanced Reasoning Model (e.g., o3-mini)
                            </label>
                            <input
                              type="text"
                              value={azureDeployments.advancedReasoning}
                              onChange={(e) => handleAzureDeploymentChange('advancedReasoning', e.target.value)}
                              placeholder="o3-mini-deployment"
                              className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-700 text-white rounded-lg focus:border-ts-orange-500 focus:outline-none focus:ring-2 focus:ring-ts-orange-500/20 transition-all placeholder-gray-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Configure deployment names for different model types. Leave blank if you don't have that deployment. 
                        Select the mode above to use the corresponding deployment.
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      if (apiKey) {
                        setShowApiKeyInput(false);
                      } else {
                        setError('Please enter an API key');
                      }
                    }}
                    className="w-full px-6 py-2 bg-ts-orange-500 text-white rounded-lg font-semibold hover:bg-ts-orange-600 shadow-md shadow-ts-orange-500/20 hover:shadow-lg hover:shadow-ts-orange-500/30 transition-all transform hover:scale-105"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showApiKeyInput && (
          <div className="bg-gray-900 border-l-4 border-ts-teal-500 p-4 mb-6 rounded-lg shadow-md flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-ts-teal-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-white font-semibold">
                {PROVIDER_INFO[selectedProvider].name} configured
              </p>
              <p className="text-gray-400 text-sm">
                Mode: {selectedMode === MODEL_MODES.STANDARD ? 'Standard' : 
                       selectedMode === MODEL_MODES.ADVANCED ? 'Advanced' :
                       selectedMode === MODEL_MODES.REASONING ? 'Reasoning' : 'Advanced Reasoning'} 
                <span className="text-gray-500 ml-2">
                  ({selectedProvider === AI_PROVIDERS.OPENAI && azureEndpoint 
                    ? (azureDeployments[selectedMode] || 'Not configured')
                    : selectedMode === MODEL_MODES.STANDARD 
                      ? PROVIDER_INFO[selectedProvider].standardModel 
                      : selectedMode === MODEL_MODES.ADVANCED
                      ? PROVIDER_INFO[selectedProvider].advancedModel
                      : selectedMode === MODEL_MODES.REASONING
                      ? 'o1-mini'
                      : 'o3-mini'})
                </span>
              </p>
              {selectedProvider === AI_PROVIDERS.OPENAI && azureEndpoint && (
                <p className="text-gray-500 text-xs mt-1">
                  Azure OpenAI: {azureEndpoint}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="text-ts-orange-500 hover:text-ts-orange-400 text-sm font-medium underline"
            >
              Change
            </button>
          </div>
        )}

        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-8 mb-6">
          <div className="flex flex-col items-center gap-6">
            {/* TML File Upload */}
            <div className="w-full max-w-2xl">
              <label className="block text-sm font-semibold text-gray-300 mb-2">TML File (Required)</label>
              <label className="w-full cursor-pointer">
                <div className={`border-3 border-dashed rounded-xl p-8 text-center transition-all ${
                  tmlFile ? 'border-ts-teal-500 bg-ts-teal-500/10' : 'border-ts-orange-500 bg-ts-orange-500/5 hover:bg-ts-orange-500/10 hover:border-ts-orange-400'
                }`}>
                  {tmlFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-10 h-10 text-ts-teal-500" />
                      <div className="text-left">
                        <p className="text-base font-semibold text-white">{tmlFile.name}</p>
                        <p className="text-xs text-gray-400">{(tmlFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-3 text-ts-orange-500" />
                      <p className="text-lg font-semibold text-white mb-1">
                        Drop TML file here or click to browse
                      </p>
                      <p className="text-xs text-gray-400">Supports .tml, .yaml, .yml files</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".tml,.yaml,.yml"
                  onChange={handleTmlFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Business Questions File Upload */}
            <div className="w-full max-w-2xl">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Business Questions File (Optional)</label>
              <label className="w-full cursor-pointer">
                <div className={`border-3 border-dashed rounded-xl p-8 text-center transition-all ${
                  questionsFile ? 'border-ts-teal-500 bg-ts-teal-500/10' : 'border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-500'
                }`}>
                  {questionsFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-10 h-10 text-ts-teal-500" />
                      <div className="text-left">
                        <p className="text-base font-semibold text-white">{questionsFile.name}</p>
                        <p className="text-xs text-gray-400">{(questionsFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                      <p className="text-lg font-semibold text-white mb-1">
                        Drop business questions file here or click to browse
                      </p>
                      <p className="text-xs text-gray-400">Supports .txt files. List business questions users typically ask.</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleQuestionsFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {tmlFile && (
              <button
                onClick={analyzeTML}
                disabled={analyzing}
                className="mt-2 px-8 py-4 bg-ts-orange-500 text-white rounded-lg font-semibold text-lg hover:bg-ts-orange-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all flex items-center gap-3 shadow-lg shadow-ts-orange-500/30 hover:shadow-xl hover:shadow-ts-orange-500/40 transform hover:scale-105"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Analyzing TML...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Analyze & Optimize
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border-l-4 border-red-500 p-4 mb-6 rounded-lg shadow-md flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-red-300 font-medium whitespace-pre-line">{error}</div>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">📊 Model Overview</h2>
                <div className="flex gap-3">
                  <button
                    onClick={downloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all font-semibold shadow-sm hover:shadow-md"
                  >
                    <Download className="w-5 h-5" />
                    Markdown
                  </button>
                  <button
                    onClick={exportToWord}
                    className="flex items-center gap-2 px-4 py-2 bg-ts-orange-500 text-white rounded-lg hover:bg-ts-orange-600 transition-all font-semibold shadow-md shadow-ts-orange-500/20 hover:shadow-lg hover:shadow-ts-orange-500/30"
                  >
                    <FileDown className="w-5 h-5" />
                    Export to Word
                  </button>
                </div>
              </div>
              
              {/* Primary Metrics */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1 font-medium">Industry Detected</p>
                  <p className="text-lg font-bold text-white">{results.industry}</p>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1 font-medium">Business Function</p>
                  <p className="text-lg font-bold text-white">{results.businessFunction}</p>
                </div>
                <div className="p-4 bg-ts-orange-500/10 rounded-lg border border-ts-orange-500/30">
                  <p className="text-sm text-ts-orange-400 mb-1 font-medium">Total Columns</p>
                  <p className="text-lg font-bold text-ts-orange-500">{results.totalColumns}</p>
                </div>
              </div>

              {/* Model Purpose */}
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-2 font-medium">Model Purpose</p>
                <p className="text-white">{results.modelPurpose}</p>
              </div>

              {/* Statistics */}
              {results.statistics && (
                <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                  <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                    <p className="text-sm text-red-400 mb-1 font-medium">Missing Descriptions</p>
                    <p className="text-2xl font-bold text-red-400">{results.statistics.missingDescriptions || 0}</p>
                  </div>
                  <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                    <p className="text-sm text-yellow-400 mb-1 font-medium">Abbreviated Names</p>
                    <p className="text-2xl font-bold text-yellow-400">{results.statistics.abbreviatedNames || 0}</p>
                  </div>
                  <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <p className="text-sm text-blue-400 mb-1 font-medium">Needing Synonyms</p>
                    <p className="text-2xl font-bold text-blue-400">{results.statistics.needingSynonyms || 0}</p>
                  </div>
                  {results.statistics.descriptionsOver200Chars !== undefined && (
                    <div className="p-4 bg-orange-900/20 rounded-lg border border-orange-500/30">
                      <p className="text-sm text-orange-400 mb-1 font-medium">Over 200 Chars</p>
                      <p className="text-2xl font-bold text-orange-400">{results.statistics.descriptionsOver200Chars || 0}</p>
                    </div>
                  )}
                  {results.statistics.synonymOverlapIssues !== undefined && (
                    <div className="p-4 bg-pink-900/20 rounded-lg border border-pink-500/30">
                      <p className="text-sm text-pink-400 mb-1 font-medium">Synonym Overlaps</p>
                      <p className="text-2xl font-bold text-pink-400">{results.statistics.synonymOverlapIssues || 0}</p>
                    </div>
                  )}
                  <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                    <p className="text-sm text-purple-400 mb-1 font-medium">Impact Level</p>
                    <p className="text-2xl font-bold text-purple-400">{results.statistics.impactLevel || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Industry Context */}
            {results.industryContext && (
              <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-8">
                <h2 className="text-2xl font-bold text-white mb-4">📚 Industry Context</h2>
                <p className="text-gray-300 leading-relaxed">{results.industryContext}</p>
              </div>
            )}

            <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">🎯 Model-Level Recommendations</h2>
              
              {/* Model Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-ts-orange-400 mb-3">Model Description</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-red-900/20 rounded-lg border-l-4 border-red-500 shadow-sm">
                    <p className="text-sm text-red-400 mb-1 font-semibold">Current</p>
                    <p className="text-gray-300">{results.modelDescription.current}</p>
                  </div>
                  <div className="p-4 bg-ts-teal-500/10 rounded-lg border-l-4 border-ts-teal-500 shadow-sm">
                    <p className="text-sm text-ts-teal-400 mb-1 font-semibold">Recommended</p>
                    <p className="text-gray-300">{results.modelDescription.recommended}</p>
                  </div>
                </div>
              </div>

              {/* Model Instructions */}
              {results.modelInstructions && results.modelInstructions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-ts-orange-400 mb-3">Model Instructions (Universal Rules)</h3>
                  <div className="space-y-2">
                    {results.modelInstructions.map((instruction, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <span className="flex-shrink-0 w-6 h-6 bg-ts-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <p className="text-gray-300">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CRITICAL Priority */}
            {results.columnRecommendations && results.columnRecommendations.critical && results.columnRecommendations.critical.length > 0 && (
              <div className="bg-gray-900 rounded-xl shadow-2xl border border-red-500/30 p-8">
                <h2 className="text-2xl font-bold text-red-400 mb-6">🔴 CRITICAL - Do First</h2>
                <div className="space-y-6">
                  {results.columnRecommendations.critical.map((col, idx) => (
                    <div key={idx} className="p-6 border-2 border-red-500/30 rounded-lg bg-red-900/10 shadow-md hover:shadow-lg hover:border-red-500/50 transition-all">
                      <h3 className="text-xl font-semibold text-white mb-2">{col.columnName}</h3>
                      <p className="text-gray-300 mb-4"><span className="font-semibold text-red-400">Issue:</span> {col.issue}</p>
                      
                      {col.recommendations.name && (
                        <div className="mb-3">
                          <p className="text-sm text-ts-orange-400 font-semibold mb-1">Recommended Name:</p>
                          <p className="text-white font-medium">{col.recommendations.name}</p>
                        </div>
                      )}
                      
                      {col.recommendations.description && (
                        <div className="mb-3">
                          <p className="text-sm text-ts-orange-400 font-semibold mb-1">Description:</p>
                          <p className="text-gray-300">{col.recommendations.description}</p>
                        </div>
                      )}
                      
                      {col.recommendations.synonyms && col.recommendations.synonyms.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-ts-orange-400 font-semibold mb-2">Suggested Synonyms:</p>
                          <div className="flex flex-wrap gap-2">
                            {col.recommendations.synonyms.map((syn, synIdx) => (
                              <span key={synIdx} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm border border-gray-700">
                                {syn}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {col.recommendations.rationale && (
                        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border-l-4 border-ts-teal-500">
                          <p className="text-sm text-ts-teal-400 font-semibold mb-1">Why This Matters:</p>
                          <p className="text-gray-300 text-sm">{col.recommendations.rationale}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* IMPORTANT Priority */}
            {results.columnRecommendations && results.columnRecommendations.important && results.columnRecommendations.important.length > 0 && (
              <div className="bg-gray-900 rounded-xl shadow-2xl border border-yellow-500/30 p-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-6">🟡 IMPORTANT - Do Soon</h2>
                <div className="space-y-6">
                  {results.columnRecommendations.important.map((col, idx) => (
                    <div key={idx} className="p-6 border-2 border-yellow-500/30 rounded-lg bg-yellow-900/10 shadow-md hover:shadow-lg hover:border-yellow-500/50 transition-all">
                      <h3 className="text-xl font-semibold text-white mb-2">{col.columnName}</h3>
                      <p className="text-gray-300 mb-4"><span className="font-semibold text-yellow-400">Issue:</span> {col.issue}</p>
                      
                      {col.recommendations.name && (
                        <div className="mb-3">
                          <p className="text-sm text-ts-orange-400 font-semibold mb-1">Recommended Name:</p>
                          <p className="text-white font-medium">{col.recommendations.name}</p>
                        </div>
                      )}
                      
                      {col.recommendations.description && (
                        <div className="mb-3">
                          <p className="text-sm text-ts-orange-400 font-semibold mb-1">Description:</p>
                          <p className="text-gray-300">{col.recommendations.description}</p>
                        </div>
                      )}
                      
                      {col.recommendations.synonyms && col.recommendations.synonyms.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-ts-orange-400 font-semibold mb-2">Suggested Synonyms:</p>
                          <div className="flex flex-wrap gap-2">
                            {col.recommendations.synonyms.map((syn, synIdx) => (
                              <span key={synIdx} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm border border-gray-700">
                                {syn}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {col.recommendations.rationale && (
                        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border-l-4 border-ts-teal-500">
                          <p className="text-sm text-ts-teal-400 font-semibold mb-1">Why This Matters:</p>
                          <p className="text-gray-300 text-sm">{col.recommendations.rationale}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NICE TO HAVE Priority */}
            {results.columnRecommendations && results.columnRecommendations.niceToHave && results.columnRecommendations.niceToHave.length > 0 && (
              <div className="bg-gray-900 rounded-xl shadow-2xl border border-green-500/30 p-8">
                <h2 className="text-2xl font-bold text-green-400 mb-6">🟢 NICE TO HAVE - When Time Permits</h2>
                <div className="space-y-6">
                  {results.columnRecommendations.niceToHave.map((col, idx) => (
                    <div key={idx} className="p-6 border-2 border-green-500/30 rounded-lg bg-green-900/10 shadow-md hover:shadow-lg hover:border-green-500/50 transition-all">
                      <h3 className="text-xl font-semibold text-white mb-2">{col.columnName}</h3>
                      <p className="text-gray-300 mb-4"><span className="font-semibold text-green-400">Issue:</span> {col.issue}</p>
                      
                      {col.recommendations.name && (
                        <div className="mb-3">
                          <p className="text-sm text-ts-orange-400 font-semibold mb-1">Recommended Name:</p>
                          <p className="text-white font-medium">{col.recommendations.name}</p>
                        </div>
                      )}
                      
                      {col.recommendations.description && (
                        <div className="mb-3">
                          <p className="text-sm text-ts-orange-400 font-semibold mb-1">Description:</p>
                          <p className="text-gray-300">{col.recommendations.description}</p>
                        </div>
                      )}
                      
                      {col.recommendations.synonyms && col.recommendations.synonyms.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-ts-orange-400 font-semibold mb-2">Suggested Synonyms:</p>
                          <div className="flex flex-wrap gap-2">
                            {col.recommendations.synonyms.map((syn, synIdx) => (
                              <span key={synIdx} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm border border-gray-700">
                                {syn}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {col.recommendations.rationale && (
                        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border-l-4 border-ts-teal-500">
                          <p className="text-sm text-ts-teal-400 font-semibold mb-1">Why This Matters:</p>
                          <p className="text-gray-300 text-sm">{col.recommendations.rationale}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">🚀 Quick Wins</h2>
              <div className="space-y-2">
                {results.quickWins && results.quickWins.map((win, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-ts-teal-500/10 rounded-lg border-l-4 border-ts-teal-500 shadow-sm hover:shadow-md hover:bg-ts-teal-500/15 transition-all">
                    <span className="flex-shrink-0 w-6 h-6 bg-ts-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-gray-300">{win}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Table */}
            {results.comparisonTable && results.comparisonTable.length > 0 && (
              <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">📋 Current vs Recommended Comparison</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-800 text-gray-400">
                      <tr>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Current Name</th>
                        <th className="px-4 py-3">Recommended Name</th>
                        <th className="px-4 py-3">Current Description</th>
                        <th className="px-4 py-3">Recommended Description</th>
                        <th className="px-4 py-3">Current Synonyms</th>
                        <th className="px-4 py-3">Recommended Synonyms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.comparisonTable.map((row, idx) => (
                        <tr key={idx} className={`border-b border-gray-700 ${
                          row.priority === 'Critical' ? 'bg-red-900/10' :
                          row.priority === 'Important' ? 'bg-yellow-900/10' :
                          'bg-green-900/10'
                        }`}>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              row.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                              row.priority === 'Important' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {row.priority === 'Critical' ? '🔴' : row.priority === 'Important' ? '🟡' : '🟢'} {row.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-400">{row.currentName}</td>
                          <td className="px-4 py-3 font-semibold text-ts-teal-400">{row.recommendedName}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs max-w-xs">
                            {row.currentDescription === 'None' || !row.currentDescription ? (
                              <span className="text-red-400 italic">Missing</span>
                            ) : (
                              row.currentDescription
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-300 text-xs max-w-xs">
                            {row.recommendedDescription}
                            {row.descriptionCharCount && (
                              <span className="block text-xs text-gray-500 mt-1">
                                ({row.descriptionCharCount}/200 chars)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {row.currentSynonyms === 'None' || !row.currentSynonyms || row.currentSynonyms.length === 0 ? (
                              <span className="text-red-400 italic">None</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(row.currentSynonyms) ? row.currentSynonyms : []).map((syn, synIdx) => (
                                  <span key={synIdx} className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                                    {syn}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <div className="flex flex-wrap gap-1">
                              {row.recommendedSynonyms.map((syn, synIdx) => (
                                <span key={synIdx} className="px-2 py-0.5 bg-ts-orange-500/20 text-ts-orange-400 rounded text-xs">
                                  {syn}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pb-8 text-center">
          <a
            href="https://github.com/bhattaraiaman92/SpotMatik/blob/main/master_prompt.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-ts-orange-400 text-sm transition-colors underline"
          >
            👉 Click here to get the Master LLM Prompt!
          </a>
        </div>
      </div>
    </div>
  );
};

export default SpotterTMLOptimizer;
