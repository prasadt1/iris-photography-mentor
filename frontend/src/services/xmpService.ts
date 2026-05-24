/**
 * XMP Sidecar Service
 * Generates XMP files for Lightroom Classic import
 *
 * Phase 1.3: Ported from gemma4, exports Practice Companion metadata
 */

import type { AnalysisResult } from '../types';

export interface XMPExportOptions {
  result: AnalysisResult;
  originalFilename: string;
}

/**
 * Generate XMP sidecar content for Lightroom Classic
 * Maps Practice Companion scores and tags to XMP/IPTC metadata
 */
export function generateXMP(options: XMPExportOptions): string {
  const { result } = options;
  const { scores, glassBox, aestheticTags } = result;

  // Calculate star rating (0-5) from average score (0-10)
  const avgScore = Object.values(scores).reduce((sum, s) => sum + s, 0) / 5;
  const starRating = Math.round((avgScore / 10) * 5);

  // Determine color label based on highest severity
  const criticalCount = glassBox.priority_fixes.filter(f => f.severity === 'critical').length;
  const colorLabel = criticalCount > 0 ? 'Red' : criticalCount === 0 && glassBox.priority_fixes.length > 0 ? 'Yellow' : 'Green';

  // Combine observations into description
  const description = glassBox.observations.join(' ');

  // IPTC keywords from aesthetic tags + skills
  const keywords = [
    ...aestheticTags,
    `composition_${scores.composition.toFixed(1)}`,
    `lighting_${scores.lighting.toFixed(1)}`,
    `technique_${scores.technique.toFixed(1)}`,
  ];

  const xmpContent = `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">

      <!-- Star Rating (0-5) -->
      <xmp:Rating>${starRating}</xmp:Rating>

      <!-- Color Label -->
      <xmp:Label>${colorLabel}</xmp:Label>

      <!-- Creator -->
      <dc:creator>
        <rdf:Seq>
          <rdf:li>Practice Companion AI</rdf:li>
        </rdf:Seq>
      </dc:creator>

      <!-- Description (Glass Box observations) -->
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXML(description)}</rdf:li>
        </rdf:Alt>
      </dc:description>

      <!-- IPTC Keywords (aesthetic tags + scores) -->
      <dc:subject>
        <rdf:Bag>
${keywords.map(kw => `          <rdf:li>${escapeXML(kw)}</rdf:li>`).join('\n')}
        </rdf:Bag>
      </dc:subject>

      <!-- Photoshop Headline (Priority Fix Summary) -->
      <photoshop:Headline>${escapeXML(glassBox.priority_fixes[0]?.issue || 'No critical issues')}</photoshop:Headline>

      <!-- Instructions (Top Priority Fix) -->
      <photoshop:Instructions>${escapeXML(
        glassBox.priority_fixes
          .filter(f => f.severity === 'critical' || f.severity === 'moderate')
          .map(f => f.issue)
          .join('; ') || 'Continue current approach'
      )}</photoshop:Instructions>

    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;

  return xmpContent;
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download XMP file for a given result
 */
export function downloadXMP(options: XMPExportOptions): void {
  const xmpContent = generateXMP(options);
  const xmpFilename = options.originalFilename.replace(/\.[^.]+$/, '.xmp');

  const blob = new Blob([xmpContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = xmpFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Batch export multiple results as ZIP (Phase 3 enhancement)
 * For now, exports single XMP file
 */
export function exportBatchXMP(results: Array<{ result: AnalysisResult; filename: string }>): void {
  // Phase 1: single file only
  if (results.length === 1) {
    downloadXMP({ result: results[0].result, originalFilename: results[0].filename });
    return;
  }

  // Phase 3: implement ZIP generation with JSZip
  console.warn('Batch XMP export requires JSZip library - implementing in Phase 3');
  alert('Batch export coming in Phase 3. For now, export images individually.');
}
