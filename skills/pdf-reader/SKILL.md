---
name: pdf-reader
description: Read and extract content from PDF files. Use this when user sends a PDF file or asks to read/analyze/understand PDF content.
metadata:
  openclaw:
    emoji: "\U0001F4C4"
    requires:
      bins: []
user-invocable: true
disable-model-invocation: false
---

# PDF Reader Skill

This skill enables reading and understanding PDF document content.

## When to Use

- User sends a PDF file (.pdf)
- User asks to read, extract, or analyze a PDF document
- User wants to understand content from a PDF file
- User asks questions about PDF content

## How to Read PDF

When a PDF file is provided, read it using the available file reading tools:

1. Use the Read tool to directly read the PDF file
2. Extract text content and structure from the PDF
3. Analyze and understand the content

## Output Format

After reading the PDF, provide:

1. **Document Overview**
   - Title/subject (if identifiable)
   - Page count
   - Document type (article, report, book, etc.)

2. **Key Content**
   - Main points and summary
   - Important sections or chapters
   - Key findings or conclusions

3. **Detailed Analysis** (if requested)
   - Section-by-section breakdown
   - Important data, statistics, or quotes
   - Structure and organization

4. **Answer Questions** (if user asks specific questions)
   - Provide specific information from the PDF
   - Reference page numbers when applicable

## Best Practices

- Preserve the original structure and formatting when describing content
- Use markdown formatting for readability
- Extract and preserve tables, lists, and headers
- Note any images or figures with descriptions
- If the PDF contains multiple pages, summarize by sections
- For academic papers, highlight methodology, results, and conclusions
- For reports, focus on executive summaries and key findings

## Limitations

- Scanned PDFs may have limited text extraction
- Some complex layouts may not preserve perfect structure
- Handwritten text may not be readable
- Encrypted/password-protected PDFs cannot be read

## Example Interactions

**User**: "Read this PDF file: report.pdf"
**Response**: Provide structured summary and key findings from the PDF

**User**: "What does the PDF say about X?"
**Response**: Extract specific information related to X from the PDF content

**User**: "Summarize the main points"
**Response**: Provide bullet-point summary of main points from the PDF
