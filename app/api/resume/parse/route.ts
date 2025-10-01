import { NextResponse } from 'next/server';
import { parseResumeFileGemini, parseResumeFromTextGemini } from '@/lib/ai/provider';
import mammoth from 'mammoth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
    }

    // @ts-ignore - Next.js File from formData has arrayBuffer
    const arrayBuffer: ArrayBuffer = await file.arrayBuffer();
    // @ts-ignore - Next.js File has type property
    const mimeType: string = file.type || 'application/octet-stream';

    const bytes = new Uint8Array(arrayBuffer);

    let parsed;
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword' || file instanceof File && (file.name?.toLowerCase?.().endsWith('.docx') || file.name?.toLowerCase?.().endsWith('.doc'))) {
      // Extract raw text from DOCX/DOC and send text to Gemini
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      parsed = await parseResumeFromTextGemini(value);
    } else if (mimeType === 'application/pdf' || file instanceof File && file.name?.toLowerCase?.().endsWith('.pdf')) {
      parsed = await parseResumeFileGemini({ bytes, mimeType: 'application/pdf' });
    } else {
      // Try bytes path by default
      parsed = await parseResumeFileGemini({ bytes, mimeType });
    }

    return NextResponse.json({ success: true, resume: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


