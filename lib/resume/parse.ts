import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { configurePdfWorker, resetPdfWorker } from './pdf-setup';

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
  template: `You are an expert resume parser. Extract comprehensive structured information from this resume text. 

Return a JSON object with the following fields (extract as much detail as possible):

- name: Full name of the person
- email: Email address  
- phone: Phone number (format consistently)
- experience: Array of work experience entries - for each job include "Company Name | Job Title | Duration | Key responsibilities/achievements"
- skills: Array of ALL technical skills mentioned (programming languages, frameworks, tools, technologies, databases, cloud platforms, etc.)
- education: Array of educational qualifications including "Institution | Degree | Field of Study | Year/Duration"
- summary: Comprehensive professional summary highlighting key strengths and expertise (3-4 sentences)
- location: Current location/address/city
- linkedIn: LinkedIn profile URL if mentioned
- github: GitHub profile URL or username if mentioned

Be thorough in extracting skills - look for:
- Programming languages (JavaScript, Python, Java, etc.)
- Frameworks and libraries (React, Node.js, Express, etc.)
- Databases (MySQL, MongoDB, PostgreSQL, etc.)
- Cloud platforms (AWS, Azure, GCP, etc.)
- Tools and technologies (Docker, Kubernetes, Git, etc.)
- Methodologies (Agile, Scrum, etc.)

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

// Gemini-based resume parsing with enhanced extraction
async function parseResumeWithGemini(text: string): Promise<Partial<ParsedResumeData>> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not available');
    }

    const model = makeChatModel();
    const chain = resumePrompt.pipe(model).pipe(resumeParser);
    
    const result = await chain.invoke({ resumeText: text });
    
    // Enhance the result with better structured data
    const enhanced = {
      ...result,
      extractionMethod: 'gemini' as const,
    };

    // Ensure arrays are properly formatted
    if (result.skills && !Array.isArray(result.skills)) {
      enhanced.skills = [result.skills].flat();
    }
    if (result.experience && !Array.isArray(result.experience)) {
      enhanced.experience = [result.experience].flat();
    }
    if (result.education && !Array.isArray(result.education)) {
      enhanced.education = [result.education].flat();
    }

    return enhanced;
  } catch (error) {
    console.error('Gemini resume parsing failed:', error);
    throw error;
  }
}

// Enhanced fallback extraction using regex patterns
function extractEntities(text: string): Partial<ParsedResumeData> {
  const email = text.match(EMAIL_REGEX)?.[0];
  const phone = text.match(PHONE_REGEX)?.[0];
  
  // Enhanced name heuristic: first line with 2-4 capitalized words, length < 60
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  let name: string | undefined;
  for (const line of lines) {
    if (/^[A-Z][A-Za-z]+(\s+[A-Z][A-Za-z.'-]+){1,3}$/.test(line) && line.length < 60) {
      name = line;
      break;
    }
  }
  
  // Enhanced skill extraction with more comprehensive keywords
  const skillKeywords = [
    // Programming Languages
    'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'kotlin', 'swift',
    'php', 'ruby', 'scala', 'r', 'matlab', 'perl', 'dart', 'elixir', 'clojure',
    
    // Frontend
    'react', 'vue', 'angular', 'svelte', 'jquery', 'bootstrap', 'tailwind', 'css', 'html', 'sass', 'less',
    
    // Backend
    'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net', 'fastapi',
    
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite', 'oracle', 'cassandra',
    'dynamodb', 'firebase', 'supabase',
    
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'github actions',
    'circleci', 'gitlab ci', 'ansible', 'puppet', 'chef',
    
    // Tools & Technologies
    'git', 'webpack', 'vite', 'npm', 'yarn', 'pip', 'gradle', 'maven', 'linux', 'bash',
    'nginx', 'apache', 'graphql', 'rest api', 'microservices', 'websockets',
    
    // AI/ML
    'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'jupyter', 'machine learning',
    'deep learning', 'neural networks', 'ai', 'nlp', 'computer vision'
  ];
  
  const textLower = text.toLowerCase();
  const skills = skillKeywords.filter(skill => textLower.includes(skill.toLowerCase()));
  
  // Extract location (look for common location patterns)
  const locationMatch = text.match(/(?:Location|Address|Based in|Located in)[:\s]*([A-Za-z\s,]+?)(?:\n|$)/i);
  const location = locationMatch?.[1]?.trim();
  
  // Extract LinkedIn profile
  const linkedInMatch = text.match(/(?:linkedin\.com\/in\/|linkedin:)\s*([A-Za-z0-9\-_]+)/i);
  const linkedIn = linkedInMatch?.[0];
  
  // Extract GitHub profile
  const githubMatch = text.match(/(?:github\.com\/|github:)\s*([A-Za-z0-9\-_]+)/i);
  const github = githubMatch?.[0];
  
  // Try to extract a basic summary from the first few lines
  const summaryLines = lines.slice(0, 10).filter(line => 
    line.length > 50 && 
    !EMAIL_REGEX.test(line) && 
    !PHONE_REGEX.test(line) &&
    !/^[A-Z][A-Za-z]+(\s+[A-Z][A-Za-z.'-]+){1,3}$/.test(line)
  );
  const summary = summaryLines[0]?.substring(0, 200);
  
  return { 
    name, 
    email, 
    phone, 
    skills: skills.length > 0 ? skills : undefined,
    location,
    linkedIn,
    github,
    summary,
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
    // Ensure PDF worker is configured
    const workerConfigured = configurePdfWorker();
    if (!workerConfigured) {
      console.warn('PDF worker configuration failed, proceeding anyway...');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    if (!pdf) {
      throw new Error('Failed to load PDF document');
    }
    
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items
        .map((item: any) => {
          // Handle both TextItem and TextMarkedContent
          if (item && typeof item === 'object' && 'str' in item) {
            return item.str || '';
          }
          return '';
        })
        .join(' ') + '\n';
    }
    
    let resumeData: ParsedResumeData = { rawText: text };
    
    // Always try Gemini first with more retries if available
    if (process.env.GEMINI_API_KEY) {
      let geminiSuccess = false;
      let retries = 3;
      
      while (retries > 0 && !geminiSuccess) {
        try {
          const geminiData = await parseResumeWithGemini(text);
          resumeData = { ...resumeData, ...geminiData };
          geminiSuccess = true;
          console.log('Successfully parsed resume with Gemini AI');
        } catch (geminiError) {
          retries--;
          console.warn(`Gemini parsing attempt failed (${3 - retries}/3):`, geminiError);
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }
      
      // If Gemini still fails after retries, use fallback
      if (!geminiSuccess) {
        console.warn('Gemini parsing failed after all retries, using fallback');
        const fallbackData = extractEntities(text);
        resumeData = { ...resumeData, ...fallbackData };
      }
    } else {
      console.warn('GEMINI_API_KEY not found, using fallback extraction');
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
    
    // Always try Gemini first with more retries if available
    if (process.env.GEMINI_API_KEY) {
      let geminiSuccess = false;
      let retries = 3;
      
      while (retries > 0 && !geminiSuccess) {
        try {
          const geminiData = await parseResumeWithGemini(value);
          resumeData = { ...resumeData, ...geminiData };
          geminiSuccess = true;
          console.log('Successfully parsed resume with Gemini AI');
        } catch (geminiError) {
          retries--;
          console.warn(`Gemini parsing attempt failed (${3 - retries}/3):`, geminiError);
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }
      
      // If Gemini still fails after retries, use fallback
      if (!geminiSuccess) {
        console.warn('Gemini parsing failed after all retries, using fallback');
        const fallbackData = extractEntities(value);
        resumeData = { ...resumeData, ...fallbackData };
      }
    } else {
      console.warn('GEMINI_API_KEY not found, using fallback extraction');
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
