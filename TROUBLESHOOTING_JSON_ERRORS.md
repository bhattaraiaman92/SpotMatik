# Troubleshooting JSON Parsing Errors

## Quick Fix Guide

If you encounter a JSON parsing error like:

```
Error analyzing TML file: Failed to parse AI response: Expected ',' or ']' after array element in JSON at position XXXXX
```

Follow these steps:

### Step 1: Switch to Advanced Mode

1. Click **"Change"** next to your configured AI provider
2. Select **"Advanced"** instead of "Standard" in the Model Mode section
3. Click **"Save Key"**
4. Try analyzing your TML file again

**Why this helps**: Advanced models have better JSON generation capabilities and can handle larger, more complex outputs.

### Step 2: Check Your TML File Size

Large TML files with many columns can exceed output limits:

- ✅ **Under 100 columns**: Usually works fine with Standard mode
- ⚠️ **100-200 columns**: Use Advanced mode
- 🚨 **200+ columns**: Consider splitting into smaller sections

**How to check**: Look at the file size or count the number of column definitions in your TML.

### Step 3: Try a Different AI Provider

Different AI providers handle large outputs differently:

1. **OpenAI (GPT-4)**: Generally most reliable for large files
2. **Claude**: Good balance of speed and accuracy
3. **Gemini**: Fast but may struggle with very large outputs

To switch providers:
1. Click **"Change"** next to your configured AI provider
2. Select a different provider
3. Enter the API key for that provider
4. Try the analysis again

### Step 4: Check Browser Console Logs

The application provides detailed debugging information:

1. Open your browser's Developer Tools:
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - **Safari**: Enable Developer menu in Preferences, then press `Cmd+Option+C`

2. Click the **"Console"** tab

3. Try analyzing your TML file again

4. Look for messages starting with:
   - `[OpenAIService]` or `[ClaudeService]` or `[GeminiService]`
   - Messages about JSON parsing attempts
   - Response length and repair attempts

5. Take a screenshot of any error messages to share when reporting issues

### Step 5: Reduce TML File Scope (If Nothing Else Works)

If your TML file is very large, temporarily reduce it:

1. Create a copy of your TML file
2. Remove some table definitions or columns
3. Analyze the smaller TML file
4. Repeat for other sections
5. Combine the recommendations manually

**Pro tip**: Start with the most critical tables/columns first.

## Understanding the Error

### What Causes This Error?

1. **Truncated Response**: The AI hit the maximum output token limit and stopped mid-JSON
2. **Malformed JSON**: The AI generated invalid JSON syntax
3. **Network Issues**: The response was corrupted during transmission

### How We Fixed It (Technical)

The application now includes:

- ✅ **Automatic JSON Repair**: Fixes common issues like trailing commas, missing brackets
- ✅ **Higher Token Limits**: Increased by 25-33% for all providers
- ✅ **Multiple Retry Strategies**: 5 different methods to extract valid JSON
- ✅ **Better Error Messages**: Clearer explanations and suggestions

## Common Scenarios

### Scenario 1: "My TML has 150 columns"

**Solution**: Use Advanced mode with OpenAI or Claude.

**Why**: Large TML files generate lengthy JSON responses. Advanced models can handle this better.

### Scenario 2: "It worked before, now it doesn't"

**Solution**: 
1. Clear your browser cache
2. Refresh the page
3. Re-enter your API key
4. Try again

**Why**: Cached data or session issues can cause problems.

### Scenario 3: "The analysis takes 5+ minutes then fails"

**Solution**:
1. Check your internet connection
2. Verify your API key is valid and has credits
3. Try using Standard mode for faster response (if your TML is small)
4. Try a different AI provider

**Why**: Long processing times usually indicate network or API quota issues.

### Scenario 4: "I see 'Response tail' in console logs"

**Solution**: This is normal debugging information showing where the response ended. 

**What to check**:
- If the tail shows incomplete JSON (like `"synonyms": ["test", "exa`), the response was truncated → Use Advanced mode
- If the tail shows complete JSON with a `}`, but parsing still fails → Report this as a bug with the console logs

## Advanced Troubleshooting

### Enable Verbose Logging

The application automatically logs detailed information to the browser console. To capture this:

1. Open Developer Tools (F12)
2. Go to Console tab
3. Right-click in the console
4. Select "Save as..." to save logs to a file
5. Share this file when reporting issues

### Check API Provider Status

If errors persist across multiple attempts:

1. **OpenAI**: Check status at https://status.openai.com/
2. **Anthropic (Claude)**: Check status at https://status.anthropic.com/
3. **Google (Gemini)**: Check status at https://status.cloud.google.com/

### Verify API Key Validity

1. Go to your provider's console:
   - OpenAI: https://platform.openai.com/api-keys
   - Claude: https://console.anthropic.com/
   - Gemini: https://aistudio.google.com/apikey

2. Check if your key is active and has usage credits

3. Generate a new key if needed

## Still Having Issues?

If you've tried all the steps above and still encounter errors:

1. **Collect Information**:
   - TML file size (KB or number of columns)
   - AI provider and mode you're using
   - Complete error message
   - Browser console logs
   - Browser and version

2. **Report the Issue**:
   - Create a GitHub issue with the collected information
   - Include the error message and console logs
   - Describe what you've already tried

3. **Temporary Workaround**:
   - Use a smaller subset of your TML file
   - Split analysis into multiple runs
   - Use different AI provider

## Preventive Measures

To minimize JSON parsing errors:

- ✅ Start with **Advanced mode** for large TML files (100+ columns)
- ✅ Use **OpenAI GPT-4** for most reliable results
- ✅ Keep your TML files **under 200 columns** when possible
- ✅ **Split very large models** into logical sections (e.g., by table)
- ✅ Keep your **browser and API keys** up to date
- ✅ Monitor the **browser console** for warnings

## Success Tips

**For Best Results**:

1. **Use Advanced Mode**: Better for complex TML files
2. **OpenAI Provider**: Most reliable for large outputs
3. **Stable Internet**: Ensure good connection during analysis
4. **Valid API Key**: Check credits and limits
5. **Appropriate TML Size**: Under 200 columns works best

## Need More Help?

- 📖 Check the main README.md for general setup
- 🔧 See JSON_PARSING_FIX.md for technical details
- 💬 Open a GitHub issue for bugs
- 🎯 Review the master_prompt.txt to understand expected output format

---

**Quick Reference Card**

| Error Type | Quick Fix |
|------------|-----------|
| Truncated JSON | Use Advanced mode |
| Large TML (200+ columns) | Split into smaller files |
| Parsing fails consistently | Try different AI provider |
| Network timeout | Check internet & API status |
| Invalid API key | Regenerate key at provider console |

**Remember**: The application now has automatic JSON repair built in, so most errors should be handled automatically. If you still see errors after trying these steps, it likely indicates a more fundamental issue that needs investigation.

