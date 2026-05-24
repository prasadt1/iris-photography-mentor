/**
 * Spatial Overlay Component
 * Canvas-based rendering of bounding boxes and annotations on photos
 *
 * Phase 1.3: Ported from gemini3, simplified for Practice Companion
 */

import React, { useEffect, useRef } from 'react';
import type { SpatialAnnotation } from '../types';

interface SpatialOverlayProps {
  imageUrl: string;
  annotations: SpatialAnnotation[];
}

export const SpatialOverlay: React.FC<SpatialOverlayProps> = ({ imageUrl, annotations }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawOverlay = () => {
      // Set canvas size to match image
      canvas.width = image.width;
      canvas.height = image.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw bounding boxes
      annotations.forEach((annotation) => {
        const { bbox, severity, note } = annotation;

        // Choose color based on severity
        const color =
          severity === 'critical' ? '#f44336' :
          severity === 'moderate' ? '#ff9800' :
          '#fbc02d';

        // Draw bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(bbox.x, bbox.y, bbox.w, bbox.h);

        // Draw label background
        const labelPadding = 5;
        const labelHeight = 24;
        const labelWidth = ctx.measureText(note).width + labelPadding * 2;

        ctx.fillStyle = color;
        ctx.fillRect(bbox.x, bbox.y - labelHeight, labelWidth, labelHeight);

        // Draw label text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(note, bbox.x + labelPadding, bbox.y - labelPadding - 2);
      });
    };

    // Wait for image to load
    if (image.complete) {
      drawOverlay();
    } else {
      image.onload = drawOverlay;
    }

  }, [imageUrl, annotations]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Analysis subject"
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />

      {annotations.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          borderRadius: '4px',
          fontSize: '0.9em',
        }}>
          No spatial annotations
        </div>
      )}
    </div>
  );
};
