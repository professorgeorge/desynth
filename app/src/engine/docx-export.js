// Word (.docx) Manuscript Exporter with Preserved Formatting
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  AlignmentType
} from 'docx';

/**
 * Tokenize a single text line into formatted TextRun components.
 * Handles bold, italics, bold-italics, strikethrough, and inline code.
 */
function parseInlineRuns(line, options = {}) {
  const baseFont = options.baseFont || 'Calibri';
  const baseSize = options.baseSize || 24; // 12pt in half-points
  const baseColor = options.baseColor || '1F2937';

  // Matches ***bold-italic***, **bold**, *italic*, ___bold-italic___, __bold__, _italic_, ~~strike~~, `code`
  const regex = /(\*\*\*[^*]+?\*\*\*|___[^_]+?___|\*\*[^*]+?\*\*|__[^_]+?__|\*[^*]+?\*|_[^_]+?_|~~[^~]+?~~|\x60[^\x60]+?\x60)/g;
  const runs = [];
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIdx) {
      runs.push(new TextRun({
        text: line.slice(lastIdx, match.index),
        font: baseFont,
        size: baseSize,
        color: baseColor
      }));
    }

    const token = match[0];
    if ((token.startsWith('***') && token.endsWith('***')) || (token.startsWith('___') && token.endsWith('___'))) {
      runs.push(new TextRun({
        text: token.slice(3, -3),
        bold: true,
        italics: true,
        font: baseFont,
        size: baseSize,
        color: baseColor
      }));
    } else if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      runs.push(new TextRun({
        text: token.slice(2, -2),
        bold: true,
        font: baseFont,
        size: baseSize,
        color: baseColor
      }));
    } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      runs.push(new TextRun({
        text: token.slice(1, -1),
        italics: true,
        font: baseFont,
        size: baseSize,
        color: baseColor
      }));
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      runs.push(new TextRun({
        text: token.slice(2, -2),
        strike: true,
        font: baseFont,
        size: baseSize,
        color: baseColor
      }));
    } else if (token.startsWith('`') && token.endsWith('`')) {
      runs.push(new TextRun({
        text: token.slice(1, -1),
        font: 'Consolas',
        size: Math.max(18, baseSize - 2),
        shading: { fill: 'F3F4F6' },
        color: '0F172A'
      }));
    }

    lastIdx = match.index + token.length;
  }

  if (lastIdx < line.length) {
    runs.push(new TextRun({
      text: line.slice(lastIdx),
      font: baseFont,
      size: baseSize,
      color: baseColor
    }));
  }

  return runs.length > 0 ? runs : [new TextRun({ text: line, font: baseFont, size: baseSize, color: baseColor })];
}

/**
 * Converts formatted markdown prose into docx Paragraph elements,
 * preserving headings, lists, blockquotes, code blocks, and spacing.
 */
