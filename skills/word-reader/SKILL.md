---
name: word-reader
description: Read and extract content from Word documents (.doc, .docx). Use this when user sends a Word file or asks to read/analyze/understand Word document content.
metadata:
  openclaw:
    emoji: "\U0001F4C4"
    requires:
      bins: []
user-invocable: true
disable-model-invocation: false
---

# Word Reader Skill

This skill enables reading and understanding Microsoft Word document content.

## When to Use

- User sends a Word file (.doc, .docx)
- User asks to read, extract, or analyze a Word document
- User wants to understand content from a Word file
- User asks questions about Word document content

## How to Read Word Documents

When a Word file is provided, read it using the available file reading tools:

1. Use the Read tool to directly read the Word document
2. Extract text content and structure from the document
3. Analyze and understand the content

## Output Format

After reading the Word document, provide:

1. **Document Overview**
   - Title (if identifiable)
   - Estimated word/page count
   - Document type (essay, report, letter, resume, etc.)
   - Author information (if available in metadata)

2. **Key Content**
   - Main points and summary
   - Important sections (headings, chapters)
   - Key findings, conclusions, or arguments

3. **Document Structure** (if applicable)
   - Heading hierarchy
   - Lists and bullet points
   - Tables and their content
   - Images or embedded objects (with descriptions)

4. **Detailed Analysis** (if requested)
   - Section-by-section breakdown
   - Important data, statistics, or quotes
   - Formatting and styling notes

5. **Answer Questions** (if user asks specific questions)
   - Provide specific information from the document
   - Reference sections when applicable

## Best Practices

- Preserve the original document structure (headings, lists, tables)
- Use markdown formatting that mirrors Word formatting
- Extract and preserve tables with proper formatting
- Note track changes or comments if present
- For resumes, highlight key sections (experience, education, skills)
- For academic papers, focus on abstract, methodology, results, and conclusions
- For business documents, highlight key metrics, recommendations, and action items
- Preserve formatting like bold, italic, and underline when relevant

## Supported Formats

- `.docx` - Office Open XML format (preferred, full support)
- `.doc` - Legacy Word format (readable, but may have limitations)

## Limitations

- Complex layouts may not preserve perfect structure
- Embedded objects (charts, SmartArt) may not render fully
- Some advanced formatting features may not be preserved
- Password-protected documents cannot be read
- Very large documents may need to be processed in sections
- Headers and footers may not be captured

## Example Interactions

**User**: "Read this Word file: report.docx"
**Response**: Provide structured summary and key findings from the document

**User**: "What does the document say about X?"
**Response**: Extract specific information related to X from the document content

**User**: "Summarize the main points"
**Response**: Provide bullet-point summary of main points from the document

**User**: "Extract the data from the tables"
**Response**: Format and present all table data in markdown tables

**User**: "What's the structure of this document?"
**Response**: Outline the heading hierarchy and document organization
