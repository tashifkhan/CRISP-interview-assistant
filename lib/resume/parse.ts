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
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

// Enhanced interface with more structured data
export interface ParsedResumeData {
  rawText: string;
  name?: string;
  email?: string;
  phone?: string;
  experience?: string[];
  skills?: string[];
  education?: string[];
  summary?: string;
  location?: string;
  linkedIn?: string;
  github?: string;
  extractionMethod?: 'gemini' | 'fallback';
}

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_REGEX = /\+?\d?[\s.-]?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/;

// Schema for Gemini structured output
const resumeSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  experience: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  summary: z.string().optional(),
  location: z.string().optional(),
  linkedIn: z.string().optional(),
  github: z.string().optional(),
});

const resumeParser = StructuredOutputParser.fromZodSchema(resumeSchema);

const resumePrompt = new PromptTemplate({
  template: `Extract structured information from this resume text. Return a JSON object with the following fields:
- name: Full name of the person
- email: Email address
- phone: Phone number
- experience: Array of work experience entries (company, role, duration)
- skills: Array of technical skills
- education: Array of educational qualifications
- summary: Brief professional summary (2-3 sentences)
- location: Current location/address
- linkedIn: LinkedIn profile URL if mentioned
- github: GitHub profile URL if mentioned

Resume text:
{resumeText}

Format: {format}`,
  inputVariables: ['resumeText'],
  partialVariables: { format: resumeParser.getFormatInstructions() }
});

function makeChatModel() {
  if (!process.env.GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.CRISP_GEMINI_MODEL || 'gemini-1.5-flash',
    temperature: 0.1, // Low temperature for structured extraction
  });
}

// Gemini-based resume parsing
async function parseResumeWithGemini(text: string): Promise<Partial<ParsedResumeData>> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not available');
    }

    const model = makeChatModel();
    const chain = resumePrompt.pipe(model).pipe(resumeParser);
    
    const result = await chain.invoke({ resumeText: text });
    
    return {
      ...result,
      extractionMethod: 'gemini' as const,
    };
  } catch (error) {
    console.error('Gemini resume parsing failed:', error);
    throw error;
  }
}

// Fallback extraction using regex patterns
function extractEntities(text: string): Partial<ParsedResumeData> {
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
  
  // Basic skill extraction (common tech keywords)
  const skillKeywords = ['javascript', 'typescript', 'react', 'node', 'python', 'java', 'sql', 'aws', 'docker', 'kubernetes', 'git'];
  const textLower = text.toLowerCase();
  const skills = skillKeywords.filter(skill => textLower.includes(skill));
  
  return { 
    name, 
    email, 
    phone, 
    skills: skills.length > 0 ? skills : undefined,
    extractionMethod: 'fallback' as const 
  };
}

// Save resume data to local storage
function saveResumeToLocalStorage(resumeData: ParsedResumeData) {
  if (typeof window !== 'undefined') {
    try {
      const storageKey = 'parsed_resume_data';
      const dataToStore = {
        ...resumeData,
        savedAt: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      console.log('Resume data saved to local storage');
    } catch (error) {
      console.error('Failed to save resume data to local storage:', error);
    }
  }
}

// Load resume data from local storage
export function loadResumeFromLocalStorage(): ParsedResumeData | null {
  if (typeof window !== 'undefined') {
    try {
      const storageKey = 'parsed_resume_data';
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error('Failed to load resume data from local storage:', error);
    }
  }
  return null;
}

// Clear resume data from local storage
export function clearResumeFromLocalStorage(): void {
  if (typeof window !== 'undefined') {
    try {
      const storageKey = 'parsed_resume_data';
      localStorage.removeItem(storageKey);
      console.log('Resume data cleared from local storage');
    } catch (error) {
      console.error('Failed to clear resume data from local storage:', error);
    }
  }
}

// Main function to parse any supported resume file type
export async function parseResume(file: File): Promise<ParsedResumeData> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    return await parsePdf(file);
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    return await parseDocx(file);
  } else {
    throw new Error(`Unsupported file type: ${fileName}. Please upload a PDF or DOCX file.`);
  }
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
    
    let resumeData: ParsedResumeData = { rawText: text };
    
    // Try Gemini first, fallback to regex extraction
    try {
      const geminiData = await parseResumeWithGemini(text);
      resumeData = { ...resumeData, ...geminiData };
    } catch (geminiError) {
      console.warn('Gemini parsing failed, using fallback:', geminiError);
      const fallbackData = extractEntities(text);
      resumeData = { ...resumeData, ...fallbackData };
    }
    
    // Save to local storage
    saveResumeToLocalStorage(resumeData);
    
    return resumeData;
  } catch (e: unknown) {
    console.error('PDF parsing error:', e);
    const fallbackData: ParsedResumeData = { 
      rawText: '', 
      extractionMethod: 'fallback' as const 
    };
    return fallbackData;
  }
}

export async function parseDocx(file: File): Promise<ParsedResumeData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    
    let resumeData: ParsedResumeData = { rawText: value };
    
    // Try Gemini first, fallback to regex extraction
    try {
      const geminiData = await parseResumeWithGemini(value);
      resumeData = { ...resumeData, ...geminiData };
    } catch (geminiError) {
      console.warn('Gemini parsing failed, using fallback:', geminiError);
      const fallbackData = extractEntities(value);
      resumeData = { ...resumeData, ...fallbackData };
    }
    
    // Save to local storage
    saveResumeToLocalStorage(resumeData);
    
    return resumeData;
  } catch (e: unknown) {
    console.error('DOCX parsing error:', e);
    const fallbackData: ParsedResumeData = { 
      rawText: '', 
      extractionMethod: 'fallback' as const 
    };
    return fallbackData;
  }
}
