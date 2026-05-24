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

// Use AnalysisResult from types
import type { AnalysisResult } from '../types';
export type AnalyzePhotoResponse = AnalysisResult;

export async function analyzePhoto(request: AnalyzePhotoRequest): Promise<AnalyzePhotoResponse> {
  // Phase 1: return mock response until Agent Engine integration in Phase 2
  console.log('analyzePhoto called (Phase 1 mock):', request);

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock response matching spec §7.2 schema
  const mockResponse: AnalyzePhotoResponse = {
    portfolioEntryId: `mock_${Date.now()}`,
    scores: {
      composition: 6.5,
      lighting: 7.2,
      technique: 5.8,
      creativity: 6.0,
      subject_impact: 7.5,
    },
    glassBox: {
      observations: [
        'Subject positioned slightly off-center, creating dynamic tension',
        'Natural lighting from camera right provides good separation',
        'Shallow depth of field effectively isolates the subject',
        'Background elements compete for attention in upper right quadrant',
      ],
      reasoning_steps: [
        'Analyzed compositional elements using rule of thirds framework',
        'Evaluated lighting quality and direction relative to subject',
        'Assessed technical execution (focus, exposure, sharpness)',
        'Considered creative choices and subject impact',
      ],
      priority_fixes: [
        {
          severity: 'moderate',
          issue: 'Reframe to place subject on right third for stronger lead-in from left negative space',
        },
        {
          severity: 'minor',
          issue: 'Clone out distracting background element in upper right to strengthen subject isolation',
        },
      ],
      grounding_principles: ['composition.md', 'lighting.md', 'subject_impact.md'],
    },
    spatialMetadata: {
      annotations: [
        {
          bbox: { x: 120, y: 80, w: 200, h: 300 },
          severity: 'moderate',
          note: 'Primary subject area',
        },
        {
          bbox: { x: 350, y: 50, w: 80, h: 60 },
          severity: 'minor',
          note: 'Distracting element',
        },
      ],
      subject_relationships: {
        primary_subject_position: 'center_slight_right',
        secondary_subjects: [
          {
            position: 'upper_right',
            relationship_to_primary: 'competing_for_attention',
          },
        ],
        depth_axis: 'foreground_midground',
        leading_lines_present: false,
      },
      lighting_map: {
        key_light_direction: 'upper_right',
        fill_light_strength: 'low',
        rim_light_present: false,
        color_temperature: 'neutral',
        shadow_character: 'soft',
      },
    },
    aestheticTags: ['portrait', 'shallow_dof', 'natural_light', 'warm_tones'],
  };

  return mockResponse;
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
