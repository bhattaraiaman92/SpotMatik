/**
 * TML Parser Utility
 * Extracts column names and formula names from ThoughtSpot TML files
 * Supports both YAML and JSON-like TML formats
 */

/**
 * Parse TML content and extract all column names from columns section
 * Supports formats like:
 * - columns: { names: "ColumnName" }
 * - columns: [ { names: "ColumnName" } ]
 * - columns:\n  - names: ColumnName
 * @param {string} tmlContent - The TML file content
 * @returns {Array<string>} - Array of column names
 */
export function parseTMLColumns(tmlContent) {
  if (!tmlContent) return [];

  const columns = [];
  
  try {
    const lines = tmlContent.split('\n');
    let inColumnsSection = false;
    let currentIndent = 0;
    let braceDepth = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      const lineIndent = line.length - line.trimStart().length;
      
      // Check if we're entering a columns section
      if (trimmedLine.startsWith('columns:') || trimmedLine.match(/^\s*columns\s*:/)) {
        inColumnsSection = true;
        currentIndent = lineIndent;
        
        // Check for inline format: columns: { names: "..." }
        const inlineMatch = trimmedLine.match(/columns:\s*\{/);
        if (inlineMatch) {
          braceDepth = 1;
        }
        continue;
      }
      
      // Track brace depth for JSON-like format
      if (inColumnsSection) {
        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;
        
        if (braceDepth <= 0 && braceDepth !== 0) {
          inColumnsSection = false;
          continue;
        }
      }
      
      // Check if we're exiting the columns section (another top-level key)
      if (inColumnsSection && braceDepth === 0) {
        if (trimmedLine && lineIndent <= currentIndent && 
            !trimmedLine.startsWith('-') && 
            !trimmedLine.startsWith('names:') &&
            !trimmedLine.match(/^\s*-\s*names:/) &&
            trimmedLine.match(/^\w+:/) &&
            !trimmedLine.includes('columns')) {
          break;
        }
      }
      
      if (inColumnsSection) {
        // Look for names: field in various formats
        // Format 1: names: "ColumnName" or names: ColumnName
        const nameMatch = line.match(/names:\s*(.+)$/);
        if (nameMatch) {
          const namesValue = nameMatch[1].trim();
          
          // Handle array format: names: [col1, col2] or names: ["col1", "col2"]
          if (namesValue.startsWith('[')) {
            const arrayMatch = namesValue.match(/\[(.+)\]/);
            if (arrayMatch) {
              const names = arrayMatch[1]
                .split(',')
                .map(n => n.trim().replace(/^['"]|['"]$/g, ''))
                .filter(n => n);
              columns.push(...names);
            }
          }
          // Handle single quoted string: names: "ColumnName" or names: 'ColumnName'
          else if (namesValue.match(/^["'].+["']$/)) {
            columns.push(namesValue.replace(/^['"]|['"]$/g, ''));
          }
          // Handle unquoted: names: ColumnName
          else if (namesValue && !namesValue.startsWith('{') && !namesValue.startsWith('[')) {
            // Remove trailing commas or other JSON artifacts
            const cleanName = namesValue.replace(/[,}\]]+$/, '').trim();
            if (cleanName) columns.push(cleanName);
          }
        }
        
        // Format 2: - names: ColumnName (list item format)
        if (trimmedLine.startsWith('-') && trimmedLine.includes('names:')) {
          const listMatch = trimmedLine.match(/names:\s*(.+)$/);
          if (listMatch) {
            const name = listMatch[1].trim().replace(/['"]/g, '');
            if (name && !name.startsWith('{')) columns.push(name);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error parsing TML columns:', error);
  }
  
  return [...new Set(columns.filter(c => c && c.length > 0))]; // Remove duplicates and empty
}

/**
 * Parse TML content and extract all formula names from formulas section
 * Supports formats like:
 * - formulas: [ { name: "FormulaName" } ]
 * - formulas:\n  - name: FormulaName
 * @param {string} tmlContent - The TML file content
 * @returns {Array<string>} - Array of formula names
 */
export function parseTMLFormulas(tmlContent) {
  if (!tmlContent) return [];

  const formulas = [];
  
  try {
    const lines = tmlContent.split('\n');
    let inFormulasSection = false;
    let currentIndent = 0;
    let braceDepth = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      const lineIndent = line.length - line.trimStart().length;
      
      // Check if we're entering a formulas section
      if (trimmedLine.startsWith('formulas:') || trimmedLine.match(/^\s*formulas\s*:/)) {
        inFormulasSection = true;
        currentIndent = lineIndent;
        
        // Check for inline format: formulas: { name: "..." }
        const inlineMatch = trimmedLine.match(/formulas:\s*\{/);
        if (inlineMatch) {
          braceDepth = 1;
        }
        continue;
      }
      
      // Track brace depth for JSON-like format
      if (inFormulasSection) {
        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;
        
        if (braceDepth <= 0 && braceDepth !== 0) {
          inFormulasSection = false;
          continue;
        }
      }
      
      // Check if we're exiting the formulas section
      if (inFormulasSection && braceDepth === 0) {
        if (trimmedLine && lineIndent <= currentIndent && 
            !trimmedLine.startsWith('-') && 
            !trimmedLine.startsWith('name:') &&
            !trimmedLine.match(/^\s*-\s*name:/) &&
            trimmedLine.match(/^\w+:/) &&
            !trimmedLine.includes('formulas')) {
          break;
        }
      }
      
      if (inFormulasSection) {
        // Look for name: field
        // Format 1: name: "FormulaName" or name: FormulaName
        const nameMatch = line.match(/name:\s*(.+)$/);
        if (nameMatch) {
          const name = nameMatch[1].trim().replace(/^['"]|['"]$/g, '');
          // Remove trailing commas or other JSON artifacts
          const cleanName = name.replace(/[,}\]]+$/, '').trim();
          if (cleanName && !cleanName.startsWith('{')) formulas.push(cleanName);
        }
        
        // Format 2: - name: FormulaName (list item format)
        if (trimmedLine.startsWith('-') && trimmedLine.includes('name:')) {
          const listMatch = trimmedLine.match(/name:\s*(.+)$/);
          if (listMatch) {
            const name = listMatch[1].trim().replace(/['"]/g, '');
            if (name && !name.startsWith('{')) formulas.push(name);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error parsing TML formulas:', error);
  }
  
  return [...new Set(formulas.filter(f => f && f.length > 0))]; // Remove duplicates and empty
}

/**
 * Parse TML content and extract all column and formula names
 * @param {string} tmlContent - The TML file content
 * @returns {Object} - Object with columns and formulas arrays
 */
export function parseTML(tmlContent) {
  const columns = parseTMLColumns(tmlContent);
  const formulas = parseTMLFormulas(tmlContent);
  
  return {
    columns,
    formulas,
    totalColumns: columns.length,
    totalFormulas: formulas.length,
    allNames: [...columns, ...formulas] // Combined list for validation
  };
}

