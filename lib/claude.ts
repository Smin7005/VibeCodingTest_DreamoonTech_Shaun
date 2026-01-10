import Anthropic from '@anthropic-ai/sdk';
import { WorkExperience } from './supabase';

// Initialize Anthropic client with timeout configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 60 * 1000, // 60 second timeout as per spec
  maxRetries: 2, // Retry for transient errors
});

// Types for structured analysis response
export interface BasicInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface ExtractedExperience {
  companyName: string;
  jobTitle: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  location: string | null;
}

export interface DateDiscrepancy {
  companyName: string;
  field: 'startDate' | 'endDate';
  manualValue: string | null;
  extractedValue: string | null;
  message: string;
}

export interface ResumeAnalysisResult {
  basicInfo: BasicInfo;
  skills: string[];
  experiences: ExtractedExperience[];
  grammarCorrections: string;
  careerAdvice: string[];
  improvementSuggestions: string;
}

// Helper to parse month difference between two dates
function parseDate(dateStr: string | null): Date | null {
  if (!dateStr || dateStr.toLowerCase() === 'present') return null;

  // Try to parse MM/YYYY format
  const mmYYYYMatch = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYYYYMatch) {
    return new Date(parseInt(mmYYYYMatch[2]), parseInt(mmYYYYMatch[1]) - 1, 1);
  }

  // Try to parse YYYY-MM format
  const yyyyMMMatch = dateStr.match(/^(\d{4})-(\d{1,2})$/);
  if (yyyyMMMatch) {
    return new Date(parseInt(yyyyMMMatch[1]), parseInt(yyyyMMMatch[2]) - 1, 1);
  }

  // Try to parse full date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

// Calculate month difference between two dates
function monthDifference(date1: string | null, date2: string | null): number {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  // If either date is null (Present), consider no discrepancy
  if (!d1 || !d2) return 0;

  const months1 = d1.getFullYear() * 12 + d1.getMonth();
  const months2 = d2.getFullYear() * 12 + d2.getMonth();

  return Math.abs(months1 - months2);
}

// Detect date discrepancies between manual and extracted experiences
export function detectDateDiscrepancies(
  extractedExperiences: ExtractedExperience[],
  manualExperiences: WorkExperience[]
): DateDiscrepancy[] {
  const discrepancies: DateDiscrepancy[] = [];

  for (const manual of manualExperiences) {
    // Find matching extracted experience by company name (fuzzy match)
    const extracted = extractedExperiences.find(e => {
      const extractedCompany = e.companyName.toLowerCase().trim();
      const manualCompany = manual.company_name.toLowerCase().trim();
      return extractedCompany.includes(manualCompany) ||
             manualCompany.includes(extractedCompany) ||
             extractedCompany === manualCompany;
    });

    if (extracted) {
      // Convert manual dates to MM/YYYY format for comparison
      const manualStartStr = manual.start_date ?
        new Date(manual.start_date).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }).replace(',', '') : null;
      const manualEndStr = manual.is_current ? 'Present' :
        manual.end_date ? new Date(manual.end_date).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }).replace(',', '') : null;

      const startDiff = monthDifference(manualStartStr, extracted.startDate);
      const endDiff = monthDifference(manualEndStr, extracted.endDate);

      if (startDiff > 1) {
        discrepancies.push({
          companyName: manual.company_name,
          field: 'startDate',
          manualValue: manualStartStr,
          extractedValue: extracted.startDate,
          message: `Date discrepancy: Your resume shows you started at ${manual.company_name} on ${extracted.startDate}, but your profile says ${manualStartStr}. Please verify and update.`
        });
      }

      if (endDiff > 1 && !manual.is_current && !extracted.isCurrent) {
        discrepancies.push({
          companyName: manual.company_name,
          field: 'endDate',
          manualValue: manualEndStr,
          extractedValue: extracted.endDate,
          message: `Date discrepancy: Your resume shows you ended at ${manual.company_name} on ${extracted.endDate}, but your profile says ${manualEndStr}. Please verify and update.`
        });
      }
    }
  }

  return discrepancies;
}

