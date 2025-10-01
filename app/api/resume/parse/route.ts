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

    // Read binary contents
    const blob: Blob = file as unknown as Blob;
    const arrayBuffer: ArrayBuffer = await blob.arrayBuffer();
    const mimeType: string = (file as any).type || 'application/octet-stream';
    const filename: string = (file as any).name || '';

    const bytes = new Uint8Array(arrayBuffer);

    let parsed;
    const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword' || filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc');
    if (isDocx) {
      // Extract raw text from DOCX/DOC and send text to Gemini
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
      parsed = await parseResumeFromTextGemini(value);
    } else if (mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
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


