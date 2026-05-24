/**
 * Agent Engine API Client
 *
 * Phase 1 stub: will implement calls to Agent Engine endpoint in Phase 3
 * Replaces direct Gemini API calls from source repos
 */

// API_BASE_URL will be used in Phase 3 for Agent Engine calls
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface AnalyzePhotoRequest {
  imageFile: File;
  userId?: string;
  shootId?: string;
}

export interface AnalyzePhotoResponse {
  portfolioEntryId: string;
  scores: {
    composition: number;
    lighting: number;
    technique: number;
    creativity: number;
    subject_impact: number;
  };
  glassBox: {
    observations: string[];
    reasoningSteps: string[];
    priorityFixes: Array<{ severity: string; issue: string }>;
  };
  spatialMetadata: any;
  aestheticTags: string[];
}

export async function analyzePhoto(request: AnalyzePhotoRequest): Promise<AnalyzePhotoResponse> {
  // Phase 1 stub: return mock response
  console.log('analyzePhoto called (stub):', request);

  throw new Error('Agent Engine integration not yet implemented. Available in Phase 3.');
}

export async function queryMemory(query: string): Promise<any> {
  // Phase 1 stub
  console.log('queryMemory called (stub):', query);

  throw new Error('Agent Engine integration not yet implemented. Available in Phase 3.');
}

export async function getActiveAssignment(userId: string): Promise<any> {
  // Phase 1 stub
  console.log('getActiveAssignment called (stub):', userId);

  throw new Error('Agent Engine integration not yet implemented. Available in Phase 3.');
}
