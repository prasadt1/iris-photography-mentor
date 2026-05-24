/**
 * Practice Companion Types
 * Based on spec.md §7.2 MongoDB schema
 */

export interface AnalysisScores {
  composition: number;      // 0-10
  lighting: number;         // 0-10
  technique: number;        // 0-10
  creativity: number;       // 0-10
  subject_impact: number;   // 0-10
}

export interface PriorityFix {
  severity: 'critical' | 'moderate' | 'minor';
  issue: string;
}

export interface GlassBox {
  observations: string[];
  reasoning_steps: string[];
  priority_fixes: PriorityFix[];
  grounding_principles?: string[];  // Which Data Store principles were used
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SpatialAnnotation {
  bbox: BoundingBox;
  severity: string;
  note: string;
}

export interface SubjectRelationships {
  primary_subject_position: string;
  secondary_subjects: Array<{
    position: string;
    relationship_to_primary: string;
  }>;
  depth_axis: string;
  leading_lines_present: boolean;
}

export interface LightingMap {
  key_light_direction: string;
  fill_light_strength: 'absent' | 'low' | 'moderate' | 'high';
  rim_light_present: boolean;
  color_temperature: 'warm' | 'neutral' | 'cool' | 'mixed';
  shadow_character: 'hard' | 'soft' | 'mixed';
}

export interface SpatialMetadata {
  annotations: SpatialAnnotation[];
  subject_relationships: SubjectRelationships;
  lighting_map: LightingMap;
}

export interface PortfolioEntry {
  _id: string;
  user_id: string;
  shoot_id: string;
  image_url: string;
  thumbnail_url: string;
  exif?: Record<string, any>;
  scores: AnalysisScores;
  glass_box: GlassBox;
  spatial_metadata: SpatialMetadata;
  aesthetic_tags: string[];
  embedding?: number[];
  created_at: string;
}

export interface AnalysisResult {
  portfolioEntryId: string;
  scores: AnalysisScores;
  glassBox: GlassBox;
  spatialMetadata: SpatialMetadata;
  aestheticTags: string[];
}

// Assignment types (spec §7.2)
export interface SkillDelta {
  metric: string;
  baseline_value: number;
  current_value: number;
  delta: number;
}

export interface Assignment {
  _id: string;
  user_id: string;
  status: 'proposed' | 'active' | 'completed' | 'abandoned';
  brief: string;
  target_skill: string;
  rationale: string;
  baseline_shoot_ids: string[];
  completion_shoot_ids: string[];
  skill_delta?: SkillDelta;
  created_at: string;
  completed_at?: string;
}

// Mode types
export type UserMode = 'hobbyist' | 'working_pro';
