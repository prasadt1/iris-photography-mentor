/**
 * Photo Uploader Component
 * Drag-and-drop interface for uploading images for analysis
 *
 * Phase 1.3: Simplified from gemini3 source, stripped Ollama/demo refs
 */

import React, { useState, useCallback } from 'react';

interface PhotoUploaderProps {
  onUpload: (file: File) => Promise<void>;
  loading?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onUpload, loading = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Call upload handler
    await onUpload(file);
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <form
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="file"
          id="photo-upload"
          accept="image/*"
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={loading}
        />

        <label
          htmlFor="photo-upload"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            border: `2px dashed ${dragActive ? '#646cff' : '#ccc'}`,
            borderRadius: '8px',
            backgroundColor: dragActive ? '#f0f0ff' : '#fafafa',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '20px',
            transition: 'all 0.2s ease',
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '250px',
                borderRadius: '4px',
              }}
            />
          ) : (
            <>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: '#666', marginBottom: '16px' }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p style={{ fontSize: '1.1em', color: '#333', marginBottom: '8px' }}>
                {loading ? 'Analyzing...' : 'Drop photo here or click to upload'}
              </p>
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                Supports JPG, PNG, RAW formats
              </p>
            </>
          )}
        </label>
      </form>

      {loading && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#646cff', fontWeight: 'bold' }}>
            Coach analyzing photo...
          </p>
          <p style={{ fontSize: '0.9em', color: '#666' }}>
            Grounding in photography principles, running multimodal analysis
          </p>
        </div>
      )}
    </div>
  );
};
