// File Parser Utility for Plain Text, Markdown, Word (.docx), and PDF (.pdf)

import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure PDF.js worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

/**
 * Parses an uploaded file into plain text string.
 * Supports: .txt, .md, .docx, .pdf
 * @param {File} file 
 * @returns {Promise<{ text: string, fileName: string, fileType: string, words: number }>}
 */
export async function extractTextFromFile(file) {
  if (!file) {
    throw new Error('No file provided');
  }

  const fileName = file.name || 'document';
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  // 1. Plain Text and Markdown
  if (ext === 'txt' || ext === 'md' || ext === 'text' || ext === 'markdown') {
    const text = await readAsPlainText(file);
    return formatResult(text, fileName, ext);
  }

  // 2. Microsoft Word (.docx)
  if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value || '';
    if (!text.trim()) {
      throw new Error(`The Word document "${fileName}" appears to be empty or contains only non-text media.`);
    }
    return formatResult(text, fileName, 'docx');
  }

  // Legacy .doc warning
  if (ext === 'doc') {
    throw new Error(`Legacy binary .doc files are not supported. Please save as modern .docx or export to .pdf / .txt.`);
  }

  // 3. PDF (.pdf)
  if (ext === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const text = await extractTextFromPdf(arrayBuffer);
    if (!text.trim()) {
      throw new Error(`The PDF "${fileName}" contains no extractable text (it may be a scanned image or protected).`);
    }
    return formatResult(text, fileName, 'pdf');
  }

  // Fallback: try reading as plain text
  try {
    const text = await readAsPlainText(file);
    return formatResult(text, fileName, ext || 'unknown');
  } catch (err) {
    throw new Error(`Unsupported file type ".${ext}". Please upload .txt, .md, .docx, or .pdf files.`);
  }
}

function readAsPlainText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result || '');
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.readAsText(file);
  });
}

async function extractTextFromPdf(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false,
    useSystemFonts: true
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pagesText = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageStrings = content.items.map(item => item.str || '').filter(Boolean);
    pagesText.push(pageStrings.join(' '));
  }

  return pagesText.join('\n\n');
}

function formatResult(rawText, fileName, fileType) {
  // Normalize line endings and multiple excessive empty lines
  const clean = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;

  return {
    text: clean,
    fileName,
    fileType,
    words
  };
}