// Build the Claude prompt for resume analysis
function buildAnalysisPrompt(resumeText: string, userType: 'free' | 'member'): string {
  const adviceCount = userType === 'member' ? 'at least 10 detailed' : '3-5 concise';

  return `You are an expert resume analyst and career advisor. Analyze the following resume text and provide a comprehensive analysis.

RESUME TEXT:
---
${resumeText}
---

Please provide your analysis in the following JSON format. Be thorough and accurate:

{
  "basicInfo": {
    "name": "Full name or null if not found",
    "email": "Email address or null if not found",
    "phone": "Phone number or null if not found",
    "address": "Full address or null if not found"
  },
  "skills": ["skill1", "skill2", "skill3"],
  "experiences": [
    {
      "companyName": "Company Name",
      "jobTitle": "Job Title",
      "startDate": "MM/YYYY or null if not found",
      "endDate": "MM/YYYY or 'Present' or null if not found",
      "isCurrent": true,
      "description": "Brief description of responsibilities or null",
      "location": "City, State or null if not found"
    }
  ],
  "grammarCorrections": "List of grammar and spelling issues found with corrections, or 'No significant issues found'",
  "careerAdvice": [
    "Specific, actionable advice point 1",
    "Specific, actionable advice point 2"
  ],
  "improvementSuggestions": "Paragraph with formatting and content improvement suggestions for the resume"
}

IMPORTANT GUIDELINES:
1. Extract ALL skills mentioned, including technical skills, soft skills, tools, technologies, and domain-specific skills. Remove duplicates.
2. For dates, use MM/YYYY format. If only year is present, use 01/YYYY. If the job is current, set endDate to "Present" and isCurrent to true.
3. Mark experiences as "isCurrent": true ONLY if they explicitly mention "Present", "Current", or have no end date.
4. Provide ${adviceCount} career advice points focusing on:
   - Skill gaps for career advancement
   - ATS (Applicant Tracking System) optimization
   - Resume formatting improvements
   - Industry trends and recommendations
   - Content optimization suggestions
5. Be specific in suggestions - reference actual content from the resume when possible.
6. For grammarCorrections, list specific issues found (e.g., "Changed 'recieved' to 'received'").
7. Return ONLY valid JSON, no markdown formatting or additional text.`;
}

// Main function to analyze resume using Claude API
export async function analyzeResume(
  resumeText: string,
  userType: 'free' | 'member'
): Promise<ResumeAnalysisResult> {
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error('Resume text is too short or empty. Please ensure the PDF contains readable text.');
  }

  const prompt = buildAnalysisPrompt(resumeText, userType);

  try {
    console.log('📝 Calling Claude API for resume analysis...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Check if response was truncated
    if (message.stop_reason === 'max_tokens') {
      console.warn('⚠️ Claude response was truncated due to max_tokens limit');
      throw new Error('Analysis response was too long. Please try again.');
    }

    // Extract text content from response
    const responseContent = message.content[0];
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    const responseText = responseContent.text.trim();

    // Parse JSON response
    let parsedResponse: ResumeAnalysisResult;
    try {
      // Try to extract JSON if wrapped in code blocks
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      parsedResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response as JSON:', responseText.substring(0, 500));
      throw new Error('Failed to parse analysis results. Please try again.');
    }

    // Validate response structure
    if (!parsedResponse.basicInfo || !Array.isArray(parsedResponse.skills)) {
      throw new Error('Invalid analysis response structure');
    }

    // Ensure arrays are properly formatted
    if (!Array.isArray(parsedResponse.experiences)) {
      parsedResponse.experiences = [];
    }
    if (!Array.isArray(parsedResponse.careerAdvice)) {
      parsedResponse.careerAdvice = [];
    }

    // Ensure strings have defaults
    parsedResponse.grammarCorrections = parsedResponse.grammarCorrections || 'No significant issues found';
    parsedResponse.improvementSuggestions = parsedResponse.improvementSuggestions || '';

    console.log('✅ Claude API analysis completed successfully');
    return parsedResponse;

  } catch (error) {
    if (error instanceof Anthropic.APIConnectionError) {
      console.error('❌ Claude API connection error:', error.message);
      throw new Error('Unable to connect to AI service. Please try again.');
    }

    if (error instanceof Anthropic.RateLimitError) {
      console.error('❌ Claude API rate limit exceeded');
      throw new Error('Too many requests. Please wait a moment and try again.');
    }

    if (error instanceof Anthropic.APIError) {
      console.error('❌ Claude API error:', error.message);
      throw new Error('AI analysis failed. Please try again.');
    }

    // Re-throw if it's our own error
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('An unexpected error occurred during analysis.');
  }
}
