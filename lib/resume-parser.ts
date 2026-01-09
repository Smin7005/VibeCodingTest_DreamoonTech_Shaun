import { supabaseAdmin } from './supabase';

// Type definition for pdf-parse result
interface PdfParseResult {
  text: string;
  numpages: number;
  info: Record<string, unknown>;
}

// Use require for pdf-parse v1.1.1 (CommonJS module)
// This avoids ESM compatibility issues with Next.js webpack
async function parsePdf(buffer: Buffer): Promise<PdfParseResult> {
  // Dynamic require to avoid webpack bundling issues
  const pdfParse = eval('require')('pdf-parse');
  return pdfParse(buffer);
}

// Minimum text length to consider a valid resume
const MIN_TEXT_LENGTH = 100;

// Maximum text length to send to Claude (to prevent token overflow)
const MAX_TEXT_LENGTH = 50000;

export interface ExtractedTextResult {
  text: string;
  pageCount: number;
  isValid: boolean;
  error?: string;
}

// Download PDF from Supabase Storage and extract text
export async function extractTextFromResume(filePath: string): Promise<ExtractedTextResult> {
  try {
    console.log(`📄 Downloading PDF from Supabase: ${filePath}`);

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('resumes')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('❌ Error downloading PDF:', downloadError);
      return {
        text: '',
        pageCount: 0,
        isValid: false,
        error: 'Failed to download resume file. Please try uploading again.',
      };
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`📝 Extracting text from PDF (${buffer.length} bytes)...`);

    // Parse PDF and extract text
    const pdfData = await parsePdf(buffer);

    const extractedText = pdfData.text || '';
    const pageCount = pdfData.numpages || 0;

    console.log(`✅ Extracted ${extractedText.length} characters from ${pageCount} pages`);

    // Validate extracted text
    const validation = validateExtractedText(extractedText);

    if (!validation.isValid) {
      return {
        text: extractedText,
        pageCount,
        isValid: false,
        error: validation.error,
      };
    }

    // Truncate if too long
    const truncatedText = extractedText.length > MAX_TEXT_LENGTH
      ? extractedText.substring(0, MAX_TEXT_LENGTH) + '\n\n[Content truncated due to length...]'
      : extractedText;

    return {
      text: truncatedText,
      pageCount,
      isValid: true,
    };

  } catch (error) {
    console.error('❌ Error extracting PDF text:', error);

    // Check for specific pdf-parse errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        return {
          text: '',
          pageCount: 0,
          isValid: false,
          error: 'The uploaded file appears to be an invalid or corrupted PDF.',
        };
      }
      if (error.message.includes('encrypted')) {
        return {
          text: '',
          pageCount: 0,
          isValid: false,
          error: 'The uploaded PDF is password-protected. Please upload an unprotected PDF.',
        };
      }
    }

    return {
      text: '',
      pageCount: 0,
      isValid: false,
      error: 'Failed to read the PDF content. Please ensure the file is a valid PDF.',
    };
  }
}

// Validate extracted text has sufficient content
export function validateExtractedText(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      error: 'No text could be extracted from the PDF. The file may be image-based or contain no readable text.',
    };
  }

  if (text.trim().length < MIN_TEXT_LENGTH) {
    return {
      isValid: false,
      error: 'The extracted text is too short. Please ensure your resume contains sufficient content.',
    };
  }

  // Check if text contains mostly non-printable characters (likely a scan)
  const printableChars = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  if (printableChars.length < text.length * 0.5) {
    return {
      isValid: false,
      error: 'The PDF appears to contain mostly non-text content. Please upload a text-based PDF.',
    };
  }

  return { isValid: true };
}

// Clean and normalize extracted text
export function cleanExtractedText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove page numbers and headers/footers patterns
    .replace(/Page \d+ of \d+/gi, '')
    // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim();
}

// Parse date strings from various formats to a normalized format
export function parseDateString(dateStr: string | null): { month: number; year: number } | null {
  if (!dateStr || dateStr.toLowerCase() === 'present') {
    return null;
  }

  // Try MM/YYYY format
  const mmYYYY = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYYYY) {
    return { month: parseInt(mmYYYY[1]), year: parseInt(mmYYYY[2]) };
  }

  // Try Month YYYY format (e.g., "January 2020")
  const monthYYYY = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYYYY) {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                        'july', 'august', 'september', 'october', 'november', 'december'];
    const monthIndex = monthNames.indexOf(monthYYYY[1].toLowerCase());
    if (monthIndex !== -1) {
      return { month: monthIndex + 1, year: parseInt(monthYYYY[2]) };
    }
  }

  // Try YYYY-MM format
  const yyyyMM = dateStr.match(/^(\d{4})-(\d{1,2})$/);
  if (yyyyMM) {
    return { month: parseInt(yyyyMM[2]), year: parseInt(yyyyMM[1]) };
  }

  // Try just year
  const year = dateStr.match(/^(\d{4})$/);
  if (year) {
    return { month: 1, year: parseInt(year[1]) };
  }

  return null;
}

// Calculate duration between two dates
export function calculateDuration(startDate: string | null, endDate: string | null): string {
  const start = parseDateString(startDate);
  const end = endDate?.toLowerCase() === 'present'
    ? { month: new Date().getMonth() + 1, year: new Date().getFullYear() }
    : parseDateString(endDate);

  if (!start || !end) {
    return '';
  }

  const totalMonths = (end.year - start.year) * 12 + (end.month - start.month);

  if (totalMonths < 0) {
    return '';
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0 && months === 0) {
    return 'Less than a month';
  }

  const yearStr = years > 0 ? `${years} year${years !== 1 ? 's' : ''}` : '';
  const monthStr = months > 0 ? `${months} month${months !== 1 ? 's' : ''}` : '';

  return [yearStr, monthStr].filter(Boolean).join(' ');
}
