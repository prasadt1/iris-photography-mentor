/**
 * Analysis Results Component
 * Displays Glass Box critique with 5-axis scoring and priority fixes
 *
 * Phase 1.3: Simplified from gemini3 source, focusing on core critique display
 */

import React, { useState } from 'react';
import type { AnalysisResult } from '../types';
import { SpatialOverlay } from './SpatialOverlay';

interface AnalysisResultsProps {
  result: AnalysisResult;
  imageUrl: string;
}

type Tab = 'overview' | 'glass-box' | 'spatial';

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, imageUrl }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { scores, glassBox, spatialMetadata, aestheticTags } = result;

  // Calculate average score
  const avgScore = (
    Object.values(scores).reduce((sum, score) => sum + score, 0) / 5
  ).toFixed(1);

  // Severity color mapping
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#d32f2f';
      case 'moderate': return '#f57c00';
      case 'minor': return '#fbc02d';
      default: return '#666';
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #eee', backgroundColor: '#f9f9f9' }}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'glass-box', label: 'Glass Box Reasoning' },
          { key: 'spatial', label: 'Spatial Analysis' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as Tab)}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #646cff' : 'none',
              background: activeTab === tab.key ? 'white' : 'transparent',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '20px', backgroundColor: 'white' }}>
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ marginTop: 0 }}>5-Axis Skill Assessment</h3>

            {/* Score bars */}
            <div style={{ marginBottom: '30px' }}>
              {Object.entries(scores).map(([skill, score]) => (
                <div key={skill} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                      {skill.replace('_', ' ')}
                    </span>
                    <span style={{ fontWeight: 'bold', color: score >= 7 ? '#4caf50' : score >= 5 ? '#ff9800' : '#f44336' }}>
                      {score.toFixed(1)}/10
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${(score / 10) * 100}%`,
                      height: '100%',
                      backgroundColor: score >= 7 ? '#4caf50' : score >= 5 ? '#ff9800' : '#f44336',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Overall verdict */}
            <div style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              marginBottom: '20px',
            }}>
              <strong>Overall Score: {avgScore}/10</strong>
              <p style={{ margin: '10px 0 0 0', color: '#666' }}>
                {parseFloat(avgScore) >= 7 ? 'Strong work! Continue refining your technique.' :
                 parseFloat(avgScore) >= 5 ? 'Good foundation. Focus on the priority improvements below.' :
                 'Significant room for growth. Review the Glass Box reasoning for guidance.'}
              </p>
            </div>

            {/* Aesthetic tags */}
            {aestheticTags.length > 0 && (
              <div>
                <strong>Aesthetic Tags:</strong>
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {aestheticTags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: '12px',
                        fontSize: '0.9em',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'glass-box' && (
          <div>
            <h3 style={{ marginTop: 0 }}>Transparent Reasoning</h3>

            {/* Grounding Principles */}
            {glassBox.grounding_principles && glassBox.grounding_principles.length > 0 && (
              <div style={{ marginBottom: '25px', padding: '12px', backgroundColor: '#f0f7ff', borderLeft: '4px solid #2196f3', borderRadius: '4px' }}>
                <strong style={{ color: '#1565c0' }}>📚 Grounded in Principles:</strong>
                <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
                  {glassBox.grounding_principles.join(', ')}
                </div>
              </div>
            )}

            {/* Observations */}
            <div style={{ marginBottom: '25px' }}>
              <h4>Observations</h4>
              <ul style={{ lineHeight: 1.6 }}>
                {glassBox.observations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>

            {/* Reasoning Steps */}
            <div style={{ marginBottom: '25px' }}>
              <h4>Reasoning Process</h4>
              <ol style={{ lineHeight: 1.6 }}>
                {glassBox.reasoning_steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Priority Fixes */}
            <div>
              <h4>Priority Improvements</h4>
              {glassBox.priority_fixes.map((fix, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '12px',
                    padding: '12px',
                    borderLeft: `4px solid ${getSeverityColor(fix.severity)}`,
                    backgroundColor: '#fafafa',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong style={{ color: getSeverityColor(fix.severity), textTransform: 'uppercase', fontSize: '0.85em' }}>
                      {fix.severity}
                    </strong>
                  </div>
                  <p style={{ margin: 0 }}>{fix.issue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'spatial' && (
          <div>
            <h3 style={{ marginTop: 0 }}>Spatial & Lighting Analysis</h3>

            {/* Spatial overlay with image */}
            <div style={{ marginBottom: '25px' }}>
              <SpatialOverlay
                imageUrl={imageUrl}
                annotations={spatialMetadata.annotations}
              />
            </div>

            {/* Subject Relationships */}
            <div style={{ marginBottom: '20px' }}>
              <h4>Subject Composition</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><strong>Primary Subject Position:</strong> {spatialMetadata.subject_relationships.primary_subject_position}</li>
                <li><strong>Depth Axis:</strong> {spatialMetadata.subject_relationships.depth_axis}</li>
                <li><strong>Leading Lines:</strong> {spatialMetadata.subject_relationships.leading_lines_present ? 'Present' : 'Absent'}</li>
                {spatialMetadata.subject_relationships.secondary_subjects.length > 0 && (
                  <li>
                    <strong>Secondary Subjects:</strong>
                    <ul>
                      {spatialMetadata.subject_relationships.secondary_subjects.map((sub, idx) => (
                        <li key={idx}>{sub.position} — {sub.relationship_to_primary}</li>
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
            </div>

            {/* Lighting Map */}
            <div>
              <h4>Lighting Analysis</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><strong>Key Light Direction:</strong> {spatialMetadata.lighting_map.key_light_direction}</li>
                <li><strong>Fill Light Strength:</strong> {spatialMetadata.lighting_map.fill_light_strength}</li>
                <li><strong>Rim Light:</strong> {spatialMetadata.lighting_map.rim_light_present ? 'Present' : 'Absent'}</li>
                <li><strong>Color Temperature:</strong> {spatialMetadata.lighting_map.color_temperature}</li>
                <li><strong>Shadow Character:</strong> {spatialMetadata.lighting_map.shadow_character}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
