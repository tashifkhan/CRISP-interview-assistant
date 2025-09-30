// Separate PDF.js setup utility
import * as pdfjsLib from 'pdfjs-dist';

let isConfigured = false;

export function configurePdfWorker(): boolean {
  if (typeof window === 'undefined') {
    // Server-side rendering - no worker needed
    return false;
  }

  if (isConfigured) {
    return true;
  }

  try {
    // Use CDN worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    isConfigured = true;
    console.log('✅ PDF.js configured with CDN worker');
    return true;
  } catch (error) {
    console.warn('❌ CDN worker setup failed:', error);
  }

  try {
    // Method 3: Disable worker (fake worker - runs in main thread)
    pdfjsLib.GlobalWorkerOptions.workerPort = null;
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    isConfigured = true;
    console.log('✅ PDF.js configured without worker (main thread)');
    return true;
  } catch (error) {
    console.error('❌ All PDF worker setup methods failed:', error);
    return false;
  }
}

export function resetPdfWorker(): void {
  isConfigured = false;
  if (typeof window !== 'undefined') {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      pdfjsLib.GlobalWorkerOptions.workerPort = null;
    } catch (error) {
      console.warn('Failed to reset PDF worker:', error);
    }
  }
}

// Auto-configure on import in browser environment
if (typeof window !== 'undefined') {
  configurePdfWorker();
}