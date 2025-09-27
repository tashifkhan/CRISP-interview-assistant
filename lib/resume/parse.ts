import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

export interface ParsedResumeData {
  rawText: string;
  name?: string;
  email?: string;
  phone?: string;
}

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_REGEX = /\+?\d?[\s.-]?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/;

function extractEntities(text: string) {
  const email = text.match(EMAIL_REGEX)?.[0];
  const phone = text.match(PHONE_REGEX)?.[0];
  // Naive name heuristic: first line with 2-4 capitalized words, length < 60
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  let name: string | undefined;
  for (const line of lines) {
    if (/^[A-Z][A-Za-z]+(\s+[A-Z][A-Za-z.'-]+){1,3}$/.test(line) && line.length < 60) {
      name = line;
      break;
    }
  }
  return { name, email, phone };
}

export async function parsePdf(file: File): Promise<ParsedResumeData> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => (it.str || '')).join(' ') + '\n';
  }
  const entities = extractEntities(text);
  return { rawText: text, ...entities };
}

export async function parseDocx(file: File): Promise<ParsedResumeData> {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  const entities = extractEntities(value);
  return { rawText: value, ...entities };
}
