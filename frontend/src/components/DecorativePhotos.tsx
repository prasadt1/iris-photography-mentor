import React from 'react';

/**
 * Decorative photo collage background - tasteful photography imagery
 * scattered around the edges to indicate this is an artistic/photography site.
 * Uses Unsplash source for high-quality free photos.
 */
export const DecorativePhotos: React.FC = () => {
  // Curated photography-related images from Unsplash (nature, portraits, architecture)
  const photos = [
    { id: 'photo-1506905925346-21bda4d32df4', position: 'top-8 -left-20', size: 'w-48 h-32', rotate: '-rotate-6', opacity: 'opacity-20' },
    { id: 'photo-1469474968028-56623f02e42e', position: 'top-32 -right-16', size: 'w-40 h-28', rotate: 'rotate-3', opacity: 'opacity-15' },
    { id: 'photo-1447752875215-b2761acb3c5d', position: 'top-[45%] -left-24', size: 'w-52 h-36', rotate: 'rotate-2', opacity: 'opacity-15' },
    { id: 'photo-1433086966358-54859d0ed716', position: 'bottom-48 -right-20', size: 'w-44 h-30', rotate: '-rotate-3', opacity: 'opacity-20' },
    { id: 'photo-1472214103451-9374bd1c798e', position: 'bottom-16 -left-16', size: 'w-36 h-24', rotate: 'rotate-6', opacity: 'opacity-15' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {photos.map((photo, idx) => (
        <div
          key={idx}
          className={`absolute ${photo.position} ${photo.size} ${photo.rotate} ${photo.opacity} blur-[1px]`}
        >
          <img
            src={`https://images.unsplash.com/${photo.id}?w=400&q=60&auto=format`}
            alt=""
            className="w-full h-full object-cover rounded-lg shadow-2xl shadow-black/50"
            loading="lazy"
          />
          {/* Film border effect */}
          <div className="absolute inset-0 rounded-lg border-4 border-white/10" />
        </div>
      ))}

      {/* Film strip decoration along bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center gap-1 opacity-10">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="flex-shrink-0">
            <div className="w-20 h-14 bg-surface-2 rounded-sm border border-warm/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 flex justify-between px-1">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="w-1.5 h-1.5 bg-black/40 rounded-full mt-0.5" />
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-2 flex justify-between px-1">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="w-1.5 h-1.5 bg-black/40 rounded-full mb-0.5" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scattered polaroid frames */}
      <div className="absolute top-20 right-[15%] w-24 h-28 bg-stone-100/5 rounded-sm shadow-xl rotate-12 opacity-10">
        <div className="w-full h-20 bg-surface-3/50 m-1.5" />
      </div>
      <div className="absolute bottom-[30%] left-[10%] w-20 h-24 bg-stone-100/5 rounded-sm shadow-xl -rotate-6 opacity-10">
        <div className="w-full h-16 bg-surface-3/50 m-1.5" />
      </div>
    </div>
  );
};
