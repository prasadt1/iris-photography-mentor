import React, { useEffect, useRef, useState } from 'react';

/**
 * Subtle parallax photography background.
 * Shows curated photography images at very low opacity with parallax scroll movement.
 * Images are blurred, desaturated, and masked with vignette for non-distracting aesthetics.
 */

// Curated photography-related images from Unsplash (high quality, photography theme)
const PARALLAX_IMAGES = [
  // Camera/equipment shots
  'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=60', // vintage camera
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=60', // camera with lens
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=60', // camera on tripod
  // Abstract/artistic photography
  'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=800&q=60', // film strips
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=60', // abstract light
  // Darkroom/process imagery
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=60', // prints drying
];

interface ParallaxLayer {
  src: string;
  x: number; // % from left
  y: number; // % from top
  size: number; // px width
  speed: number; // parallax multiplier (0.1 = slow, 0.5 = fast)
  rotation: number; // degrees
  opacity: number; // 0-1
}

// Generate distributed layers for visual interest
const generateLayers = (): ParallaxLayer[] => {
  const layers: ParallaxLayer[] = [];
  const positions = [
    { x: 2, y: 8 },
    { x: 78, y: 3 },
    { x: 88, y: 40 },
    { x: 5, y: 55 },
    { x: 75, y: 70 },
    { x: 45, y: 85 },
  ];

  PARALLAX_IMAGES.forEach((src, i) => {
    const pos = positions[i % positions.length];
    layers.push({
      src,
      x: pos.x + (Math.random() * 8 - 4),
      y: pos.y + (Math.random() * 8 - 4),
      size: 280 + Math.random() * 180, // 280-460px (much larger)
      speed: 0.03 + Math.random() * 0.12, // 0.03-0.15
      rotation: Math.random() * 12 - 6, // -6 to 6 degrees (less rotation)
      opacity: 0.35 + Math.random() * 0.15, // 0.35-0.50 (much more visible)
    });
  });

  return layers;
};

export const PhotoParallax: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [scrollY, setScrollY] = useState(0);
  const [layers] = useState(generateLayers);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const loadedCount = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Preload images
  useEffect(() => {
    layers.forEach((layer) => {
      const img = new Image();
      img.onload = () => {
        loadedCount.current++;
        if (loadedCount.current >= layers.length) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount.current++;
        if (loadedCount.current >= layers.length) {
          setImagesLoaded(true);
        }
      };
      img.src = layer.src;
    });
  }, [layers]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Vignette overlay - very soft edge fade */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: `radial-gradient(ellipse at center, transparent 60%, var(--color-canvas) 95%)`,
        }}
      />

      {/* Parallax photo layers */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          imagesLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {layers.map((layer, i) => (
          <div
            key={i}
            className="absolute rounded-lg overflow-hidden"
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              width: `${layer.size}px`,
              height: `${layer.size * 0.67}px`, // 3:2 aspect ratio
              transform: `
                translateY(${scrollY * layer.speed}px)
                rotate(${layer.rotation}deg)
              `,
              opacity: layer.opacity,
              filter: 'saturate(0.7) brightness(0.9)',
              willChange: 'transform',
            }}
          >
            <img
              src={layer.src}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

{/* Gradient overlay removed for better visibility */}
    </div>
  );
};