export function convertMarkdownToDocxChildren(markdownText, docOptions = {}) {
  const lines = (markdownText || '').replace(/\r\n/g, '\n').split('\n');
  const children = [];

  let inCodeBlock = false;
  let codeBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check for fenced code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: codeBuffer.join('\n'),
              font: 'Consolas',
              size: 20, // 10pt
              color: '1E293B'
            })
          ],
          shading: { fill: 'F8FAFC' },
          border: {
            top: { color: 'E2E8F0', size: 6, style: BorderStyle.SINGLE },
            bottom: { color: 'E2E8F0', size: 6, style: BorderStyle.SINGLE },
            left: { color: 'CBD5E1', size: 12, style: BorderStyle.SINGLE },
            right: { color: 'E2E8F0', size: 6, style: BorderStyle.SINGLE }
          },
          indent: { left: 360, right: 360 },
          spacing: { before: 140, after: 200, line: 240 }
        }));
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Empty lines create standard paragraph separation
    if (!trimmed) {
      continue;
    }

    // Heading 1 (# ...)
    if (/^#\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^#\s+/, '');
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 140 },
        children: [
          new TextRun({
            text: headingText,
            bold: true,
            size: 34, // 17pt
            font: 'Calibri',
            color: '0F172A'
          })
        ]
      }));
      continue;
    }

    // Heading 2 (## ...)
    if (/^##\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^##\s+/, '');
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 120 },
        children: [
          new TextRun({
            text: headingText,
            bold: true,
            size: 28, // 14pt
            font: 'Calibri',
            color: '1E293B'
          })
        ]
      }));
      continue;
    }

    // Heading 3 (### ...)
    if (/^###\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^###\s+/, '');
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 220, after: 100 },
        children: [
          new TextRun({
            text: headingText,
            bold: true,
            size: 26, // 13pt
            font: 'Calibri',
            color: '334155'
          })
        ]
      }));
      continue;
    }

    // Heading 4 (#### ...)
    if (/^####\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^####\s+/, '');
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 180, after: 80 },
        children: [
          new TextRun({
            text: headingText,
            bold: true,
            italics: true,
            size: 24, // 12pt
            font: 'Calibri',
            color: '475569'
          })
        ]
      }));
      continue;
    }

    // Horizontal Rule (---, ***, ___)
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      children.push(new Paragraph({
        spacing: { before: 200, after: 200 },
        border: {
          bottom: { color: 'CBD5E1', size: 6, style: BorderStyle.SINGLE }
        }
      }));
      continue;
    }

    // Blockquote (> ...)
    if (/^>\s*/.test(trimmed)) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      const runs = parseInlineRuns(quoteText, { baseSize: 22, baseColor: '334155' });
      runs.forEach(r => { r.italics = true; });
      children.push(new Paragraph({
        indent: { left: 540 },
        border: {
          left: { color: '94A3B8', size: 18, style: BorderStyle.SINGLE, space: 14 }
        },
        spacing: { before: 120, after: 140, line: 300 },
        children: runs
      }));
      continue;
    }

    // Bullet Lists (- ..., * ..., + ...)
    if (/^[-*+]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*+]\s+/, '');
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 60, after: 60, line: 280 },
        children: parseInlineRuns(itemText)
      }));
      continue;
    }

    // Numbered Lists (1. ..., 2. ...)
    if (/^\d+\.\s+/.test(trimmed)) {
      const matchNum = trimmed.match(/^(\d+\.)\s+(.*)$/);
      const prefix = matchNum ? matchNum[1] + ' ' : '';
      const itemContent = matchNum ? matchNum[2] : trimmed;
      children.push(new Paragraph({
        indent: { left: 400 },
        spacing: { before: 60, after: 60, line: 280 },
        children: [
          new TextRun({ text: prefix, bold: true, color: '475569', font: 'Calibri', size: 24 }),
          ...parseInlineRuns(itemContent)
        ]
      }));
      continue;
    }

    // Standard body paragraph
    children.push(new Paragraph({
      spacing: {
        before: 60,
        after: 160,
        line: 300 // 1.25x line spacing
      },
      children: parseInlineRuns(rawLine)
    }));
  }

  // Handle unclosed code block if file ends abruptly
  if (inCodeBlock && codeBuffer.length > 0) {
    children.push(new Paragraph({
      children: [
        new TextRun({
          text: codeBuffer.join('\n'),
          font: 'Consolas',
          size: 20,
          color: '1E293B'
        })
      ],
      shading: { fill: 'F8FAFC' },
      spacing: { before: 140, after: 200 }
    }));
  }

  // If input was empty or whitespace
  if (children.length === 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Humanized manuscript', font: 'Calibri', size: 24 })]
    }));
  }

  return children;
}

/**
 * Generates and triggers download of a styled Word (.docx) document
 * with typography, headings, lists, quotes, and metadata preserved.
 */
export async function downloadProseAsDocx(markdownText, options = {}) {
  const title = options.title || 'Humanized Manuscript';
  const author = options.author || 'Desynth Cognitive Engine';
  const fileName = options.fileName || 'humanized-manuscript.docx';
  const treatment = options.treatment || 'Full Fidelity Polish';

  const children = convertMarkdownToDocxChildren(markdownText, options);

  const doc = new Document({
    creator: author,
    title: title,
    description: `Humanized prose sanitized with ${treatment}. Formatted in genuine human cadence.`,
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 24, // 12pt
            color: '1F2937'
          },
          paragraph: {
            spacing: {
              line: 300,
              after: 160
            }
          }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch (1440 twips)
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children: children
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
