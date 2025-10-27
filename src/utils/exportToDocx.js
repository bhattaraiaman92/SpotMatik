import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Export analysis results to DOCX format
 */
export async function exportToDocx(results, fileName = 'spotter-optimization-report.docx') {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: 'Spotter Model Optimization Report',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          
          new Paragraph({
            text: `Generated: ${new Date().toLocaleString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 }
          }),

          // Model Overview Section
          new Paragraph({
            text: 'Model Overview',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Industry: ', bold: true }),
              new TextRun(results.industry || 'N/A')
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Business Function: ', bold: true }),
              new TextRun(results.businessFunction || 'N/A')
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Model Purpose: ', bold: true }),
              new TextRun(results.modelPurpose || 'N/A')
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Total Columns: ', bold: true }),
              new TextRun(results.totalColumns?.toString() || '0')
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Columns Requiring Attention: ', bold: true }),
              new TextRun(results.columnsNeedingAttention?.toString() || '0')
            ],
            spacing: { after: 300 }
          }),

          // Statistics
          ...(results.statistics ? [
            new Paragraph({
              text: 'Summary Statistics',
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Missing Descriptions: ', bold: true }),
                new TextRun(results.statistics.missingDescriptions?.toString() || '0')
              ],
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Abbreviated Names: ', bold: true }),
                new TextRun(results.statistics.abbreviatedNames?.toString() || '0')
              ],
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Needing Synonyms: ', bold: true }),
                new TextRun(results.statistics.needingSynonyms?.toString() || '0')
              ],
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Estimated Impact: ', bold: true }),
                new TextRun(results.statistics.impactLevel || 'N/A')
              ],
              spacing: { after: 300 }
            })
          ] : []),

          // Industry Context
          ...(results.industryContext ? [
            new Paragraph({
              text: 'Industry Context',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
              text: results.industryContext,
              spacing: { after: 300 }
            })
          ] : []),

          // Model-Level Recommendations
          new Paragraph({
            text: 'Model-Level Recommendations',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            text: 'Model Description',
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Current: ', bold: true, italics: true }),
              new TextRun({ text: results.modelDescription?.current || 'None', italics: true })
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Recommended: ', bold: true }),
              new TextRun(results.modelDescription?.recommended || 'N/A')
            ],
            spacing: { after: 200 }
          }),

          // Model Instructions
          ...(results.modelInstructions && results.modelInstructions.length > 0 ? [
            new Paragraph({
              text: 'Model Instructions (Universal Rules)',
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 }
            }),
            ...results.modelInstructions.map((instruction, idx) => 
              new Paragraph({
                text: `${idx + 1}. ${instruction}`,
                spacing: { after: 100 }
              })
            )
          ] : []),

          // Quick Wins
          ...(results.quickWins && results.quickWins.length > 0 ? [
            new Paragraph({
              text: 'Quick Wins',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            ...results.quickWins.map((win, idx) => 
              new Paragraph({
                text: `${idx + 1}. ${win}`,
                spacing: { after: 100 }
              })
            )
          ] : []),

          // Column Recommendations - Critical
          ...(results.columnRecommendations?.critical && results.columnRecommendations.critical.length > 0 ? [
            new Paragraph({
              text: 'CRITICAL Priority - Do First',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            ...results.columnRecommendations.critical.flatMap(col => [
              new Paragraph({
                text: col.columnName,
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Issue: ', bold: true }),
                  new TextRun(col.issue)
                ],
                spacing: { after: 100 }
              }),
              ...(col.recommendations.name ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Recommended Name: ', bold: true }),
                    new TextRun(col.recommendations.name)
                  ],
                  spacing: { after: 100 }
                })
              ] : []),
              ...(col.recommendations.description ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Description: ', bold: true }),
                    new TextRun(col.recommendations.description)
                  ],
                  spacing: { after: 100 }
                })
              ] : []),
              ...(col.recommendations.synonyms && col.recommendations.synonyms.length > 0 ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Suggested Synonyms: ', bold: true }),
                    new TextRun(col.recommendations.synonyms.join(', '))
                  ],
                  spacing: { after: 100 }
                })
              ] : []),
              ...(col.recommendations.rationale ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Why This Matters: ', bold: true, italics: true }),
                    new TextRun({ text: col.recommendations.rationale, italics: true })
                  ],
                  spacing: { after: 200 }
                })
              ] : [])
            ])
          ] : []),

          // Column Recommendations - Important
          ...(results.columnRecommendations?.important && results.columnRecommendations.important.length > 0 ? [
            new Paragraph({
              text: 'IMPORTANT Priority - Do Soon',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            ...results.columnRecommendations.important.flatMap(col => [
              new Paragraph({
                text: col.columnName,
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Issue: ', bold: true }),
                  new TextRun(col.issue)
                ],
                spacing: { after: 100 }
              }),
              ...(col.recommendations.name ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Recommended Name: ', bold: true }),
                    new TextRun(col.recommendations.name)
                  ],
                  spacing: { after: 100 }
                })
              ] : []),
              ...(col.recommendations.description ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Description: ', bold: true }),
                    new TextRun(col.recommendations.description)
                  ],
                  spacing: { after: 100 }
                })
              ] : []),
              ...(col.recommendations.synonyms && col.recommendations.synonyms.length > 0 ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Suggested Synonyms: ', bold: true }),
                    new TextRun(col.recommendations.synonyms.join(', '))
                  ],
                  spacing: { after: 100 }
                })
              ] : []),
              ...(col.recommendations.rationale ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Why This Matters: ', bold: true, italics: true }),
                    new TextRun({ text: col.recommendations.rationale, italics: true })
                  ],
                  spacing: { after: 200 }
                })
              ] : [])
            ])
          ] : []),

          // Column Recommendations - Nice to Have
          ...(results.columnRecommendations?.niceToHave && results.columnRecommendations.niceToHave.length > 0 ? [
            new Paragraph({
              text: 'NICE TO HAVE Priority - When Time Permits',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            ...results.columnRecommendations.niceToHave.flatMap(col => [
              new Paragraph({
                text: col.columnName,
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Issue: ', bold: true }),
                  new TextRun(col.issue)
                ],
                spacing: { after: 100 }
              }),
              ...(col.recommendations.name ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Recommended Name: ', bold: true }),
                    new TextRun(col.recommendations.name)
                  ],
                  spacing: { after: 100 }
                })
              ] : []),
              ...(col.recommendations.description ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Description: ', bold: true }),
                    new TextRun(col.recommendations.description)
                  ],
                  spacing: { after: 100 }
                })
              ] : []),
              ...(col.recommendations.synonyms && col.recommendations.synonyms.length > 0 ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Suggested Synonyms: ', bold: true }),
                    new TextRun(col.recommendations.synonyms.join(', '))
                  ],
                  spacing: { after: 100 }
                })
              ] : []),
              ...(col.recommendations.rationale ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Why This Matters: ', bold: true, italics: true }),
                    new TextRun({ text: col.recommendations.rationale, italics: true })
                  ],
                  spacing: { after: 200 }
                })
              ] : [])
            ])
          ] : []),

          // Comparison Table
          ...(results.comparisonTable && results.comparisonTable.length > 0 ? [
            new Paragraph({
              text: 'Current vs Recommended Comparison',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            createComparisonTable(results.comparisonTable)
          ] : [])
        ]
      }]
    });

    // Generate and download the document
    const blob = await Packer.toBlob(doc);
    saveAs(blob, fileName);
    
    return true;
  } catch (error) {
    console.error('Error exporting to DOCX:', error);
    throw error;
  }
}

/**
 * Create comparison table for DOCX
 */
function createComparisonTable(comparisonData) {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: 'Priority', bold: true })],
        width: { size: 12, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Current Name', bold: true })],
        width: { size: 15, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Recommended Name', bold: true })],
        width: { size: 15, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Current Description', bold: true })],
        width: { size: 19, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Recommended Description', bold: true })],
        width: { size: 19, type: WidthType.PERCENTAGE }
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Recommended Synonyms', bold: true })],
        width: { size: 20, type: WidthType.PERCENTAGE }
      })
    ]
  });

  const dataRows = comparisonData.map(row => 
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: row.priority || 'N/A' })]
        }),
        new TableCell({
          children: [new Paragraph({ text: row.currentName || 'N/A' })]
        }),
        new TableCell({
          children: [new Paragraph({ text: row.recommendedName || 'N/A' })]
        }),
        new TableCell({
          children: [new Paragraph({ 
            text: row.currentDescription === 'None' || !row.currentDescription 
              ? 'Missing' 
              : row.currentDescription 
          })]
        }),
        new TableCell({
          children: [new Paragraph({ text: row.recommendedDescription || 'N/A' })]
        }),
        new TableCell({
          children: [new Paragraph({ 
            text: Array.isArray(row.recommendedSynonyms) 
              ? row.recommendedSynonyms.join(', ') 
              : 'N/A' 
          })]
        })
      ]
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 }
    }
  });
}

