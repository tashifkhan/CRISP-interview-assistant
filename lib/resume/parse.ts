import * as pdfjsLib from 'pdfjs-dist';
// Ensure workerSrc is set (necessary in browser bundlers when using dynamic parsing)
if (typeof window !== 'undefined' && (pdfjsLib as { GlobalWorkerOptions?: { workerSrc?: string } }).GlobalWorkerOptions) {
  const globalWorkerOptions = (pdfjsLib as { GlobalWorkerOptions?: { workerSrc?: string } }).GlobalWorkerOptions;
  const worker = globalWorkerOptions?.workerSrc;
  if (!worker) {
    // Use unpkg CDN fallback or local copy (could later copy into /public)
    (pdfjsLib as { GlobalWorkerOptions: { workerSrc: string }; version?: string }).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${(pdfjsLib as { version?: string }).version || '4.4.168'}/build/pdf.worker.min.js`;
  }
}
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
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = (pdfjsLib as { getDocument: (config: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (num: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str?: string }> }> }> }> } }).getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it: { str?: string }) => (it.str || '')).join(' ') + '\n';
    }
    const entities = extractEntities(text);
    return { rawText: text, ...entities };
  } catch (e: unknown) {
    console.error('PDF parsing error:', e);
    return { rawText: '', name: undefined, email: undefined, phone: undefined };
  }
}

export async function parseDocx(file: File): Promise<ParsedResumeData> {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  const entities = extractEntities(value);
  return { rawText: value, ...entities };
}
