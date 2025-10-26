import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download, Sparkles, Key, Dog } from 'lucide-react';
import { AIServiceFactory } from './services/aiServiceFactory';
import { AI_PROVIDERS, PROVIDER_INFO } from './config/apiConfig';

const SpotterTMLOptimizer = () => {
  const [file, setFile] = useState(null);
  const [tmlContent, setTmlContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(AI_PROVIDERS.CLAUDE);
  const [selectedModel, setSelectedModel] = useState(PROVIDER_INFO[AI_PROVIDERS.CLAUDE].defaultModel);
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setError('');
      setResults(null);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setTmlContent(event.target.result);
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    setSelectedModel(PROVIDER_INFO[provider].defaultModel);
    setApiKey(''); // Clear API key when changing providers
    setShowApiKeyInput(true);
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
      const aiService = AIServiceFactory.createService(selectedProvider, apiKey, selectedModel);
      const results = await aiService.analyzeTML(tmlContent);
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

  return (
    <div className="min-h-screen bg-black bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with ThoughtSpot branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-ts-orange-500 p-3 rounded-xl shadow-lg shadow-ts-orange-500/20">
              <Dog className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">SpotMatik | Semantic Model Optimizer</h1>
          </div>
          <p className="text-lg text-gray-300">
            Upload your ThoughtSpot Semantic Model (TML) and get AI-powered optimization recommendations
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
                    {Object.values(AI_PROVIDERS).map((provider) => (
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

                {/* Model Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Select Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-700 text-white rounded-lg focus:border-ts-orange-500 focus:outline-none focus:ring-2 focus:ring-ts-orange-500/20 transition-all"
                  >
                    {PROVIDER_INFO[selectedProvider].models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* API Key Input */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    API Key for {PROVIDER_INFO[selectedProvider].name}
                  </label>
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
                  <div className="flex gap-3">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`${PROVIDER_INFO[selectedProvider].apiKeyPrefix}...`}
                      className="flex-1 px-4 py-2 bg-gray-800 border-2 border-gray-700 text-white rounded-lg focus:border-ts-orange-500 focus:outline-none focus:ring-2 focus:ring-ts-orange-500/20 transition-all placeholder-gray-500"
                    />
                    <button
                      onClick={() => {
                        if (apiKey) {
                          setShowApiKeyInput(false);
                        } else {
                          setError('Please enter an API key');
                        }
                      }}
                      className="px-6 py-2 bg-ts-orange-500 text-white rounded-lg font-semibold hover:bg-ts-orange-600 shadow-md shadow-ts-orange-500/20 hover:shadow-lg hover:shadow-ts-orange-500/30 transition-all transform hover:scale-105"
                    >
                      Save Key
                    </button>
                  </div>
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
              <p className="text-gray-400 text-sm">Model: {selectedModel}</p>
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
          <div className="flex flex-col items-center">
            <label className="w-full max-w-2xl cursor-pointer">
              <div className={`border-3 border-dashed rounded-xl p-12 text-center transition-all ${
                file ? 'border-ts-teal-500 bg-ts-teal-500/10' : 'border-ts-orange-500 bg-ts-orange-500/5 hover:bg-ts-orange-500/10 hover:border-ts-orange-400'
              }`}>
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-12 h-12 text-ts-teal-500" />
                    <div className="text-left">
                      <p className="text-lg font-semibold text-white">{file.name}</p>
                      <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-16 h-16 mx-auto mb-4 text-ts-orange-500" />
                    <p className="text-xl font-semibold text-white mb-2">
                      Drop your TML file here or click to browse
                    </p>
                    <p className="text-sm text-gray-400">Supports .tml files</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept=".tml,.yaml,.yml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {file && (
              <button
                onClick={analyzeTML}
                disabled={analyzing}
                className="mt-6 px-8 py-4 bg-ts-orange-500 text-white rounded-lg font-semibold text-lg hover:bg-ts-orange-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all flex items-center gap-3 shadow-lg shadow-ts-orange-500/30 hover:shadow-xl hover:shadow-ts-orange-500/40 transform hover:scale-105"
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
            <p className="text-red-300 font-medium">{error}</p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">📊 Model Overview</h2>
                <button
                  onClick={downloadReport}
                  className="flex items-center gap-2 px-4 py-2 bg-ts-orange-500/20 text-ts-orange-400 rounded-lg hover:bg-ts-orange-500/30 transition-all font-semibold shadow-sm hover:shadow-md"
                >
                  <Download className="w-5 h-5" />
                  Download Report
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1 font-medium">Industry Detected</p>
                  <p className="text-lg font-bold text-white">{results.industry}</p>
                </div>
                <div className="p-4 bg-ts-orange-500/10 rounded-lg border border-ts-orange-500/30">
                  <p className="text-sm text-ts-orange-400 mb-1 font-medium">Total Columns</p>
                  <p className="text-lg font-bold text-ts-orange-500">{results.totalColumns}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">🎯 Model-Level Recommendations</h2>
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
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">🚀 Quick Wins</h2>
              <div className="space-y-2">
                {results.quickWins.map((win, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-ts-teal-500/10 rounded-lg border-l-4 border-ts-teal-500 shadow-sm hover:shadow-md hover:bg-ts-teal-500/15 transition-all">
                    <span className="flex-shrink-0 w-6 h-6 bg-ts-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-gray-300">{win}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotterTMLOptimizer;
